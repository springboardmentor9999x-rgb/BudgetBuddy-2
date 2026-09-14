from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.time_utils import create_global_notif
from app.models import User, Account, Income, Expense, Notification
from app import schemas, security

router = APIRouter(prefix="/accounts", tags=["Accounts"])


from sqlalchemy import func, or_

@router.post("", response_model=schemas.AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    target_bank_name = account_in.bank_name.strip()
    target_acc_name = (account_in.account_name.strip() if account_in.account_name and account_in.account_name.strip() else target_bank_name)
    target_last4 = account_in.last4.strip() if account_in.last4 and account_in.last4.strip() else None

    # Check for duplicate account name or last4 digits for this user
    conds = [
        func.lower(Account.account_name) == target_acc_name.lower(),
    ]
    if target_last4:
        conds.append(Account.last4 == target_last4)

    existing = (
        db.query(Account)
        .filter(
            Account.user_id == current_user.id,
            or_(*conds)
        )
        .first()
    )
    if existing:
        if existing.account_name.strip().lower() == target_acc_name.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with the label '{target_acc_name}' already exists. Duplicate account labels are not allowed."
            )
        if target_last4 and existing.last4 and existing.last4.strip() == target_last4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account ending with digits '{target_last4}' already exists. Duplicate account numbers are not allowed."
            )

    new_account = Account(
        user_id=current_user.id,
        bank_name=target_bank_name,
        account_name=target_acc_name,
        account_type=account_in.account_type,
        opening_balance=account_in.opening_balance,
        current_balance=account_in.opening_balance, # Initial current balance equals opening balance
        last4=target_last4
    )
    db.add(new_account)

    # Emit System Notification
    notif = create_global_notif(
        user_id=current_user.id,
        type_str="account_created",
        message=f"Account '{new_account.bank_name}' ({new_account.account_type}) added with opening balance ₹{new_account.opening_balance:,.2f}.",
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.refresh(new_account)
    return new_account


@router.get("", response_model=List[schemas.AccountOut])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    return db.query(Account).filter(Account.user_id == current_user.id).order_by(Account.created_at.desc()).all()


@router.get("/{account_id}", response_model=schemas.AccountOut)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=schemas.AccountOut)
def update_account(
    account_id: int,
    account_in: schemas.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    new_bank = (account_in.bank_name.strip() if account_in.bank_name and account_in.bank_name.strip() else account.bank_name)
    new_acc = (account_in.account_name.strip() if account_in.account_name and account_in.account_name.strip() else account.account_name)
    new_last4 = (account_in.last4.strip() if account_in.last4 and account_in.last4.strip() else (account.last4 if account_in.last4 is None else None))

    conds = [
        func.lower(Account.account_name) == new_acc.lower(),
    ]
    if new_last4:
        conds.append(Account.last4 == new_last4)

    existing = (
        db.query(Account)
        .filter(
            Account.user_id == current_user.id,
            Account.id != account_id,
            or_(*conds)
        )
        .first()
    )
    if existing:
        if existing.account_name.strip().lower() == new_acc.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with the label '{new_acc}' already exists. Duplicate account labels are not allowed."
            )
        if new_last4 and existing.last4 and existing.last4.strip() == new_last4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account ending with digits '{new_last4}' already exists. Duplicate account numbers are not allowed."
            )

    update_data = account_in.model_dump(exclude_unset=True)
    if "opening_balance" in update_data and update_data["opening_balance"] is not None:
        diff = update_data["opening_balance"] - account.opening_balance
        account.current_balance += diff

    for field, value in update_data.items():
        setattr(account, field, value)

    account.bank_name = new_bank
    account.account_name = new_acc
    account.last4 = new_last4

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_200_OK)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return {"message": "Account deleted successfully"}
