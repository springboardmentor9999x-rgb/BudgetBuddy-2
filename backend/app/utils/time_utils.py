import datetime
from zoneinfo import ZoneInfo
from app.models import Notification

def get_current_utc_time() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)

def format_ist_notification_time(dt_utc: datetime.datetime = None) -> str:
    if dt_utc is None:
        dt_utc = get_current_utc_time()
    elif dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=datetime.UTC)
    
    ist_time = dt_utc.astimezone(ZoneInfo("Asia/Kolkata"))
    
    time_str = ist_time.strftime('%I:%M %p').lstrip('0')
    day = ist_time.day
    date_str = ist_time.strftime(f'%A, {day} %B %Y (IST)')
    return f"**{time_str}**\n**{date_str}**\n**Time in Vijayawada East**"

def create_global_notif(user_id: int, type_str: str, message: str, title: str = "Notification", rich_text_content: str = None, is_read: bool = False) -> Notification:
    time_footer = format_ist_notification_time()
    if rich_text_content:
        rich_text = f"**{title}**\n\n{rich_text_content}\n\n{time_footer}"
    else:
        rich_text = f"**{title}**\n\n{message}\n\n{time_footer}"
    
    return Notification(
        user_id=user_id,
        type=type_str,
        title=title,
        message=message,
        rich_text=rich_text,
        is_read=is_read
    )
