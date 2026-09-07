"""Resolve company / brand profile from database settings with env fallbacks."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.config import settings as env_settings
from app.models import PricingSettings


DEFAULT_TAGLINE = "Specialist Trade Estimating & Quoting"


@dataclass(frozen=True)
class CompanyProfile:
    name: str
    phone: str
    email: str
    address: str
    website: str
    tagline: str
    quote_prefix: str


def resolve_company_profile(
    settings_row: PricingSettings | None = None,
) -> CompanyProfile:
    row = settings_row
    return CompanyProfile(
        name=(getattr(row, "company_display_name", None) or "").strip()
        or env_settings.company_name,
        phone=(getattr(row, "company_phone", None) or "").strip()
        or env_settings.company_phone,
        email=(getattr(row, "company_email", None) or "").strip()
        or env_settings.company_email,
        address=(getattr(row, "company_address", None) or "").strip()
        or env_settings.company_address,
        website=(getattr(row, "company_website", None) or "").strip()
        or env_settings.company_website,
        tagline=(getattr(row, "company_tagline", None) or "").strip()
        or DEFAULT_TAGLINE,
        quote_prefix=(getattr(row, "quote_prefix", None) or "").strip() or "EST",
    )


def company_profile_from_db(db: Session) -> CompanyProfile:
    from app.estimate_service import get_settings

    return resolve_company_profile(get_settings(db))
