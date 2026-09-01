from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models import (
    User,
    Income,
    Expense,
    Budget,
    SavingsGoal,
    Account,
)
from app.security import get_current_user, get_current_premium_user
from app.services import ai_service

from pydantic import BaseModel


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/premium/ai",
    tags=["Premium AI"],
    dependencies=[Depends(get_current_premium_user)],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):
    question: str


class TransactionDesc(BaseModel):
    description: str


# ============================================================
# SAFE VALUE HELPERS
# ============================================================

def _number(value):
    """
    Convert SQLAlchemy numeric values safely to float.
    """
    if value is None:
        return 0.0

    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _date_string(value):
    """
    Convert date/datetime values safely to ISO strings.
    """
    if value is None:
        return None

    try:
        return value.isoformat()
    except AttributeError:
        return str(value)


# ============================================================
# USER FINANCIAL SUMMARY
# ============================================================

def get_user_financial_summary(
    user: User,
    db: Session,
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # LOAD USER DATA
    # --------------------------------------------------------

    incomes = (
        db.query(Income)
        .filter(Income.user_id == user.id)
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user.id)
        .all()
    )

    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user.id)
        .all()
    )

    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user.id)
        .all()
    )

    accounts = (
        db.query(Account)
        .filter(Account.user_id == user.id)
        .all()
    )

    # --------------------------------------------------------
    # TOTALS
    # --------------------------------------------------------

    total_income = sum(
        _number(getattr(item, "amount", 0))
        for item in incomes
    )

    total_expenses = sum(
        _number(getattr(item, "amount", 0))
        for item in expenses
    )

    total_account_balance = sum(
        _number(getattr(item, "current_balance", 0))
        for item in accounts
    )

    current_surplus = total_income - total_expenses

    # --------------------------------------------------------
    # PROFILE / CURRENCY
    # --------------------------------------------------------

    profile = getattr(user, "profile", None)

    currency = (
        getattr(profile, "currency", None)
        if profile
        else None
    )

    if not currency:
        currency = "INR"

    # --------------------------------------------------------
    # ACCOUNTS
    # --------------------------------------------------------

    account_data = []

    for account in accounts:
        account_data.append({
            "id": getattr(account, "id", None),
            "type": getattr(account, "account_type", None),
            "name": getattr(account, "name", None),
            "balance": _number(
                getattr(account, "current_balance", 0)
            ),
        })

    # --------------------------------------------------------
    # INCOMES
    # --------------------------------------------------------

    income_data = []

    for income in incomes:
        income_data.append({
            "id": getattr(income, "id", None),
            "source": getattr(income, "source", None),
            "amount": _number(
                getattr(income, "amount", 0)
            ),
            "date": _date_string(
                getattr(income, "date", None)
            ),
        })

    # --------------------------------------------------------
    # EXPENSES
    # --------------------------------------------------------

    expense_data = []

    for expense in expenses:
        expense_data.append({
            "id": getattr(expense, "id", None),
            "category": getattr(expense, "category", None),
            "title": getattr(expense, "title", None),
            "amount": _number(
                getattr(expense, "amount", 0)
            ),
            "date": _date_string(
                getattr(expense, "date", None)
            ),
        })

    # --------------------------------------------------------
    # BUDGETS
    # --------------------------------------------------------

    budget_data = []

    for budget in budgets:
        budget_data.append({
            "id": getattr(budget, "id", None),
            "category": getattr(budget, "category", None),
            "monthly_limit": _number(
                getattr(budget, "monthly_limit", 0)
            ),
            "month": getattr(budget, "month", None),
            "year": getattr(budget, "year", None),
        })

    # --------------------------------------------------------
    # SAVINGS GOALS
    # --------------------------------------------------------

    goal_data = []

    for goal in goals:

        target_amount = _number(
            getattr(goal, "target_amount", 0)
        )

        current_amount = _number(
            getattr(goal, "current_amount", 0)
        )

        goal_data.append({
            "id": getattr(goal, "id", None),
            "title": getattr(goal, "title", None),
            "target_amount": target_amount,
            "current_amount": current_amount,
            "remaining_amount": max(
                target_amount - current_amount,
                0,
            ),
            "target_date": _date_string(
                getattr(goal, "target_date", None)
            ),
        })

    # --------------------------------------------------------
    # FINAL AI CONTEXT
    # --------------------------------------------------------

    return {
        "user_name": getattr(
            user,
            "full_name",
            "BudgetBuddy User",
        ),

        "currency": currency,

        "financial_overview": {
            "total_account_balance": total_account_balance,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "current_surplus": current_surplus,
            "income_record_count": len(incomes),
            "expense_record_count": len(expenses),
            "budget_count": len(budgets),
            "savings_goal_count": len(goals),
            "account_count": len(accounts),
        },

        "accounts": account_data,

        "recent_incomes": income_data[-20:],

        "recent_expenses": expense_data[-50:],

        "budgets": budget_data,

        "saving_goals": goal_data,
    }


# ============================================================
# BUDGET SUGGESTIONS
# ============================================================

@router.get("/budget-suggestions")
def get_budget_suggestions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    suggestion = ai_service.generate_budget_suggestions(
        data
    )

    return {
        "suggestion": suggestion
    }


# ============================================================
# EXPENSE INSIGHTS
# ============================================================

@router.get("/expense-insights")
def get_expense_insights(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    insight = ai_service.generate_expense_insights(
        data
    )

    return {
        "insight": insight
    }


# ============================================================
# MONTHLY SUMMARY
# ============================================================

@router.get("/monthly-summary")
def get_monthly_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    summary = ai_service.generate_monthly_summary(
        data
    )

    return {
        "summary": summary
    }


# ============================================================
# SAVING ADVISOR
# ============================================================

@router.get("/saving-advisor")
def get_saving_advisor(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    advice = ai_service.generate_saving_advisor(
        data
    )

    return {
        "advice": advice
    }


# ============================================================
# EXPENSE FORECAST
# ============================================================

@router.get("/forecast")
def get_expense_forecast(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    forecast = ai_service.generate_forecast(
        data
    )

    return {
        "forecast": forecast
    }


# ============================================================
# AI CHAT
# ============================================================

@router.post("/chat")
def chat_assistant(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    answer = ai_service.chat_with_assistant(
        data,
        req.question,
    )

    return {
        "answer": answer
    }


# ============================================================
# OVERSPENDING PREDICTION
# ============================================================

@router.get("/overspending-prediction")
def get_overspending_prediction(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    prediction = ai_service.generate_overspending_prediction(
        data
    )

    return {
        "prediction": prediction
    }


# ============================================================
# PERSONALIZED TIPS
# ============================================================

@router.get("/personalized-tips")
def get_personalized_tips(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    tips = ai_service.generate_personalized_tips(
        data
    )

    return {
        "tips": tips
    }


# ============================================================
# BUDGET HEALTH
# ============================================================

@router.get("/budget-health")
def get_budget_health(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    health = ai_service.generate_budget_health(
        data
    )

    return {
        "health": health
    }


# ============================================================
# TRANSACTION CATEGORIZATION
# ============================================================

@router.post("/categorize-transaction")
def categorize_transaction(
    req: TransactionDesc,
    user: User = Depends(get_current_user),
):

    category = ai_service.categorize_transaction(
        req.description
    )

    return {
        "category": category
    }


# ============================================================
# ANOMALY DETECTION
# ============================================================

@router.get("/anomaly-detection")
def get_anomaly_detection(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    data = get_user_financial_summary(user, db)

    anomalies = ai_service.generate_anomaly_detection(
        data
    )

    return {
        "anomalies": anomalies
    }

