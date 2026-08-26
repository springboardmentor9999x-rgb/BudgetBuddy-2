import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.time_utils import create_global_notif
from app.models import User, Account, Income, Notification
from app import schemas, security

router = APIRouter(prefix="/incomes", tags=["Incomes"])


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


@router.post("", response_model=schemas.IncomeOut, status_code=status.HTTP_201_CREATED)
def create_income(
    income_in: schemas.IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    # Verify account ownership
    account = db.query(Account).filter(Account.id == income_in.account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Selected account was not found")

    date_val = income_in.date if income_in.date else datetime.datetime.utcnow()

    new_income = Income(
        user_id=current_user.id,
        account_id=income_in.account_id,
        source=income_in.source,
        amount=income_in.amount,
        date=date_val,
        notes=income_in.notes
    )
    db.add(new_income)

    # Increase account current_balance
    account.current_balance += income_in.amount

    # Emit System Notification
    notif = create_global_notif(
        user_id=current_user.id,
        type_str="income_added",
        message=f"Income of ₹{income_in.amount:,.2f} from '{income_in.source}' recorded.",
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.refresh(new_income)

    res = schemas.IncomeOut.model_validate(new_income)
    res.account_name = format_account_label(account.bank_name, account.account_name)
    return res


@router.get("", response_model=List[schemas.IncomeOut])
def list_incomes(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    incomes = db.query(Income).filter(Income.user_id == current_user.id).order_by(Income.date.desc()).all()
    res_list = []
    for inc in incomes:
        item = schemas.IncomeOut.model_validate(inc)
        if inc.account:
            item.account_name = format_account_label(inc.account.bank_name, inc.account.account_name)
        res_list.append(item)
    return res_list


@router.get("/{income_id}", response_model=schemas.IncomeOut)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")

    res = schemas.IncomeOut.model_validate(income)
    if income.account:
        res.account_name = format_account_label(income.account.bank_name, income.account.account_name)
    return res


@router.post("/update/{income_id}")
@router.put("/{income_id}", response_model=schemas.IncomeOut)
def update_income(
    income_id: int,
    income_in: schemas.IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")

    old_account = db.query(Account).filter(Account.id == income.account_id, Account.user_id == current_user.id).first()
    if old_account:
        old_account.current_balance -= income.amount

    update_data = income_in.model_dump(exclude_unset=True)
    new_account_id = update_data.get("account_id", income.account_id)
    new_amount = update_data.get("amount", income.amount)

    new_account = db.query(Account).filter(Account.id == new_account_id, Account.user_id == current_user.id).first()
    if not new_account:
        raise HTTPException(status_code=404, detail="Target account not found")

    for field, val in update_data.items():
        setattr(income, field, val)

    new_account.current_balance += new_amount

    db.commit()
    db.refresh(income)

    res = schemas.IncomeOut.model_validate(income)
    res.account_name = format_account_label(new_account.bank_name, new_account.account_name)
    return res


@router.delete("/{income_id}", status_code=status.HTTP_200_OK)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income record not found")

    account = db.query(Account).filter(Account.id == income.account_id, Account.user_id == current_user.id).first()
    if account:
        account.current_balance -= income.amount

    db.delete(income)
    db.commit()
    return {"message": "Income deleted successfully"}
