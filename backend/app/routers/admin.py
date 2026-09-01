from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from collections import defaultdict
from typing import List, Optional

from app.database import get_db
from app.models import (
    User,
    Profile,
    Notification,
    Account,
    Income,
    Expense,
    Budget,
    SavingsGoal,
)
from app.schemas import UserOut, UserRoleUpdate
from app.security import get_current_admin


# ============================================================
# ADMIN ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)]
)


# ============================================================
# GET ALL USERS
# ============================================================

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    role: Optional[str] = Query(
        None,
        description="Filter by role: user, premium, admin"
    ),
    search: Optional[str] = Query(
        None,
        description="Search by name or email"
    )
):
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )

    users = query.all()
    return users


# ============================================================
# GET USER DETAILS
# ============================================================

@router.get("/users/{user_id}", response_model=UserOut)
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ============================================================
# UPDATE USER ROLE
# ============================================================

@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    valid_roles = ["user", "premium", "admin"]

    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user.role = role_update.role

    db.commit()
    db.refresh(user)

    return user


# ============================================================
# GET USER ACCOUNTS
# ============================================================

@router.get("/users/{user_id}/accounts")
def get_user_accounts(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    accounts = (
        db.query(Account)
        .filter(Account.user_id == user_id)
        .all()
    )

    return accounts


# ============================================================
# GET USER INCOME
# ============================================================

@router.get("/users/{user_id}/income")
def get_user_income(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    incomes = (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .order_by(Income.date.desc())
        .all()
    )

    return incomes


# ============================================================
# GET USER EXPENSES
# ============================================================

@router.get("/users/{user_id}/expenses")
def get_user_expenses(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.date.desc())
        .all()
    )

    return expenses


# ============================================================
# GET USER BUDGETS
# ============================================================

@router.get("/users/{user_id}/budgets")
def get_user_budgets(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .all()
    )

    return budgets


# ============================================================
# GET USER SAVINGS GOALS
# ============================================================

@router.get("/users/{user_id}/savings-goals")
def get_user_savings_goals(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id)
        .all()
    )

    return goals


# ============================================================
# GET USER NOTIFICATIONS
# ============================================================

@router.get("/users/{user_id}/notifications")
def get_user_notifications(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


# ============================================================
# ADMIN SYSTEM STATISTICS
# ============================================================

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db)
):
    from sqlalchemy.sql import func

    total_users = db.query(User).count()

    total_premium = (
        db.query(User)
        .filter(User.role == "premium")
        .count()
    )

    total_admins = (
        db.query(User)
        .filter(User.role == "admin")
        .count()
    )

    normal_users = (
        db.query(User)
        .filter(User.role == "user")
        .count()
    )

    active_users = (
        db.query(User)
        .filter(User.is_active == True)
        .count()
    )

    inactive_users = total_users - active_users

    total_income = (
        db.query(func.sum(Income.amount))
        .scalar()
        or 0.0
    )

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .scalar()
        or 0.0
    )

    total_savings = (
        db.query(func.sum(SavingsGoal.current_amount))
        .scalar()
        or 0.0
    )

    recent_users_db = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    recent_users = [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
        }
        for u in recent_users_db
    ]

    return {
        "total_users": total_users,
        "total_premium": total_premium,
        "total_admins": total_admins,
        "normal_users": normal_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_savings": total_savings,
        "recent_users": recent_users,
    }


# ============================================================
# ADMIN NOTIFICATION SCHEMA
# ============================================================

from pydantic import BaseModel


class AdminNotificationCreate(BaseModel):
    message: str
    title: Optional[str] = None
    target_role: Optional[str] = "all"


# ============================================================
# CREATE ADMIN NOTIFICATION
# ============================================================

@router.post("/notifications")
def create_admin_notification(
    notif: AdminNotificationCreate,
    db: Session = Depends(get_db)
):
    users_query = db.query(User)

    if notif.target_role and notif.target_role != "all":
        users_query = users_query.filter(
            User.role == notif.target_role
        )

    users = users_query.all()

    created_count = 0

    for user in users:
        new_notif = Notification(
            user_id=user.id,
            title=notif.title,
            message=notif.message,
            type="admin_alert",
            is_read=False,
        )

        db.add(new_notif)
        created_count += 1

    db.commit()

    return {
        "message": f"Notification sent to {created_count} users."
    }


# ============================================================
# GET ADMIN NOTIFICATIONS
# ============================================================

@router.get("/notifications")
def get_admin_notifications(
    db: Session = Depends(get_db)
):
    return (
        db.query(Notification)
        .filter(Notification.type == "admin_alert")
        .order_by(Notification.created_at.desc())
        .limit(100)
        .all()
    )


# ============================================================
# DELETE ADMIN NOTIFICATION
# ============================================================

@router.delete("/notifications/{id}")
def delete_admin_notification(
    id: int,
    db: Session = Depends(get_db)
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == id,
            Notification.type == "admin_alert"
        )
        .first()
    )

    if not notif:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notif)
    db.commit()

    return {
        "message": "Deleted successfully"
    }
    # ============================================================
# ADMIN SYSTEM-WIDE ANALYTICS
# ============================================================

@router.get("/analytics")
def get_system_analytics(
    db: Session = Depends(get_db)
):
    """
    System-wide analytics for administrators.

    Aggregates financial data across all users.
    """

    # --------------------------------------------------------
    # USER STATISTICS
    # --------------------------------------------------------

    total_users = db.query(User).count()

    normal_users = (
        db.query(User)
        .filter(User.role == "user")
        .count()
    )

    premium_users = (
        db.query(User)
        .filter(User.role == "premium")
        .count()
    )

    admin_users = (
        db.query(User)
        .filter(User.role == "admin")
        .count()
    )

    # --------------------------------------------------------
    # SYSTEM FINANCIAL TOTALS
    # --------------------------------------------------------

    total_income = (
        db.query(func.sum(Income.amount))
        .scalar()
        or 0
    )

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .scalar()
        or 0
    )

    net_savings = total_income - total_expenses

    # --------------------------------------------------------
    # EXPENSES BY CATEGORY
    # --------------------------------------------------------

    category_rows = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("amount")
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    total_category_expenses = sum(
        float(row.amount or 0)
        for row in category_rows
    )

    spending_by_category = []

    for row in category_rows:
        amount = float(row.amount or 0)

        percentage = (
            (amount / total_category_expenses) * 100
            if total_category_expenses > 0
            else 0
        )

        spending_by_category.append({
            "category": row.category or "Other",
            "amount": round(amount, 2),
            "percentage": round(percentage, 2),
        })

    # --------------------------------------------------------
    # MONTHLY INCOME + EXPENSE TREND
    # --------------------------------------------------------

    income_rows = (
        db.query(
            extract("year", Income.date).label("year"),
            extract("month", Income.date).label("month"),
            func.sum(Income.amount).label("amount")
        )
        .group_by(
            extract("year", Income.date),
            extract("month", Income.date)
        )
        .all()
    )

    expense_rows = (
        db.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("amount")
        )
        .group_by(
            extract("year", Expense.date),
            extract("month", Expense.date)
        )
        .all()
    )

    monthly_data = defaultdict(
        lambda: {
            "income": 0.0,
            "expenses": 0.0,
        }
    )

    for row in income_rows:
        key = f"{int(row.year):04d}-{int(row.month):02d}"
        monthly_data[key]["income"] = float(row.amount or 0)

    for row in expense_rows:
        key = f"{int(row.year):04d}-{int(row.month):02d}"
        monthly_data[key]["expenses"] = float(row.amount or 0)

    monthly_trend = []

    for month_key in sorted(monthly_data.keys()):
        income = monthly_data[month_key]["income"]
        expenses = monthly_data[month_key]["expenses"]

        monthly_trend.append({
            "month": month_key,
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "net": round(income - expenses, 2),
        })

    # --------------------------------------------------------
    # SAVINGS GOALS
    # --------------------------------------------------------

    total_goal_target = (
        db.query(func.sum(SavingsGoal.target_amount))
        .scalar()
        or 0
    )

    total_goal_current = (
        db.query(func.sum(SavingsGoal.current_amount))
        .scalar()
        or 0
    )

    savings_goal_count = (
        db.query(SavingsGoal)
        .count()
    )

    goal_progress_percentage = (
        (float(total_goal_current) / float(total_goal_target)) * 100
        if float(total_goal_target) > 0
        else 0
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "users": {
            "total": total_users,
            "normal": normal_users,
            "premium": premium_users,
            "admin": admin_users,
        },

        "financial_summary": {
            "total_income": round(float(total_income), 2),
            "total_expenses": round(float(total_expenses), 2),
            "net_savings": round(float(net_savings), 2),
        },

        "spending_by_category": spending_by_category,

        "monthly_trend": monthly_trend,

        "savings_goals": {
            "count": savings_goal_count,
            "total_target": round(float(total_goal_target), 2),
            "total_current": round(float(total_goal_current), 2),
            "progress_percentage": round(
                goal_progress_percentage,
                2
            ),
        },
    }

