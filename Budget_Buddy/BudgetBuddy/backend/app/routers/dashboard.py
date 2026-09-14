import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import User, Account, Income, Expense, Budget, SavingsGoal, GoalContribution
from app import security
from app.routers.budgets import calculate_budget_metrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def format_account_label(bank_name: str, account_name: str) -> str:
    b = (bank_name or "").strip()
    a = (account_name or "").strip()
    if not b:
        return a or "Account"
    if not a or b.lower() == a.lower():
        return b
    if b.lower() in a.lower():
        return a
    return f"{b} ({a})"


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> Dict[str, Any]:
    now = datetime.datetime.utcnow()
    current_month = now.month
    current_year = now.year

    # User accounts
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    number_of_accounts = len(accounts)

    # Total account wealth (sum of account current balances)
    total_balance = sum(acc.current_balance for acc in accounts) if accounts else 0.0
    
    # Available balance is specifically the sum of bank accounts
    available_balance = total_balance

    # Total lifetime Income & Expense
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

    total_in_goals = (
        db.query(func.sum(SavingsGoal.current_amount))
        .filter(SavingsGoal.user_id == current_user.id)
        .scalar() or 0.0
    )

    # Monthly statistics
    monthly_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == current_user.id,
            extract("month", Income.date) == current_month,
            extract("year", Income.date) == current_year
        )
        .scalar() or 0.0
    )

    monthly_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == current_month,
            extract("year", Expense.date) == current_year
        )
        .scalar() or 0.0
    )

    monthly_savings = monthly_income - monthly_expenses

    # Account balances list
    account_balances = [
        {
            "id": acc.id,
            "bank_name": acc.bank_name,
            "account_name": acc.account_name,
            "account_type": acc.account_type,
            "opening_balance": acc.opening_balance,
            "current_balance": acc.current_balance,
            "last4": acc.last4
        }
        for acc in accounts
    ]

    # Category breakdown for expenses
    cat_rows = (
        db.query(Expense.category, func.sum(Expense.amount).label("total_amount"))
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .all()
    )
    category_totals = [
        {"category": r.category, "amount": float(r.total_amount)}
        for r in cat_rows
    ]

    # Recent 10 transactions (combined Incomes, Expenses, and Goal Contributions)
    incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    contributions = db.query(GoalContribution).filter(GoalContribution.user_id == current_user.id).all()

    combined_txs = []
    for inc in incomes:
        acc_name = format_account_label(inc.account.bank_name, inc.account.account_name) if inc.account else "Account"
        combined_txs.append({
            "id": f"inc-{inc.id}",
            "raw_id": inc.id,
            "type": "income",
            "title": f"Income: {inc.source}",
            "category": inc.source,
            "amount": inc.amount,
            "account_name": acc_name,
            "date": inc.date.isoformat(),
            "notes": inc.notes
        })

    for exp in expenses:
        acc_name = format_account_label(exp.account.bank_name, exp.account.account_name) if exp.account else "Account"
        combined_txs.append({
            "id": f"exp-{exp.id}",
            "raw_id": exp.id,
            "type": "expense",
            "title": exp.title,
            "category": exp.category,
            "amount": exp.amount,
            "account_name": acc_name,
            "date": exp.date.isoformat(),
            "notes": exp.description
        })

    for contrib in contributions:
        acc_name = format_account_label(contrib.account.bank_name, contrib.account.account_name) if contrib.account else "Account"
        goal_title = contrib.goal.title if contrib.goal else "Goal"
        combined_txs.append({
            "id": f"goal-{contrib.id}",
            "raw_id": contrib.id,
            "type": "goal_contribution",
            "title": f"Goal: {goal_title}",
            "category": "Goal Contribution",
            "amount": contrib.amount,
            "account_name": acc_name,
            "date": contrib.date.isoformat(),
            "notes": contrib.description
        })

    combined_txs.sort(key=lambda x: x["date"], reverse=True)
    recent_transactions = combined_txs[:10]

    # Active Budgets Summary
    active_budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == current_month, Budget.year == current_year)
        .all()
    )
    budget_summary = [
        calculate_budget_metrics(b, db).model_dump()
        for b in active_budgets
    ]

    return {
        "total_balance": float(total_balance),
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "available_balance": float(available_balance),
        "total_in_goals": float(total_in_goals),
        "monthly_income": float(monthly_income),
        "monthly_expenses": float(monthly_expenses),
        "monthly_savings": float(monthly_savings),
        "number_of_accounts": number_of_accounts,
        "account_balances": account_balances,
        "category_totals": category_totals,
        "recent_transactions": recent_transactions,
        "budget_summary": budget_summary
    }
