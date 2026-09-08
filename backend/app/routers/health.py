from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.company import company_profile_from_db
from app.config import settings
from app.database import get_db
from app.schemas import CompanyProfileRead, HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        logger.exception("Health check database failure: %s", exc)
    status = "ok" if db_ok else "degraded"
    return HealthResponse(
        status=status,
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        database_ok=db_ok,
        demo_helpers=settings.demo_helpers_enabled,
    )


@router.get("/api/company", response_model=CompanyProfileRead)
def company_profile(db: Session = Depends(get_db)) -> CompanyProfileRead:
    """Public company branding for UI chrome and login footer."""
    profile = company_profile_from_db(db)
    return CompanyProfileRead(
        name=profile.name,
        phone=profile.phone,
        email=profile.email,
        address=profile.address,
        website=profile.website,
        tagline=profile.tagline,
        quote_prefix=profile.quote_prefix,
        app_name=settings.app_name,
    )
