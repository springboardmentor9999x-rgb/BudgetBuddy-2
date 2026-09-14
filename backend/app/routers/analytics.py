import datetime
from calendar import month_name
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import User, Expense, Income, SavingsGoal, Budget
from app import security

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/spending-by-category")
def get_spending_by_category(
    months: int = Query(12, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:
    cat_rows = (
        db.query(Expense.category, func.sum(Expense.amount).label("total_amount"))
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    total = sum(r.total_amount for r in cat_rows) if cat_rows else 0.0

    return [
        {
            "category": r.category,
            "amount": float(r.total_amount),
            "percentage": round((float(r.total_amount) / total * 100), 1) if total > 0 else 0.0
        }
        for r in cat_rows
    ]


@router.get("/monthly-trend")
def get_monthly_trend(
    months: int = Query(12, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:
    now = datetime.datetime.utcnow()
    trends = []

    for i in range(months - 1, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1

        inc_sum = (
            db.query(func.sum(Income.amount))
            .filter(
                Income.user_id == current_user.id,
                extract("month", Income.date) == m,
                extract("year", Income.date) == y
            )
            .scalar() or 0.0
        )

        exp_sum = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.user_id == current_user.id,
                extract("month", Expense.date) == m,
                extract("year", Expense.date) == y
            )
            .scalar() or 0.0
        )

        net = float(inc_sum) - float(exp_sum)

        trends.append({
            "month_key": f"{y}-{m:02d}",
            "month_label": f"{month_name[m][:3]} {y}",
            "income": float(inc_sum),
            "expenses": float(exp_sum),
            "net": net
        })

    return trends


@router.get("/savings-progress")
def get_savings_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at.desc()).all()

    return [
        {
            "id": g.id,
            "title": g.title,
            "goal_type": g.goal_type,
            "target": float(g.target_amount),
            "current": float(g.current_amount),
            "remaining": max(0.0, float(g.target_amount - g.current_amount)),
            "percentage": round((g.current_amount / g.target_amount * 100), 1) if g.target_amount > 0 else 0.0,
            "status": g.status
        }
        for g in goals
    ]


@router.get("/expense-distribution")
def get_expense_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()

    bins = [
        {"range": "0–500", "min": 0, "max": 500, "count": 0, "total_amount": 0.0},
        {"range": "500–1000", "min": 500, "max": 1000, "count": 0, "total_amount": 0.0},
        {"range": "1000–2000", "min": 1000, "max": 2000, "count": 0, "total_amount": 0.0},
        {"range": "2000–5000", "min": 2000, "max": 5000, "count": 0, "total_amount": 0.0},
        {"range": "5000+", "min": 5000, "max": float("inf"), "count": 0, "total_amount": 0.0},
    ]

    for exp in expenses:
        amt = float(exp.amount)
        if amt <= 500:
            bins[0]["count"] += 1
            bins[0]["total_amount"] += amt
        elif amt <= 1000:
            bins[1]["count"] += 1
            bins[1]["total_amount"] += amt
        elif amt <= 2000:
            bins[2]["count"] += 1
            bins[2]["total_amount"] += amt
        elif amt <= 5000:
            bins[3]["count"] += 1
            bins[3]["total_amount"] += amt
        else:
            bins[4]["count"] += 1
            bins[4]["total_amount"] += amt

    return bins


@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> Dict[str, Any]:
    total_income = (
        db.query(func.sum(Income.amount))
        .filter(Income.user_id == current_user.id)
        .scalar() or 0.0
    )

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.user_id == current_user.id)
        .scalar() or 0.0
    )

    remaining_balance = float(total_income) - float(total_expenses)

    total_savings = (
        db.query(func.sum(SavingsGoal.current_amount))
        .filter(SavingsGoal.user_id == current_user.id)
        .scalar() or 0.0
    )

    savings_rate = round((float(total_savings) / float(total_income) * 100), 1) if total_income > 0 else 0.0

    active_goals_count = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id, SavingsGoal.status == "in_progress").count()
    completed_goals_count = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id, SavingsGoal.status == "completed").count()

    now = datetime.datetime.utcnow()
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month == now.month, Budget.year == now.year).all()
    total_budget = sum(b.monthly_limit for b in budgets) if budgets else 0.0

    cat_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == now.month,
            extract("year", Expense.date) == now.year
        )
        .scalar() or 0.0
    )

    budget_usage_pct = round((float(cat_expenses) / float(total_budget) * 100), 1) if total_budget > 0 else 0.0

    return {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "remaining_balance": remaining_balance,
        "total_savings": float(total_savings),
        "savings_rate": savings_rate,
        "active_goals_count": active_goals_count,
        "completed_goals_count": completed_goals_count,
        "total_budget": float(total_budget),
        "total_budget_spent": float(cat_expenses),
        "budget_usage_percentage": budget_usage_pct
    }
