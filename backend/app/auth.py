"""Local authentication helpers (JWT + password hashing)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS = {
    "admin": {
        "manage_users",
        "manage_rates",
        "manage_settings",
        "manage_customers",
        "manage_surveys",
        "create_estimates",
        "override_price",
        "approve_override",
        "view_audit",
        "manage_actuals",
        "backup",
    },
    "owner": {
        "manage_rates",
        "manage_settings",
        "manage_customers",
        "manage_surveys",
        "create_estimates",
        "override_price",
        "approve_override",
        "view_audit",
        "manage_actuals",
        "backup",
    },
    "surveyor": {
        "manage_customers",
        "manage_surveys",
        "create_estimates",
        "override_price",
    },
    "office": {
        "manage_customers",
        "manage_surveys",
        "create_estimates",
    },
    "accounts": {
        "manage_actuals",
        "view_audit",
    },
}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "exp": datetime.now(timezone.utc)
        + timedelta(hours=settings.jwt_expire_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    user = db.get(User, int(payload["sub"]))
    if not user or not user.active:
        raise HTTPException(status_code=401, detail="User inactive or not found")
    return user


def get_current_user_from_header_or_query(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    access_token: str | None = Query(None),
    db: Session = Depends(get_db),
) -> User:
    """Auth for browser downloads that cannot set Authorization headers."""
    token = credentials.credentials if credentials else access_token
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(token)
    user = db.get(User, int(payload["sub"]))
    if not user or not user.active:
        raise HTTPException(status_code=401, detail="User inactive or not found")
    return user


def require_permission(permission: str):
    def _dependency(user: User = Depends(get_current_user)) -> User:
        allowed = ROLE_PERMISSIONS.get(user.role, set())
        if permission not in allowed and user.role != "admin":
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    return _dependency


def optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return db.get(User, int(payload["sub"]))
    except HTTPException:
        return None
