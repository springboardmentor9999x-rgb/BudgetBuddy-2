import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.utils.time_utils import create_global_notif
from app.models import User, Account, Expense, Budget, Notification
from app import schemas, security
from sqlalchemy import extract

router = APIRouter(prefix="/expenses", tags=["Expenses"])


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


def check_and_trigger_budget_alert(user_id: int, category: str, expense_date: datetime.datetime, db: Session):
    m = expense_date.month
    y = expense_date.year

    b = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == category,
        Budget.month == m,
        Budget.year == y
    ).first()

    if not b:
        return

    # Calculate total category spending for this month & year
    spent = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            Expense.category == category,
            extract("month", Expense.date) == m,
            extract("year", Expense.date) == y
        )
        .scalar() or 0.0
    )

    if b.monthly_limit > 0:
        pct = (spent / b.monthly_limit) * 100
    else:
        pct = 0.0

    notified = set(b.notified_thresholds.split(",")) if b.notified_thresholds else set()

    thresholds_to_check = [
        (101, "danger", "exceeded"),
        (100, "danger", "reached"),
        (90, "critical", "critical_warning"),
        (75, "warning", "warning"),
        (50, "warning", "warning")
    ]

    newly_notified = list(notified)

    for threshold, notif_type, notif_variant in thresholds_to_check:
        condition = pct > 100 if threshold == 101 else pct >= threshold
        if condition and str(threshold) not in notified:
            
            if threshold == 101:
                overspent = spent - b.monthly_limit
                title = f"🚨 Food Budget Exceeded" if category == "Food" else f"🚨 {category} Budget Exceeded"
                msg = f"You exceeded your ₹{b.monthly_limit:,.0f} {category} budget by ₹{overspent:,.0f}."
                rich_text = f"**{title}**\n\n{msg}"
            elif threshold == 100:
                title = f"🔴 Food Budget Reached" if category == "Food" else f"🔴 {category} Budget Reached"
                msg = f"You have used 100% of your ₹{b.monthly_limit:,.0f} {category} budget."
                rich_text = f"**{title}**\n\n{msg}"
            elif threshold == 90:
                rem = b.monthly_limit - spent
                title = f"🚨 Food Budget Alert" if category == "Food" else f"🚨 {category} Budget Alert"
                msg = f"You have spent 90% of your ₹{b.monthly_limit:,.0f} {category} budget.\nOnly ₹{rem:,.0f} remaining."
                rich_text = f"**{title}**\n\nYou have spent 90% of your ₹{b.monthly_limit:,.0f} {category} budget.\nOnly ₹{rem:,.0f} remaining."
            else: # 50 or 75
                rem = b.monthly_limit - spent
                title = f"⚠️ Food Budget Warning" if category == "Food" else f"⚠️ {category} Budget Warning"
                msg = f"You have already spent {threshold}% of your ₹{b.monthly_limit:,.0f} {category} budget.\nSpent: ₹{spent:,.0f}\nRemaining: ₹{rem:,.0f}"
                if threshold == 75:
                    msg = f"You have spent 75% of your ₹{b.monthly_limit:,.0f} {category} budget.\nSpent: ₹{spent:,.0f}\nRemaining: ₹{rem:,.0f}"
                rich_text = f"**{title}**\n\n{msg}"

            notif = create_global_notif(
                user_id=user_id,
                type_str=notif_type,
                title=title,
                message=msg,
                rich_text_content=rich_text,
                is_read=False
            )
            db.add(notif)
            newly_notified.append(str(threshold))
            break

    for th, _, _ in thresholds_to_check:
        condition = pct > 100 if th == 101 else pct >= th
        if condition and str(th) not in newly_notified:
            newly_notified.append(str(th))
            
    b.notified_thresholds = ",".join(newly_notified)
    db.commit()



@router.post("", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    # Verify account ownership
    account = db.query(Account).filter(Account.id == expense_in.account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Selected account was not found")

    # Insufficient balance check
    if account.current_balance < expense_in.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance in this account ({format_account_label(account.bank_name, account.account_name)}). Available: ₹{account.current_balance:,.2f}, Requested: ₹{expense_in.amount:,.2f}"
        )

    date_val = expense_in.date if expense_in.date else datetime.datetime.utcnow()

    new_expense = Expense(
        user_id=current_user.id,
        account_id=expense_in.account_id,
        title=expense_in.title,
        category=expense_in.category,
        amount=expense_in.amount,
        payment_method=expense_in.payment_method,
        card_type=expense_in.card_type if expense_in.payment_method in ["Debit Card", "Credit Card"] else None,
        card_last4=expense_in.card_last4 if expense_in.payment_method in ["Debit Card", "Credit Card"] else None,
        date=date_val,
        description=expense_in.description
    )
    db.add(new_expense)

    # Decrease account current_balance
    account.current_balance -= expense_in.amount

    # Emit System Notification
    notif = create_global_notif(
        user_id=current_user.id,
        type_str="expense_added",
        message=f"Expense of ₹{expense_in.amount:,.2f} for '{expense_in.title}' ({expense_in.category}) recorded.",
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.refresh(new_expense)

    # Check budget alert
    check_and_trigger_budget_alert(current_user.id, new_expense.category, new_expense.date, db)

    res = schemas.ExpenseOut.model_validate(new_expense)
    res.account_name = format_account_label(account.bank_name, account.account_name)
    return res


@router.get("", response_model=List[schemas.ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).order_by(Expense.date.desc()).all()
    res_list = []
    for exp in expenses:
        item = schemas.ExpenseOut.model_validate(exp)
        if exp.account:
            item.account_name = format_account_label(exp.account.bank_name, exp.account.account_name)
        res_list.append(item)
    return res_list


@router.get("/summary")
def get_expenses_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    category_rows = (
        db.query(Expense.category, func.sum(Expense.amount).label("total_amount"))
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .all()
    )

    total_expense = sum(row.total_amount for row in category_rows) if category_rows else 0.0

    category_summary = [
        {
            "category": row.category,
            "amount": float(row.total_amount),
            "percentage": round((float(row.total_amount) / total_expense * 100), 1) if total_expense > 0 else 0
        }
        for row in category_rows
    ]

    return {
        "total_expense": total_expense,
        "category_summary": category_summary
    }


@router.get("/{expense_id}", response_model=schemas.ExpenseOut)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")

    res = schemas.ExpenseOut.model_validate(expense)
    if expense.account:
        res.account_name = format_account_label(expense.account.bank_name, expense.account.account_name)
    return res


@router.put("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    expense_in: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")

    update_data = expense_in.model_dump(exclude_unset=True)
    new_account_id = update_data.get("account_id", expense.account_id)
    new_amount = update_data.get("amount", expense.amount)

    old_account = db.query(Account).filter(Account.id == expense.account_id, Account.user_id == current_user.id).first()
    new_account = db.query(Account).filter(Account.id == new_account_id, Account.user_id == current_user.id).first()

    if not new_account:
        raise HTTPException(status_code=404, detail="Target account not found")

    # Simulate reversing old expense and applying new expense to check balance safety
    if old_account:
        old_account.current_balance += expense.amount

    if new_account.current_balance < new_amount:
        # Revert change before throwing exception
        if old_account:
            old_account.current_balance -= expense.amount
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance in target account ({format_account_label(new_account.bank_name, new_account.account_name)}). Available: ₹{new_account.current_balance:,.2f}, Required: ₹{new_amount:,.2f}"
        )

    for field, val in update_data.items():
        setattr(expense, field, val)

    new_account.current_balance -= new_amount

    db.commit()
    db.refresh(expense)

    # Check budget alert
    check_and_trigger_budget_alert(current_user.id, expense.category, expense.date, db)

    res = schemas.ExpenseOut.model_validate(expense)
    res.account_name = format_account_label(new_account.bank_name, new_account.account_name)
    return res


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")

    account = db.query(Account).filter(Account.id == expense.account_id, Account.user_id == current_user.id).first()
    if account:
        account.current_balance += expense.amount

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
