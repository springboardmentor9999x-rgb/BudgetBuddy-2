import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from app.database import get_db
from app.utils.time_utils import create_global_notif
from app.models import User, Budget, Expense, Notification
from app import schemas, security

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def calculate_budget_metrics(budget: Budget, db: Session) -> schemas.BudgetOut:
    # Calculate sum of expenses for this user, category, month, and year
    spent = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == budget.user_id,
            Expense.category == budget.category,
            extract("month", Expense.date) == budget.month,
            extract("year", Expense.date) == budget.year
        )
        .scalar() or 0.0
    )

    remaining = budget.monthly_limit - spent
    percentage = round((spent / budget.monthly_limit * 100), 1) if budget.monthly_limit > 0 else 0.0
    is_exceeded = spent > budget.monthly_limit

    res = schemas.BudgetOut.model_validate(budget)
    res.spent_amount = float(spent)
    res.remaining_amount = float(remaining)
    res.utilization_percentage = float(percentage)
    res.is_exceeded = is_exceeded
    return res


@router.post("", response_model=schemas.BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    # Check if budget for same category/month/year exists
    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category == budget_in.category,
            Budget.month == budget_in.month,
            Budget.year == budget_in.year
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Budget for category '{budget_in.category}' in {budget_in.month}/{budget_in.year} already exists. Update it instead."
        )

    new_budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        monthly_limit=budget_in.monthly_limit,
        month=budget_in.month,
        year=budget_in.year
    )
    db.add(new_budget)

    # Emit System Notification
    notif = create_global_notif(
        user_id=current_user.id,
        type_str="budget_created",
        message=f"Monthly budget of ₹{budget_in.monthly_limit:,.2f} set for category '{budget_in.category}' ({budget_in.month}/{budget_in.year}).",
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.refresh(new_budget)
    return calculate_budget_metrics(new_budget, db)


@router.get("", response_model=List[schemas.BudgetOut])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).order_by(Budget.year.desc(), Budget.month.desc()).all()
    return [calculate_budget_metrics(b, db) for b in budgets]


@router.get("/{budget_id}", response_model=schemas.BudgetOut)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return calculate_budget_metrics(budget, db)


@router.put("/{budget_id}", response_model=schemas.BudgetOut)
def update_budget(
    budget_id: int,
    budget_in: schemas.BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = budget_in.model_dump(exclude_unset=True)

    if "category" in update_data or "month" in update_data or "year" in update_data:
        target_cat = update_data.get("category", budget.category)
        target_month = update_data.get("month", budget.month)
        target_year = update_data.get("year", budget.year)

        existing = (
            db.query(Budget)
            .filter(
                Budget.user_id == current_user.id,
                Budget.id != budget_id,
                Budget.category == target_cat,
                Budget.month == target_month,
                Budget.year == target_year
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A budget for category '{target_cat}' in {target_month}/{target_year} already exists."
            )

    for field, val in update_data.items():
        setattr(budget, field, val)

    db.commit()
    db.refresh(budget)
    return calculate_budget_metrics(budget, db)


@router.delete("/{budget_id}", status_code=status.HTTP_200_OK)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
