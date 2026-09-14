import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.database import get_db
from app.models import User, SavingsGoal, Notification
from app import schemas, security

router = APIRouter(prefix="/goals", tags=["Savings Goals"])



def format_ist_notification_time(dt_utc):
    import zoneinfo
    import datetime
    ist = zoneinfo.ZoneInfo("Asia/Kolkata")
    ist_time = dt_utc.replace(tzinfo=datetime.timezone.utc).astimezone(ist)
    time_str = ist_time.strftime('%I:%M %p').lstrip('0')
    day = ist_time.day
    date_str = ist_time.strftime(f'%A, {day} %B %Y (IST)')
    return f"**{time_str}**\n**{date_str}**\n**Time in Vijayawada East**"


def make_naive(dt: datetime.datetime) -> datetime.datetime:
    if dt is None:
        return dt
    if dt.tzinfo is not None:
        return dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return dt


def format_goal_out(goal: SavingsGoal) -> schemas.SavingsGoalOut:
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    
    contribs_out = []
    if goal.contributions:
        for c in sorted(goal.contributions, key=lambda x: x.created_at, reverse=True):
            cout = schemas.GoalContributionOut.model_validate(c)
            cout.account_name = c.account.bank_name if c.account else None
            cout.progress = (c.new_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
            contribs_out.append(cout)

    res = schemas.SavingsGoalOut.model_validate(goal)
    res.remaining_amount = float(remaining)
    res.progress_percentage = float(pct)
    res.contributions = contribs_out
    
    if contribs_out:
        res.last_contribution_amount = contribs_out[0].amount
        res.last_contribution_date = contribs_out[0].created_at

    return res


@router.post("", response_model=schemas.SavingsGoalOut, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    goal_in: schemas.SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    from app.models import Account, GoalContribution
    
    title_stripped = goal_in.title.strip()
    
    # Check if an active goal with the same title already exists
    existing_active_goal = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id,
        SavingsGoal.title == title_stripped,
        SavingsGoal.status == "in_progress"
    ).first()
    
    if existing_active_goal:
        raise HTTPException(status_code=400, detail=f"An active savings goal with the title '{title_stripped}' already exists.")

    if goal_in.target_amount <= 0:
        raise HTTPException(status_code=422, detail="Target amount must be greater than 0")

    if goal_in.current_amount > goal_in.target_amount:
        raise HTTPException(status_code=422, detail="Initial amount cannot exceed target amount")

    account = None
    if goal_in.current_amount > 0:
        if not goal_in.account_id:
            raise HTTPException(status_code=400, detail="Account ID must be provided if initial saved amount is greater than 0")
        
        account = db.query(Account).filter(Account.id == goal_in.account_id, Account.user_id == current_user.id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        
        if goal_in.current_amount > account.current_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance in {account.bank_name}. Available balance: ₹{account.current_balance:,.2f}."
            )

    target_date_val = make_naive(goal_in.target_date)
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if target_date_val < today_start:
        raise HTTPException(status_code=422, detail="Target completion date cannot be in the past")

    status_val = "completed" if goal_in.current_amount >= goal_in.target_amount else "in_progress"

    new_goal = SavingsGoal(
        user_id=current_user.id,
        title=goal_in.title.strip(),
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=target_date_val,
        status=status_val,
        goal_type=goal_in.goal_type
    )
    db.add(new_goal)
    db.flush() # flush to get new_goal.id

    if goal_in.current_amount > 0 and account:
        account.current_balance -= goal_in.current_amount
        contribution = GoalContribution(
            user_id=current_user.id,
            goal_id=new_goal.id,
            account_id=account.id,
            amount=goal_in.current_amount,
            previous_amount=0.0,
            new_amount=goal_in.current_amount,
            description=f"Initial contribution to {new_goal.title}"
        )
        db.add(contribution)

        from app.models import Expense
        expense = Expense(
            user_id=current_user.id,
            account_id=account.id,
            title=f"Goal Contribution: {new_goal.title}",
            category="Other",
            amount=goal_in.current_amount,
            payment_method="Bank Transfer",
            description=f"Initial contribution to {new_goal.title}"
        )
        db.add(expense)

    # Emit System Notification
    now = datetime.datetime.utcnow()
    pct = (new_goal.current_amount / new_goal.target_amount * 100) if new_goal.target_amount > 0 else 0.0
    remaining = max(0.0, new_goal.target_amount - new_goal.current_amount)
    time_str = format_ist_notification_time(now)
    
    title_str = "🎉 Saving Goal Created"
    rich_text = f"**{title_str}**\n\n"
    if new_goal.current_amount > 0:
        rich_text += f"You contributed **₹{new_goal.current_amount:,.0f}** to **{new_goal.title}**.\n\n"
    else:
        rich_text += f"You created the **{new_goal.title}** goal.\n\n"
        
    rich_text += f"**Progress:** ₹{new_goal.current_amount:,.0f} / ₹{new_goal.target_amount:,.0f}\n"
    rich_text += f"**Completed:** {pct:g}%\n"
    rich_text += f"**Remaining:** ₹{remaining:,.0f}\n\n"
    rich_text += time_str

    notif = Notification(
        user_id=current_user.id,
        type="goal_created",
        title=title_str,
        message=f"Created '{new_goal.title}' goal.",
        rich_text=rich_text,
        is_read=False,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(new_goal)
    return format_goal_out(new_goal)


@router.get("", response_model=List[schemas.SavingsGoalOut])
def get_savings_goals(
    status_filter: Optional[str] = Query(None, alias="status"),
    goal_type: Optional[str] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    query = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id)

    if status_filter:
        query = query.filter(SavingsGoal.status == status_filter)
    if goal_type:
        query = query.filter(SavingsGoal.goal_type == goal_type)
    if month:
        query = query.filter(extract("month", SavingsGoal.target_date) == month)
    if year:
        query = query.filter(extract("year", SavingsGoal.target_date) == year)

    goals = query.order_by(SavingsGoal.created_at.desc()).all()
    return [format_goal_out(g) for g in goals]


@router.get("/{goal_id}", response_model=schemas.SavingsGoalOut)
def get_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return format_goal_out(goal)


@router.put("/{goal_id}", response_model=schemas.SavingsGoalOut)
def update_savings_goal(
    goal_id: int,
    goal_in: schemas.SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    update_data = goal_in.model_dump(exclude_unset=True)

    if "title" in update_data and update_data["title"]:
        title_stripped = update_data["title"].strip()
        # Check if another active goal has this title
        existing_active_goal = db.query(SavingsGoal).filter(
            SavingsGoal.user_id == current_user.id,
            SavingsGoal.title == title_stripped,
            SavingsGoal.status == "in_progress",
            SavingsGoal.id != goal_id
        ).first()
        
        if existing_active_goal:
             raise HTTPException(status_code=400, detail=f"An active savings goal with the title '{title_stripped}' already exists.")

    if "target_amount" in update_data and update_data["target_amount"] <= 0:
        raise HTTPException(status_code=422, detail="Target amount must be greater than 0")

    if "target_date" in update_data and update_data["target_date"]:
        target_date_val = make_naive(update_data["target_date"])
        today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if target_date_val < today_start:
            raise HTTPException(status_code=422, detail="Target completion date cannot be in the past")
        update_data["target_date"] = target_date_val

    for field, val in update_data.items():
        if field == "title" and val:
            setattr(goal, field, val.strip())
        else:
            setattr(goal, field, val)

    if goal.current_amount >= goal.target_amount:
        goal.status = "completed"

    now = datetime.datetime.utcnow()
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    time_str = format_ist_notification_time(now)
    
    title_str = "📝 Saving Goal Updated"
    rich_text = f"**{title_str}**\n\nYou updated the **{goal.title}** goal.\n\n"
    rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\n"
    rich_text += f"**Completed:** {pct:g}%\n"
    rich_text += f"**Remaining:** ₹{remaining:,.0f}\n\n"
    rich_text += time_str

    notif = Notification(
        user_id=current_user.id,
        type="goal_updated",
        title=title_str,
        message=f"Updated '{goal.title}' goal.",
        rich_text=rich_text,
        is_read=False,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(goal)
    return format_goal_out(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    now = datetime.datetime.utcnow()
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    time_str = format_ist_notification_time(now)
    
    title_str = "🗑️ Saving Goal Deleted"
    rich_text = f"**{title_str}**\n\nYou deleted the **{goal.title}** goal.\n\n"
    rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\n"
    rich_text += f"**Completed:** {pct:g}%\n"
    rich_text += f"**Remaining:** ₹{remaining:,.0f}\n\n"
    rich_text += time_str

    notif = Notification(
        user_id=current_user.id,
        type="goal_deleted",
        title=title_str,
        message=f"Deleted '{goal.title}' goal.",
        rich_text=rich_text,
        is_read=False,
        created_at=now
    )
    db.add(notif)

    db.delete(goal)
    db.commit()
    return {"message": "Savings goal deleted successfully"}


@router.patch("/{goal_id}/contribute", response_model=schemas.ContributionResponse)
def contribute_to_goal(
    goal_id: int,
    contrib: schemas.ContributionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    from app.models import Account, GoalContribution, NotificationSettings

    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    if contrib.amount <= 0:
        raise HTTPException(status_code=400, detail="Contribution amount must be greater than 0")

    account = db.query(Account).filter(Account.id == contrib.account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    now = datetime.datetime.utcnow()

    # Function to create notification
    def create_notif(title_str, msg, rich_text_content, n_type):
        return Notification(
            user_id=current_user.id,
            title=title_str,
            message=msg,
            rich_text=rich_text_content,
            type=n_type,
            action_url="/goals",
            is_read=False,
            created_at=now
        )

    # Calculate current states before contribution
    pct_before = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining_before = goal.target_amount - goal.current_amount

    if contrib.amount > account.current_balance:
        shortage = contrib.amount - account.current_balance
        detail_msg = f"Cannot contribute ₹{contrib.amount:,.0f} to your goal.\n\nRequired: ₹{contrib.amount:,.0f}\nAvailable Balance: ₹{account.current_balance:,.0f}\nShortage: ₹{shortage:,.0f}"
        
        # Add failure notification
        time_str = format_ist_notification_time(now)
        title_str = "❌ Contribution Failed"
        rich_text = f"**{title_str}**\n\n"
        rich_text += f"You attempted to contribute **₹{contrib.amount:,.0f}** to **{goal.title}**, but you have insufficient balance in **{account.bank_name}**.\n\n"
        rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\n"
        rich_text += f"**Completed:** {pct_before:g}%\n"
        rich_text += f"**Remaining:** ₹{remaining_before:,.0f}\n\n"
        rich_text += time_str
        
        notif = create_notif(title_str, f"Failed to contribute ₹{contrib.amount:,.0f} to '{goal.title}'", rich_text, "goal_failed")
        db.add(notif)
        db.commit()
        
        raise HTTPException(status_code=400, detail=detail_msg)

    if remaining_before <= 0:
        raise HTTPException(status_code=400, detail="Goal is already fully achieved")

    if contrib.amount > remaining_before:
        raise HTTPException(
            status_code=400,
            detail=f"Contribution amount ₹{contrib.amount:,.0f} exceeds remaining target amount of ₹{remaining_before:,.0f}"
        )

    # Apply contribution
    account.current_balance -= contrib.amount
    goal.current_amount += contrib.amount
    
    new_pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining_after = goal.target_amount - goal.current_amount

    if goal.current_amount >= goal.target_amount:
        goal.status = "completed"

    contribution = GoalContribution(
        user_id=current_user.id,
        goal_id=goal.id,
        account_id=account.id,
        amount=contrib.amount,
        previous_amount=goal.current_amount - contrib.amount,
        new_amount=goal.current_amount,
        description=f"Contributed to {goal.title}",
        created_at=now,
        date=now
    )
    db.add(contribution)

    time_str = format_ist_notification_time(now)
    
    notified = set(goal.notified_thresholds.split(",")) if goal.notified_thresholds else set()
    newly_notified = list(notified)

    thresholds_to_check = [
        (100, "success", "completed"),
        (90, "critical", "almost_there"),
        (75, "warning", "great_progress"),
        (50, "warning", "halfway")
    ]
    
    created_notif = None

    for threshold, notif_type, notif_variant in thresholds_to_check:
        if new_pct >= threshold and str(threshold) not in notified:
            
            if threshold == 100:
                title_str = f"🎉 Saving Goal \"{goal.title}\" completed!"
                msg = f"You reached your target of ₹{goal.target_amount:,.0f}."
                rich_text = f"**{title_str}**\n\n{msg}\n\n{time_str}"
            elif threshold == 90:
                title_str = f"🎯 Almost there! You have completed 90% of your Saving Goal \"{goal.title}\"."
                msg = f"Only ₹{remaining_after:,.0f} remaining."
                rich_text = f"**{title_str}**\n\n{msg}\n\n{time_str}"
            elif threshold == 75:
                title_str = f"🎯 Great progress! You have completed 75% of your Saving Goal \"{goal.title}\"."
                msg = f"Saved: ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\nRemaining: ₹{remaining_after:,.0f}"
                rich_text = f"**{title_str}**\n\n{msg}\n\n{time_str}"
            else: # 50
                title_str = f"🎯 You have completed 50% of your Saving Goal \"{goal.title}\"."
                msg = f"Saved: ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\nRemaining: ₹{remaining_after:,.0f}"
                rich_text = f"**{title_str}**\n\n{msg}\n\n{time_str}"
                
            created_notif = create_notif(title_str, msg, rich_text, notif_type)
            db.add(created_notif)
            newly_notified.append(str(threshold))
            break
            
    for th, _, _ in thresholds_to_check:
        if new_pct >= th and str(th) not in newly_notified:
            newly_notified.append(str(th))

    goal.notified_thresholds = ",".join(newly_notified)

    db.commit()
    db.refresh(goal)
    return {'goal': format_goal_out(goal), 'notification': created_notif}
