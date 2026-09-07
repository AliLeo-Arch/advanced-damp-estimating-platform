from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import (
    ROLE_PERMISSIONS,
    create_access_token,
    get_current_user,
    verify_password,
)
from app.audit import write_audit
from app.database import get_db
from app.login_throttle import (
    assert_login_allowed,
    record_login_failure,
    record_login_success,
)
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1)


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    permissions: list[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


def _user_read(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        permissions=sorted(ROLE_PERMISSIONS.get(user.role, set())),
    )


def _throttle_key(request: Request, email: str) -> str:
    client = request.client.host if request.client else "unknown"
    return f"{client}:{email.lower().strip()}"


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    key = _throttle_key(request, payload.email)
    assert_login_allowed(key)
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.active or not verify_password(payload.password, user.password_hash):
        record_login_failure(key)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    record_login_success(key)
    token = create_access_token(user)
    write_audit(
        db,
        action="login",
        entity_type="user",
        entity_id=user.id,
        actor=user,
    )
    return TokenResponse(access_token=token, user=_user_read(user))


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> UserRead:
    return _user_read(user)
