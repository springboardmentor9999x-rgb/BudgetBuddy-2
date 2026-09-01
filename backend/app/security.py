import random
import string
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# BEARER TOKEN AUTHENTICATION
# ============================================================
# Swagger will now show an authorization box where you can
# paste the JWT access token directly.

bearer_scheme = HTTPBearer()


# ============================================================
# PASSWORD FUNCTIONS
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a plain-text password against its hashed password.
    """
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    """
    return pwd_context.hash(password)


# ============================================================
# PASSWORD STRENGTH
# ============================================================

def evaluate_password_strength(
    password: str
) -> Tuple[str, list]:
    """
    Evaluates password strength.

    Returns:
        (strength_level, list_of_missing_requirements)

    Levels:
        Weak
        Medium
        Strong
    """

    missing = []

    if len(password) < 8:
        missing.append("At least 8 characters")

    if not re.search(r"[a-z]", password):
        missing.append("One lowercase letter")

    if not re.search(r"[A-Z]", password):
        missing.append("One uppercase letter")

    if not re.search(r"\d", password):
        missing.append("One number")

    if not re.search(
        r"[!@#$%^&*(),.?\":{}|<>]",
        password
    ):
        missing.append("One special character")

    score = 5 - len(missing)

    if score <= 2:
        strength = "Weak"
    elif score <= 4:
        strength = "Medium"
    else:
        strength = "Strong"

    return strength, missing


# ============================================================
# JWT ACCESS TOKEN
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    """

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


# ============================================================
# OTP FUNCTIONS
# ============================================================

def generate_otp_code() -> str:
    """
    Generates a secure 6-digit OTP code.
    """
    return "".join(
        random.choices(string.digits, k=6)
    )


def hash_otp(otp_code: str) -> str:
    """
    Hash OTP using bcrypt.
    """
    return pwd_context.hash(otp_code)


def verify_otp_hash(
    otp_code: str,
    hashed_otp: str
) -> bool:
    """
    Verify OTP against its hashed value.
    """
    return pwd_context.verify(
        otp_code,
        hashed_otp
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the currently authenticated user from the JWT access token.

    Swagger sends:

        Authorization: Bearer <access_token>

    HTTPBearer extracts the token for us.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    # --------------------------------------------------------
    # Extract JWT token
    # --------------------------------------------------------

    token = credentials.credentials

    # --------------------------------------------------------
    # Decode JWT
    # --------------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise credentials_exception

    # --------------------------------------------------------
    # Check active status
    # --------------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user


# ============================================================
# CURRENT ACTIVE USER
# ============================================================

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Return the currently authenticated active user.
    """

    return current_user


# ============================================================
# CURRENT PREMIUM USER
# ============================================================

def get_current_premium_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Allow premium users and administrators.
    """

    if current_user.role not in [
        "premium",
        "admin"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

    return current_user


# ============================================================
# CURRENT ADMIN USER
# ============================================================

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Allow administrators only.
    """

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

    return current_user