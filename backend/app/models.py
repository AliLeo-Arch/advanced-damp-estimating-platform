"""Production-oriented SQLAlchemy models (local deployment)."""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstimateStatus(str, Enum):
    DRAFT = "draft"
    PRICED = "priced"
    REVIEW_REQUIRED = "review_required"
    APPROVED = "approved"
    READY_TO_QUOTE = "ready_to_quote"
    QUOTED = "quoted"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    CLOSED = "closed"


class UserRole(str, Enum):
    ADMIN = "admin"
    OWNER = "owner"
    SURVEYOR = "surveyor"
    OFFICE = "office"
    ACCOUNTS = "accounts"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(40), default=UserRole.SURVEYOR.value)
    password_hash: Mapped[str] = mapped_column(String(255))
    active: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_type: Mapped[str] = mapped_column(String(40), default="homeowner")
    name: Mapped[str] = mapped_column(String(200), index=True)
    company_name: Mapped[str] = mapped_column(String(200), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    telephone: Mapped[str] = mapped_column(String(50), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    sites: Mapped[list["Site"]] = relationship(
        "Site", back_populates="customer", cascade="all, delete-orphan"
    )


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    label: Mapped[str] = mapped_column(String(200), default="Main property")
    address_line1: Mapped[str] = mapped_column(String(300))
    address_line2: Mapped[str] = mapped_column(String(300), default="")
    town: Mapped[str] = mapped_column(String(120), default="")
    postcode: Mapped[str] = mapped_column(String(20), default="", index=True)
    property_type: Mapped[str] = mapped_column(String(80), default="residential")
    access_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="sites")
    surveys: Mapped[list["Survey"]] = relationship(
        "Survey", back_populates="site", cascade="all, delete-orphan"
    )


class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), index=True)
    reference: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    survey_type: Mapped[str] = mapped_column(String(80), default="site_survey")
    survey_date: Mapped[str] = mapped_column(String(20), default="")
    surveyor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    surveyor_name: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(40), default="completed")
    diagnosis_summary: Mapped[str] = mapped_column(Text, default="")
    recommended_works: Mapped[str] = mapped_column(Text, default="")
    survey_fee: Mapped[float] = mapped_column(Float, default=195.0)
    fee_creditable: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    site: Mapped["Site"] = relationship("Site", back_populates="surveys")
    estimates: Mapped[list["Estimate"]] = relationship("Estimate", back_populates="survey")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(200), default="")
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), default="")
    entity_id: Mapped[str] = mapped_column(String(80), default="")
    detail_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class RateItem(Base):
    __tablename__ = "rate_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(40), index=True)
    unit: Mapped[str] = mapped_column(String(40), default="each")
    cost_per_unit: Mapped[float] = mapped_column(Float, default=0.0)
    waste_percent: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str] = mapped_column(Text, default="")
    meta_json: Mapped[str] = mapped_column(Text, default="{}")
    active: Mapped[int] = mapped_column(Integer, default=1)
    effective_date: Mapped[str] = mapped_column(String(20), default="")

    versions: Mapped[list["RateVersion"]] = relationship(
        "RateVersion", back_populates="rate", cascade="all, delete-orphan"
    )


class RateVersion(Base):
    """Immutable cost history for a rate item (generic rate administration)."""

    __tablename__ = "rate_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rate_item_id: Mapped[int] = mapped_column(ForeignKey("rate_items.id"), index=True)
    previous_cost: Mapped[float] = mapped_column(Float, default=0.0)
    new_cost: Mapped[float] = mapped_column(Float, default=0.0)
    effective_date: Mapped[str] = mapped_column(String(20), default="")
    reason: Mapped[str] = mapped_column(Text, default="")
    changed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    changed_by_name: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )

    rate: Mapped["RateItem"] = relationship("RateItem", back_populates="versions")


class PricingSettings(Base):
    __tablename__ = "pricing_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    minimum_job_value: Mapped[float] = mapped_column(Float, default=750.0)
    vat_rate: Mapped[float] = mapped_column(Float, default=0.20)
    quote_validity_days: Mapped[int] = mapped_column(Integer, default=30)
    payment_terms: Mapped[str] = mapped_column(Text, default="")
    margins_json: Mapped[str] = mapped_column(Text, default="{}")
    min_permitted_margin_percent: Mapped[float] = mapped_column(Float, default=20.0)
    survey_fee_default: Mapped[float] = mapped_column(Float, default=195.0)
    assumptions_json: Mapped[str] = mapped_column(Text, default="[]")
    exclusions_json: Mapped[str] = mapped_column(Text, default="[]")
    guarantee_wording: Mapped[str] = mapped_column(Text, default="")
    survey_fee_credit_wording: Mapped[str] = mapped_column(Text, default="")
    acceptance_instructions: Mapped[str] = mapped_column(Text, default="")
    company_display_name: Mapped[str] = mapped_column(String(200), default="")
    company_phone: Mapped[str] = mapped_column(String(50), default="")
    company_email: Mapped[str] = mapped_column(String(200), default="")
    company_address: Mapped[str] = mapped_column(String(500), default="")
    company_website: Mapped[str] = mapped_column(String(300), default="")
    company_tagline: Mapped[str] = mapped_column(String(300), default="")
    quote_prefix: Mapped[str] = mapped_column(String(20), default="EST")


class Estimate(Base):
    __tablename__ = "estimates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reference: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    survey_id: Mapped[int | None] = mapped_column(ForeignKey("surveys.id"), nullable=True)
    revision_no: Mapped[int] = mapped_column(Integer, default=1)
    customer_name: Mapped[str] = mapped_column(String(200))
    company_name: Mapped[str] = mapped_column(String(200), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    telephone: Mapped[str] = mapped_column(String(50), default="")
    site_address: Mapped[str] = mapped_column(String(500), default="")
    postcode: Mapped[str] = mapped_column(String(20), default="")
    surveyor: Mapped[str] = mapped_column(String(100), default="")
    survey_date: Mapped[str] = mapped_column(String(20), default="")
    status: Mapped[str] = mapped_column(String(40), default=EstimateStatus.DRAFT.value)
    notes: Mapped[str] = mapped_column(Text, default="")
    travel_band_code: Mapped[str] = mapped_column(String(40), default="TRV-LOCAL")
    waste_code: Mapped[str] = mapped_column(String(40), default="WS-ALLOW-SMALL")
    prelim_codes_json: Mapped[str] = mapped_column(Text, default='["PRE-STD"]')
    materials_cost: Mapped[float] = mapped_column(Float, default=0.0)
    labour_cost: Mapped[float] = mapped_column(Float, default=0.0)
    waste_cost: Mapped[float] = mapped_column(Float, default=0.0)
    travel_cost: Mapped[float] = mapped_column(Float, default=0.0)
    prelim_cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)
    target_margin_percent: Mapped[float] = mapped_column(Float, default=0.0)
    calculated_sell_price: Mapped[float] = mapped_column(Float, default=0.0)
    sell_price: Mapped[float] = mapped_column(Float, default=0.0)
    override_sell_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    override_reason: Mapped[str] = mapped_column(Text, default="")
    margin_value: Mapped[float] = mapped_column(Float, default=0.0)
    margin_percent: Mapped[float] = mapped_column(Float, default=0.0)
    min_job_applied: Mapped[int] = mapped_column(Integer, default=0)
    below_target_margin: Mapped[int] = mapped_column(Integer, default=0)
    breakdown_json: Mapped[str] = mapped_column(Text, default="{}")
    rates_snapshot_json: Mapped[str] = mapped_column(Text, default="{}")
    parent_estimate_id: Mapped[int | None] = mapped_column(
        ForeignKey("estimates.id"), nullable=True
    )
    approved_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    approval_notes: Mapped[str] = mapped_column(Text, default="")
    quote_issued_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quote_valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quote_vat_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    quotation_snapshot_json: Mapped[str] = mapped_column(Text, default="{}")
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    accepted_by_name: Mapped[str] = mapped_column(String(200), default="")
    acceptance_method: Mapped[str] = mapped_column(String(80), default="")
    acceptance_po_reference: Mapped[str] = mapped_column(String(120), default="")
    acceptance_notes: Mapped[str] = mapped_column(Text, default="")
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    survey: Mapped["Survey | None"] = relationship("Survey", back_populates="estimates")
    items: Mapped[list["EstimateItem"]] = relationship(
        "EstimateItem",
        back_populates="estimate",
        cascade="all, delete-orphan",
        order_by="EstimateItem.sort_order",
    )
    actuals: Mapped["EstimateActuals | None"] = relationship(
        "EstimateActuals",
        back_populates="estimate",
        uselist=False,
        cascade="all, delete-orphan",
    )
    actual_entries: Mapped[list["EstimateActualEntry"]] = relationship(
        "EstimateActualEntry",
        back_populates="estimate",
        cascade="all, delete-orphan",
        order_by="EstimateActualEntry.sort_order, EstimateActualEntry.id",
    )


class EstimateActuals(Base):
    __tablename__ = "estimate_actuals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    estimate_id: Mapped[int] = mapped_column(
        ForeignKey("estimates.id"), unique=True, index=True
    )
    materials_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    labour_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    waste_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    travel_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    prelims_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    other_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    marked_complete: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    estimate: Mapped["Estimate"] = relationship("Estimate", back_populates="actuals")


class EstimateActualEntry(Base):
    """Detailed actual cost line that rolls up into a category total."""

    __tablename__ = "estimate_actual_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    estimate_id: Mapped[int] = mapped_column(ForeignKey("estimates.id"), index=True)
    category: Mapped[str] = mapped_column(String(40), index=True)
    description: Mapped[str] = mapped_column(String(300), default="")
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    occurred_on: Mapped[str] = mapped_column(String(20), default="")
    supplier_ref: Mapped[str] = mapped_column(String(120), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    estimate: Mapped["Estimate"] = relationship(
        "Estimate", back_populates="actual_entries"
    )


class EstimateItem(Base):
    __tablename__ = "estimate_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    estimate_id: Mapped[int] = mapped_column(ForeignKey("estimates.id"), index=True)
    work_type: Mapped[str] = mapped_column(String(40), index=True)
    label: Mapped[str] = mapped_column(String(200), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    measurements_json: Mapped[str] = mapped_column(Text, default="{}")
    description: Mapped[str] = mapped_column(Text, default="")
    line_cost: Mapped[float] = mapped_column(Float, default=0.0)
    line_sell: Mapped[float] = mapped_column(Float, default=0.0)
    target_margin_percent: Mapped[float] = mapped_column(Float, default=0.0)
    breakdown_json: Mapped[str] = mapped_column(Text, default="{}")

    estimate: Mapped["Estimate"] = relationship("Estimate", back_populates="items")
