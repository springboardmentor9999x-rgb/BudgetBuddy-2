import datetime
from typing import List, Optional
from calendar import month_name
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.time_utils import create_global_notif
from app.models import User, Notification
from app import schemas, security

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifications


@router.patch("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/generate-monthly-report", response_model=schemas.NotificationOut, status_code=status.HTTP_201_CREATED)
def generate_monthly_report_notification(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    now = datetime.datetime.utcnow()
    target_month = month if month else now.month
    target_year = year if year else now.year

    month_str = month_name[target_month]
    msg = f"Your {month_str} {target_year} monthly report is ready."

    notification = create_global_notif(
        user_id=current_user.id,
        type_str="monthly_report",
        message=msg,
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}

@router.delete("/selected/bulk", status_code=status.HTTP_200_OK)
def delete_selected_notifications(
    req: schemas.BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    deleted_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.id.in_(req.notification_ids)
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"message": f"{deleted_count} notifications removed successfully"}
