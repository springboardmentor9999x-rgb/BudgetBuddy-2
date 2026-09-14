from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Profile
from app import schemas, security

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=schemas.ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        # Create default profile if missing
        profile = Profile(user_id=current_user.id, full_name=current_user.full_name, currency="INR (₹)")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("", response_model=schemas.ProfileOut)
def update_profile(
    profile_in: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id, full_name=current_user.full_name, currency="INR (₹)")
        db.add(profile)

    if profile_in.full_name is not None:
        profile.full_name = profile_in.full_name
        current_user.full_name = profile_in.full_name
    if profile_in.currency is not None:
        profile.currency = profile_in.currency

    db.commit()
    db.refresh(profile)
    return profile
