import re

with open('app/routers/goals.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update format_goal_out
content = content.replace(
    'pct = round((goal.current_amount / goal.target_amount * 100), 1) if goal.target_amount > 0 else 0.0',
    'pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0'
)
content = content.replace(
    'cout.progress = round((c.new_amount / goal.target_amount * 100), 1) if goal.target_amount > 0 else 0.0',
    'cout.progress = (c.new_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0'
)

# 2. Add time format helper at the top
time_helper = """
def format_ist_notification_time(dt_utc):
    import zoneinfo
    import datetime
    ist = zoneinfo.ZoneInfo("Asia/Kolkata")
    ist_time = dt_utc.replace(tzinfo=datetime.timezone.utc).astimezone(ist)
    time_str = ist_time.strftime('%I:%M %p').lstrip('0')
    day = ist_time.day
    date_str = ist_time.strftime(f'%A, {day} %B %Y (IST)')
    return f"**{time_str}**\\n**{date_str}**\\n**Time in Vijayawada East**"
"""
if "def format_ist_notification_time" not in content:
    content = content.replace('def make_naive', time_helper + '\n\ndef make_naive')

# Replace the entire contribute_to_goal function
old_func_start = '@router.patch("/{goal_id}/contribute", response_model=schemas.ContributionResponse)'

new_func = """@router.patch("/{goal_id}/contribute", response_model=schemas.ContributionResponse)
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
        detail_msg = f"Cannot contribute ₹{contrib.amount:,.0f} to your goal.\\n\\nRequired: ₹{contrib.amount:,.0f}\\nAvailable Balance: ₹{account.current_balance:,.0f}\\nShortage: ₹{shortage:,.0f}"
        
        # Add failure notification
        time_str = format_ist_notification_time(now)
        title_str = "❌ Contribution Failed"
        rich_text = f"**{title_str}**\\n\\n"
        rich_text += f"You attempted to contribute **₹{contrib.amount:,.0f}** to **{goal.title}**, but you have insufficient balance in **{account.bank_name}**.\\n\\n"
        rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\\n"
        rich_text += f"**Completed:** {pct_before:g}%\\n"
        rich_text += f"**Remaining:** ₹{remaining_before:,.0f}\\n\\n"
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

    if goal.current_amount >= goal.target_amount:
        title_str = "🎉 Goal Completed!"
        rich_text = f"**{title_str}**\\n\\nYou contributed **₹{contrib.amount:,.0f}** to **{goal.title}**.\\n\\n"
        rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\\n"
        rich_text += f"**Completed:** {new_pct:g}%\\n"
        rich_text += f"**Remaining:** ₹{remaining_after:,.0f}\\n\\n"
        rich_text += time_str
        notif = create_notif(title_str, f"Completed '{goal.title}' goal.", rich_text, "goal_completed")
        db.add(notif)
    else:
        title_str = "Saving Goal Updated"
        rich_text = f"**{title_str}**\\n\\nYou contributed **₹{contrib.amount:,.0f}** to **{goal.title}**.\\n\\n"
        rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\\n"
        rich_text += f"**Completed:** {new_pct:g}%\\n"
        rich_text += f"**Remaining:** ₹{remaining_after:,.0f}\\n\\n"
        rich_text += time_str
        notif = create_notif(title_str, f"Added ₹{contrib.amount:,.0f} to '{goal.title}'", rich_text, "goal_contribution")
        db.add(notif)

    db.commit()
    db.refresh(goal)
    return format_goal_out(goal)
"""

parts = content.split(old_func_start)
if len(parts) == 2:
    new_content = parts[0] + new_func
    content = new_content
else:
    print("Could not find contribute_to_goal signature.")

# Create, Update, Delete overrides

old_create_notif = """    # Emit System Notification
    notif = Notification(
        user_id=current_user.id,
        type="goal_created",
        message=f"Savings goal '{new_goal.title}' created with target ₹{new_goal.target_amount:,.2f}.",
        is_read=False
    )
    db.add(notif)"""

new_create_notif = """    # Emit System Notification
    now = datetime.datetime.utcnow()
    pct = (new_goal.current_amount / new_goal.target_amount * 100) if new_goal.target_amount > 0 else 0.0
    remaining = max(0.0, new_goal.target_amount - new_goal.current_amount)
    time_str = format_ist_notification_time(now)
    
    title_str = "🎉 Saving Goal Created"
    rich_text = f"**{title_str}**\\n\\n"
    if new_goal.current_amount > 0:
        rich_text += f"You contributed **₹{new_goal.current_amount:,.0f}** to **{new_goal.title}**.\\n\\n"
    else:
        rich_text += f"You created the **{new_goal.title}** goal.\\n\\n"
        
    rich_text += f"**Progress:** ₹{new_goal.current_amount:,.0f} / ₹{new_goal.target_amount:,.0f}\\n"
    rich_text += f"**Completed:** {pct:g}%\\n"
    rich_text += f"**Remaining:** ₹{remaining:,.0f}\\n\\n"
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
    db.add(notif)"""
content = content.replace(old_create_notif, new_create_notif)

old_update_notif = """    notif = Notification(
        user_id=current_user.id,
        type="goal_updated",
        message=f"Savings goal '{goal.title}' has been updated.",
        is_read=False
    )
    db.add(notif)"""

new_update_notif = """    now = datetime.datetime.utcnow()
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    time_str = format_ist_notification_time(now)
    
    title_str = "📝 Saving Goal Updated"
    rich_text = f"**{title_str}**\\n\\nYou updated the **{goal.title}** goal.\\n\\n"
    rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\\n"
    rich_text += f"**Completed:** {pct:g}%\\n"
    rich_text += f"**Remaining:** ₹{remaining:,.0f}\\n\\n"
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
    db.add(notif)"""
content = content.replace(old_update_notif, new_update_notif)

old_delete_notif = """    notif = Notification(
        user_id=current_user.id,
        type="goal_deleted",
        message=f"Savings goal '{goal.title}' has been deleted.",
        is_read=False
    )
    db.add(notif)"""

new_delete_notif = """    now = datetime.datetime.utcnow()
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    time_str = format_ist_notification_time(now)
    
    title_str = "🗑️ Saving Goal Deleted"
    rich_text = f"**{title_str}**\\n\\nYou deleted the **{goal.title}** goal.\\n\\n"
    rich_text += f"**Progress:** ₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}\\n"
    rich_text += f"**Completed:** {pct:g}%\\n"
    rich_text += f"**Remaining:** ₹{remaining:,.0f}\\n\\n"
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
    db.add(notif)"""
content = content.replace(old_delete_notif, new_delete_notif)


with open('app/routers/goals.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated goals router!")
