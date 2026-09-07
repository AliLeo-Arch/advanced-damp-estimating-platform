"""Seed default local production users (assumed credentials)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import settings
from app.models import PricingSettings, User, UserRole


DEFAULT_USERS = [
    {
        "email": "admin@northbridge-demo.example",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN.value,
        "password": "DemoAdmin1!",
    },
    {
        "email": "owner@northbridge-demo.example",
        "full_name": "Commercial Manager",
        "role": UserRole.OWNER.value,
        "password": "DemoOwner1!",
    },
    {
        "email": "james.whitaker@northbridge-demo.example",
        "full_name": "James Whitaker",
        "role": UserRole.SURVEYOR.value,
        "password": "Surveyor1!",
    },
    {
        "email": "office@northbridge-demo.example",
        "full_name": "Office Administrator",
        "role": UserRole.OFFICE.value,
        "password": "DemoOffice1!",
    },
]


def seed_users_if_empty(db: Session) -> None:
    if db.query(User).count() > 0:
        return
    for row in DEFAULT_USERS:
        db.add(
            User(
                email=row["email"],
                full_name=row["full_name"],
                role=row["role"],
                password_hash=hash_password(row["password"]),
                active=1,
            )
        )
    db.commit()


def ensure_pricing_settings_defaults(db: Session) -> None:
    settings_row = db.query(PricingSettings).first()
    if not settings_row:
        return
    if getattr(settings_row, "min_permitted_margin_percent", None) is None:
        return
    # Keep assumed production defaults aligned with config when empty seed created them
    if not settings_row.payment_terms:
        settings_row.payment_terms = (
            "50% deposit on acceptance; balance due on completion."
        )
    settings_row.min_permitted_margin_percent = (
        settings.assumed_min_permitted_margin_percent
    )
    settings_row.survey_fee_default = settings.assumed_survey_fee
    from app.quotation import (
        DEFAULT_ACCEPTANCE,
        DEFAULT_ASSUMPTIONS,
        DEFAULT_EXCLUSIONS,
        DEFAULT_GUARANTEE,
        DEFAULT_SURVEY_FEE_CREDIT,
    )
    import json

    if not getattr(settings_row, "assumptions_json", None) or settings_row.assumptions_json in (
        "",
        "[]",
    ):
        settings_row.assumptions_json = json.dumps(DEFAULT_ASSUMPTIONS)
    if not getattr(settings_row, "exclusions_json", None) or settings_row.exclusions_json in (
        "",
        "[]",
    ):
        settings_row.exclusions_json = json.dumps(DEFAULT_EXCLUSIONS)
    if not getattr(settings_row, "guarantee_wording", None) or "Advanced Damp" in (
        settings_row.guarantee_wording or ""
    ):
        settings_row.guarantee_wording = DEFAULT_GUARANTEE
    if not getattr(settings_row, "survey_fee_credit_wording", None) or "Advanced Damp" in (
        settings_row.survey_fee_credit_wording or ""
    ):
        settings_row.survey_fee_credit_wording = DEFAULT_SURVEY_FEE_CREDIT
    if not getattr(settings_row, "acceptance_instructions", None):
        settings_row.acceptance_instructions = DEFAULT_ACCEPTANCE

    # Seed company profile from env defaults when blank (generic white-label config)
    if not getattr(settings_row, "company_display_name", None):
        settings_row.company_display_name = settings.company_name
    if not getattr(settings_row, "company_phone", None):
        settings_row.company_phone = settings.company_phone
    if not getattr(settings_row, "company_email", None):
        settings_row.company_email = settings.company_email
    if not getattr(settings_row, "company_address", None):
        settings_row.company_address = settings.company_address
    if not getattr(settings_row, "company_website", None):
        settings_row.company_website = settings.company_website
    if not getattr(settings_row, "company_tagline", None):
        settings_row.company_tagline = "Specialist Trade Estimating & Quoting"
    if not getattr(settings_row, "quote_prefix", None):
        settings_row.quote_prefix = "EST"
    db.commit()
