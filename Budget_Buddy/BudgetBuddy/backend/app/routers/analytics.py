import datetime
from calendar import month_name
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import User, Expense, Income, SavingsGoal, Budget, GoalContribution
from app import security


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ============================================================
# SPENDING BY CATEGORY
# ============================================================

@router.get("/spending-by-category")
def get_spending_by_category(
    months: int = Query(12, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:

    cat_rows = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total_amount")
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    total = (
        sum(float(r.total_amount) for r in cat_rows)
        if cat_rows
        else 0.0
    )

    return [
        {
            "category": r.category,
            "amount": float(r.total_amount),
            "percentage": (
                round(
                    float(r.total_amount) / total * 100,
                    1
                )
                if total > 0
                else 0.0
            )
        }
        for r in cat_rows
    ]


# ============================================================
# MONTHLY TREND
# ============================================================

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
            .scalar()
            or 0.0
        )

        exp_sum = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.user_id == current_user.id,
                extract("month", Expense.date) == m,
                extract("year", Expense.date) == y
            )
            .scalar()
            or 0.0
        )

        net = float(inc_sum) - float(exp_sum)

        trends.append(
            {
                "month_key": f"{y}-{m:02d}",
                "month_label": f"{month_name[m][:3]} {y}",
                "income": float(inc_sum),
                "expenses": float(exp_sum),
                "net": net
            }
        )

    return trends


# ============================================================
# SAVINGS PROGRESS
# ============================================================

@router.get("/savings-progress")
def get_savings_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:

    goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .order_by(
            SavingsGoal.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": g.id,
            "title": g.title,
            "goal_type": g.goal_type,
            "target": float(g.target_amount),
            "current": float(g.current_amount),
            "remaining": max(
                0.0,
                float(g.target_amount - g.current_amount)
            ),
            "percentage": (
                round(
                    float(g.current_amount)
                    / float(g.target_amount)
                    * 100,
                    1
                )
                if g.target_amount > 0
                else 0.0
            ),
            "status": g.status
        }
        for g in goals
    ]


# ============================================================
# EXPENSE DISTRIBUTION
# ============================================================

@router.get("/expense-distribution")
def get_expense_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> List[Dict[str, Any]]:

    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id
        )
        .all()
    )

    bins = [
        {
            "range": "0–500",
            "min": 0,
            "max": 500,
            "count": 0,
            "total_amount": 0.0
        },
        {
            "range": "500–1000",
            "min": 500,
            "max": 1000,
            "count": 0,
            "total_amount": 0.0
        },
        {
            "range": "1000–2000",
            "min": 1000,
            "max": 2000,
            "count": 0,
            "total_amount": 0.0
        },
        {
            "range": "2000–5000",
            "min": 2000,
            "max": 5000,
            "count": 0,
            "total_amount": 0.0
        },
        {
            "range": "5000+",
            "min": 5000,
            "max": float("inf"),
            "count": 0,
            "total_amount": 0.0
        }
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


# ============================================================
# ANALYTICS SUMMARY
# ============================================================

@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> Dict[str, Any]:

    total_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
        or 0.0
    )

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
        or 0.0
    )

    remaining_balance = (
        float(total_income)
        - float(total_expenses)
    )

    total_savings = (
        db.query(func.sum(SavingsGoal.current_amount))
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .scalar()
        or 0.0
    )

    savings_rate = (
        round(
            float(total_savings)
            / float(total_income)
            * 100,
            1
        )
        if total_income > 0
        else 0.0
    )

    active_goals_count = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id,
            SavingsGoal.status == "in_progress"
        )
        .count()
    )

    completed_goals_count = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id,
            SavingsGoal.status == "completed"
        )
        .count()
    )

    now = datetime.datetime.utcnow()

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == now.month,
            Budget.year == now.year
        )
        .all()
    )

    total_budget = (
        sum(
            float(b.monthly_limit)
            for b in budgets
        )
        if budgets
        else 0.0
    )

    current_month_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == now.month,
            extract("year", Expense.date) == now.year
        )
        .scalar()
        or 0.0
    )

    budget_usage_pct = (
        round(
            float(current_month_expenses)
            / float(total_budget)
            * 100,
            1
        )
        if total_budget > 0
        else 0.0
    )

    return {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "remaining_balance": remaining_balance,
        "total_savings": float(total_savings),
        "savings_rate": savings_rate,
        "active_goals_count": active_goals_count,
        "completed_goals_count": completed_goals_count,
        "total_budget": float(total_budget),
        "total_budget_spent": float(current_month_expenses),
        "budget_usage_percentage": budget_usage_pct
    }


# ============================================================
# PREMIUM ANALYTICS - CUSTOM DATE RANGE
# ============================================================

@router.get("/custom-range")
def get_custom_range_analytics(
    start_date: str = Query(
        ...,
        description="Start date in YYYY-MM-DD format"
    ),
    end_date: str = Query(
        ...,
        description="End date in YYYY-MM-DD format"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        security.get_current_premium_user
    )
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # Validate dates
    # --------------------------------------------------------

    try:
        start = datetime.datetime.strptime(
            start_date,
            "%Y-%m-%d"
        )

        end = datetime.datetime.strptime(
            end_date,
            "%Y-%m-%d"
        )

        # Include the complete end date.
        # Example:
        # 2026-09-01 becomes
        # 2026-09-01 23:59:59.999999
        end = end.replace(
            hour=23,
            minute=59,
            second=59,
            microsecond=999999
        )

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Dates must be in YYYY-MM-DD format."
        )

    if start > end:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date."
        )

    # --------------------------------------------------------
    # Get income records
    # --------------------------------------------------------

    incomes = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,
            Income.date >= start,
            Income.date <= end
        )
        .all()
    )

    # --------------------------------------------------------
    # Get expense records
    # --------------------------------------------------------

    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.date >= start,
            Expense.date <= end
        )
        .all()
    )

    # --------------------------------------------------------
    # Calculate totals
    # --------------------------------------------------------

    total_income = sum(
        float(income.amount)
        for income in incomes
    )

    total_expenses = sum(
        float(expense.amount)
        for expense in expenses
    )

    net_savings = total_income - total_expenses

    # --------------------------------------------------------
    # Category-wise expense breakdown
    # --------------------------------------------------------

    category_totals = {}

    for expense in expenses:

        category = expense.category or "Other"

        category_totals[category] = (
            category_totals.get(category, 0.0)
            + float(expense.amount)
        )

    category_breakdown = [
        {
            "category": category,
            "amount": round(amount, 2)
        }
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True
        )
    ]

    # --------------------------------------------------------
    # Return analytics
    # --------------------------------------------------------

    return {
        "start_date": start_date,
        "end_date": end_date,

        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(net_savings, 2),

        "transaction_count": (
            len(incomes) + len(expenses)
        ),

        "income_transaction_count": len(incomes),
        "expense_transaction_count": len(expenses),

        "category_breakdown": category_breakdown
    }


# ============================================================
# PREMIUM ANALYTICS - MONTH COMPARISON
# ============================================================

@router.get("/month-comparison")
def get_month_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        security.get_current_premium_user
    )
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # Determine current and previous month
    # --------------------------------------------------------

    today = datetime.datetime.now()

    current_year = today.year
    current_month = today.month

    if current_month == 1:
        previous_month = 12
        previous_year = current_year - 1
    else:
        previous_month = current_month - 1
        previous_year = current_year

    # --------------------------------------------------------
    # Current month start/end
    # --------------------------------------------------------

    current_start = datetime.datetime(
        current_year,
        current_month,
        1
    )

    if current_month == 12:
        next_month_start = datetime.datetime(
            current_year + 1,
            1,
            1
        )
    else:
        next_month_start = datetime.datetime(
            current_year,
            current_month + 1,
            1
        )

    current_end = next_month_start - datetime.timedelta(
        microseconds=1
    )

    # --------------------------------------------------------
    # Previous month start/end
    # --------------------------------------------------------

    previous_start = datetime.datetime(
        previous_year,
        previous_month,
        1
    )

    previous_end = current_start - datetime.timedelta(
        microseconds=1
    )

    # --------------------------------------------------------
    # Current month income
    # --------------------------------------------------------

    current_incomes = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,
            Income.date >= current_start,
            Income.date <= current_end
        )
        .all()
    )

    # --------------------------------------------------------
    # Previous month income
    # --------------------------------------------------------

    previous_incomes = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,
            Income.date >= previous_start,
            Income.date <= previous_end
        )
        .all()
    )

    # --------------------------------------------------------
    # Current month expenses
    # --------------------------------------------------------

    current_expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.date >= current_start,
            Expense.date <= current_end
        )
        .all()
    )

    # --------------------------------------------------------
    # Previous month expenses
    # --------------------------------------------------------

    previous_expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.date >= previous_start,
            Expense.date <= previous_end
        )
        .all()
    )

    # --------------------------------------------------------
    # Calculate totals
    # --------------------------------------------------------

    current_income = sum(
        float(income.amount)
        for income in current_incomes
    )

    previous_income = sum(
        float(income.amount)
        for income in previous_incomes
    )

    current_expenses_total = sum(
        float(expense.amount)
        for expense in current_expenses
    )

    previous_expenses_total = sum(
        float(expense.amount)
        for expense in previous_expenses
    )

    current_savings = (
        current_income - current_expenses_total
    )

    previous_savings = (
        previous_income - previous_expenses_total
    )

    # --------------------------------------------------------
    # Percentage change helper
    # --------------------------------------------------------

    def calculate_percentage_change(
        current_value: float,
        previous_value: float
    ) -> float:

        if previous_value == 0:

            if current_value == 0:
                return 0.0

            return 100.0

        return round(
            (
                (current_value - previous_value)
                / abs(previous_value)
            ) * 100,
            2
        )

    # --------------------------------------------------------
    # Calculate percentage changes
    # --------------------------------------------------------

    income_change = calculate_percentage_change(
        current_income,
        previous_income
    )

    expense_change = calculate_percentage_change(
        current_expenses_total,
        previous_expenses_total
    )

    savings_change = calculate_percentage_change(
        current_savings,
        previous_savings
    )

    # --------------------------------------------------------
    # Return comparison
    # --------------------------------------------------------

    return {
        "current_month": {
            "month": current_month,
            "year": current_year,
            "income": round(current_income, 2),
            "expenses": round(current_expenses_total, 2),
            "savings": round(current_savings, 2),
            "income_transactions": len(current_incomes),
            "expense_transactions": len(current_expenses)
        },

        "previous_month": {
            "month": previous_month,
            "year": previous_year,
            "income": round(previous_income, 2),
            "expenses": round(previous_expenses_total, 2),
            "savings": round(previous_savings, 2),
            "income_transactions": len(previous_incomes),
            "expense_transactions": len(previous_expenses)
        },

        "percentage_change": {
            "income": income_change,
            "expenses": expense_change,
            "savings": savings_change
        }
    }


# ============================================================
# PREMIUM ANALYTICS - CATEGORY SPENDING OVER TIME
# ============================================================

@router.get("/category-trend")
def get_category_spending_trend(
    months: int = Query(
        12,
        ge=1,
        le=24,
        description="Number of months to analyze"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        security.get_current_premium_user
    )
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # Determine current month
    # --------------------------------------------------------

    today = datetime.datetime.now()

    current_month_start = datetime.datetime(
        today.year,
        today.month,
        1
    )

    # --------------------------------------------------------
    # Calculate starting month
    # --------------------------------------------------------

    total_month_index = (
        current_month_start.year * 12
        + current_month_start.month
        - 1
        - (months - 1)
    )

    start_year = total_month_index // 12
    start_month = total_month_index % 12 + 1

    start_date = datetime.datetime(
        start_year,
        start_month,
        1
    )

    # --------------------------------------------------------
    # Calculate end date
    #
    # Include expenses recorded throughout today.
    # --------------------------------------------------------

    end_date = today + datetime.timedelta(days=1)

    # --------------------------------------------------------
    # Get user's expenses
    # --------------------------------------------------------

    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.date >= start_date,
            Expense.date < end_date
        )
        .all()
    )

    # --------------------------------------------------------
    # Create monthly category buckets
    # --------------------------------------------------------

    monthly_categories = {}

    for i in range(months):

        month_index = (
            start_date.year * 12
            + start_date.month
            - 1
            + i
        )

        year = month_index // 12
        month = month_index % 12 + 1

        month_key = f"{year}-{month:02d}"

        monthly_categories[month_key] = {}

    # --------------------------------------------------------
    # Group expenses by month and category
    # --------------------------------------------------------

    for expense in expenses:

        expense_date = expense.date

        if not expense_date:
            continue

        month_key = (
            f"{expense_date.year}-"
            f"{expense_date.month:02d}"
        )

        category = (
            expense.category.strip()
            if expense.category
            and isinstance(expense.category, str)
            else "Other"
        )

        if month_key not in monthly_categories:
            monthly_categories[month_key] = {}

        monthly_categories[month_key][category] = (
            monthly_categories[month_key].get(
                category,
                0.0
            )
            + float(expense.amount or 0)
        )

    # --------------------------------------------------------
    # Find all categories that actually have expenses
    # --------------------------------------------------------

    categories = set()

    for month_data in monthly_categories.values():

        for category, amount in month_data.items():

            if amount > 0:
                categories.add(category)

    categories = sorted(categories)

    # --------------------------------------------------------
    # Build frontend-friendly trend
    # --------------------------------------------------------

    trend = []

    for month_key in monthly_categories:

        month_data = monthly_categories[month_key]

        monthly_total = sum(
            month_data.values()
        )

        for category, amount in sorted(
            month_data.items(),
            key=lambda item: item[1],
            reverse=True
        ):

            amount = round(
                float(amount),
                2
            )

            percentage = (
                round(
                    amount
                    / monthly_total
                    * 100,
                    2
                )
                if monthly_total > 0
                else 0.0
            )

            trend.append({
                "month": month_key,
                "category": category,
                "amount": amount,
                "percentage": percentage
            })

    # --------------------------------------------------------
    # Monthly totals
    # --------------------------------------------------------

    monthly_totals = []

    for month_key, month_data in monthly_categories.items():

        monthly_totals.append({
            "month": month_key,
            "total_expenses": round(
                sum(month_data.values()),
                2
            )
        })

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "months_requested": months,

        "start_date": start_date.strftime(
            "%Y-%m-%d"
        ),

        "end_date": today.strftime(
            "%Y-%m-%d"
        ),

        "categories": categories,

        "monthly_totals": monthly_totals,

        "trend": trend
    }
    # ============================================================
# PREMIUM ANALYTICS - SAVINGS CONTRIBUTION TREND
# ============================================================

@router.get("/savings-trend")
def get_savings_contribution_trend(
    months: int = Query(
        12,
        ge=1,
        le=24,
        description="Number of months to analyze"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        security.get_current_premium_user
    )
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # Determine current month
    # --------------------------------------------------------

    today = datetime.datetime.now()

    current_month_start = datetime.datetime(
        today.year,
        today.month,
        1
    )

    # --------------------------------------------------------
    # Calculate starting month
    # --------------------------------------------------------

    total_month_index = (
        current_month_start.year * 12
        + current_month_start.month
        - 1
        - (months - 1)
    )

    start_year = total_month_index // 12
    start_month = total_month_index % 12 + 1

    start_date = datetime.datetime(
        start_year,
        start_month,
        1
    )

    # --------------------------------------------------------
    # End date
    #
    # Include the complete current day.
    # --------------------------------------------------------

    end_date = today + datetime.timedelta(days=1)

    # --------------------------------------------------------
    # Get goal contributions
    # --------------------------------------------------------

    contributions = (
        db.query(GoalContribution)
        .filter(
            GoalContribution.user_id == current_user.id,
            GoalContribution.created_at >= start_date,
            GoalContribution.created_at < end_date
        )
        .order_by(
            GoalContribution.created_at.asc()
        )
        .all()
    )

    # --------------------------------------------------------
    # Create monthly buckets
    # --------------------------------------------------------

    monthly_contributions = {}

    for i in range(months):

        month_index = (
            start_date.year * 12
            + start_date.month
            - 1
            + i
        )

        year = month_index // 12
        month = month_index % 12 + 1

        month_key = f"{year}-{month:02d}"

        monthly_contributions[month_key] = 0.0

    # --------------------------------------------------------
    # Group contributions by month
    # --------------------------------------------------------

    for contribution in contributions:

        contribution_date = contribution.created_at

        if not contribution_date:
            continue

        month_key = (
            f"{contribution_date.year}-"
            f"{contribution_date.month:02d}"
        )

        if month_key not in monthly_contributions:
            monthly_contributions[month_key] = 0.0

        monthly_contributions[month_key] += float(
            contribution.amount or 0
        )

    # --------------------------------------------------------
    # Build trend
    # --------------------------------------------------------

    trend = []

    cumulative = 0.0

    for month_key, amount in monthly_contributions.items():

        amount = round(float(amount), 2)

        cumulative += amount

        trend.append({
            "month": month_key,
            "contribution": amount,
            "cumulative_contribution": round(
                cumulative,
                2
            )
        })

    # --------------------------------------------------------
    # Total contribution
    # --------------------------------------------------------

    total_contribution = round(
        sum(monthly_contributions.values()),
        2
    )

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "months_requested": months,

        "start_date": start_date.strftime(
            "%Y-%m-%d"
        ),

        "end_date": today.strftime(
            "%Y-%m-%d"
        ),

        "total_contribution": total_contribution,

        "trend": trend
    }

