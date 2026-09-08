"""Rate table and pricing settings endpoints."""

from __future__ import annotations

import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.auth import get_current_user, require_permission
from app.database import get_db
from app.estimate_service import get_settings
from app.models import RateItem, RateVersion, User
from app.rate_query import RateSearchParams, pagination_meta, search_rates
from app.rate_versions import record_rate_version
from app.schemas import (
    PricingSettingsRead,
    RateItemRead,
    RateListResponse,
    RateVersionRead,
)

router = APIRouter(prefix="/rates", tags=["rates"])


def _rate_search_params_from_query(
    q: str | None = Query(None, max_length=200),
    category: str | None = Query(None, max_length=40),
    include_inactive: bool = Query(False),
    sort: str = Query("category_asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
) -> RateSearchParams:
    return RateSearchParams(
        q=q,
        category=category,
        include_inactive=include_inactive,
        sort=sort,
        page=page,
        page_size=page_size,
    )


class RateItemCreate(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=40)
    unit: str = "each"
    cost_per_unit: float = Field(ge=0)
    waste_percent: float = Field(default=0.0, ge=0, le=100)
    notes: str = ""
    active: bool = True


class RateItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=40)
    unit: str | None = None
    cost_per_unit: float | None = Field(default=None, ge=0)
    waste_percent: float | None = Field(default=None, ge=0, le=100)
    notes: str | None = None
    active: bool | None = None
    change_reason: str | None = None
    effective_date: str | None = None


class PricingSettingsUpdate(BaseModel):
    minimum_job_value: float | None = Field(default=None, ge=0)
    vat_rate: float | None = Field(default=None, ge=0, le=1)
    quote_validity_days: int | None = Field(default=None, ge=1, le=365)
    payment_terms: str | None = None
    margins_by_work_type: dict[str, float] | None = None
    min_permitted_margin_percent: float | None = Field(default=None, ge=0, le=100)
    survey_fee_default: float | None = Field(default=None, ge=0)
    company_display_name: str | None = None
    company_phone: str | None = None
    company_email: str | None = None
    company_address: str | None = None
    company_website: str | None = None
    company_tagline: str | None = None
    quote_prefix: str | None = Field(default=None, max_length=20)


class RateImportRow(BaseModel):
    code: str
    name: str
    category: str
    cost_per_unit: float | str
    unit: str | None = "each"
    waste_percent: float | str | None = 0
    notes: str | None = ""
    active: bool | str | None = True


class RateImportRequest(BaseModel):
    rows: list[RateImportRow]


class RateImportResponse(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[str] = []



def _settings_read(settings) -> PricingSettingsRead:
    from app.company import resolve_company_profile

    profile = resolve_company_profile(settings)
    return PricingSettingsRead(
        minimum_job_value=settings.minimum_job_value,
        vat_rate=settings.vat_rate,
        quote_validity_days=settings.quote_validity_days,
        payment_terms=settings.payment_terms,
        margins_by_work_type=json.loads(settings.margins_json or "{}"),
        min_permitted_margin_percent=settings.min_permitted_margin_percent or 20.0,
        survey_fee_default=settings.survey_fee_default or 195.0,
        company_display_name=profile.name,
        company_phone=profile.phone,
        company_email=profile.email,
        company_address=profile.address,
        company_website=profile.website,
        company_tagline=profile.tagline,
        quote_prefix=profile.quote_prefix,
    )


@router.get("/", response_model=RateListResponse)
def list_rates(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    params: RateSearchParams = Depends(_rate_search_params_from_query),
) -> RateListResponse:
    rows, total, normalized = search_rates(db, params)
    meta = pagination_meta(total, normalized.page, normalized.page_size)
    return RateListResponse(
        items=rows,
        total=int(meta["total"]),
        page=int(meta["page"]),
        page_size=int(meta["page_size"]),
        total_pages=int(meta["total_pages"]),
        has_next=bool(meta["has_next"]),
        has_prev=bool(meta["has_prev"]),
    )


@router.get("/settings", response_model=PricingSettingsRead)
def pricing_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PricingSettingsRead:
    return _settings_read(get_settings(db))


@router.put("/settings", response_model=PricingSettingsRead)
def update_pricing_settings(
    payload: PricingSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_settings")),
) -> PricingSettingsRead:
    settings = get_settings(db)
    data = payload.model_dump(exclude_unset=True)
    margins = data.pop("margins_by_work_type", None)
    for key, value in data.items():
        setattr(settings, key, value)
    if margins is not None:
        cleaned = {k: float(v) for k, v in margins.items()}
        settings.margins_json = json.dumps(cleaned)
    db.commit()
    db.refresh(settings)
    write_audit(
        db,
        action="pricing_settings_updated",
        entity_type="pricing_settings",
        entity_id=settings.id,
        detail=payload.model_dump(exclude_unset=True),
        actor=user,
    )
    return _settings_read(settings)


@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    rows = db.query(RateItem.category).distinct().all()
    return {"categories": sorted({row[0] for row in rows if row[0]})}


@router.post("/import", response_model=RateImportResponse)
def import_rates(
    payload: RateImportRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_rates")),
) -> RateImportResponse:
    from app.rate_import import import_rates_from_rows

    rows = [row.model_dump() for row in payload.rows]
    # normalize_row expects string-ish dict values
    string_rows: list[dict[str, str]] = []
    for row in rows:
        string_rows.append({key: "" if value is None else str(value) for key, value in row.items()})
    result = import_rates_from_rows(db, string_rows)
    if result.errors:
        raise HTTPException(status_code=400, detail="; ".join(result.errors[:8]))
    write_audit(
        db,
        action="rates_imported",
        entity_type="rate",
        entity_id="",
        detail={
            "created": result.created,
            "updated": result.updated,
            "skipped": result.skipped,
        },
        actor=user,
    )
    return RateImportResponse(
        created=result.created,
        updated=result.updated,
        skipped=result.skipped,
        errors=result.errors,
    )


@router.post("/", response_model=RateItemRead, status_code=201)
def create_rate(
    payload: RateItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_rates")),
) -> RateItem:
    code = payload.code.strip().upper()
    existing = db.query(RateItem).filter(RateItem.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rate code already exists")
    rate = RateItem(
        code=code,
        name=payload.name.strip(),
        category=payload.category.strip(),
        unit=payload.unit.strip() or "each",
        cost_per_unit=payload.cost_per_unit,
        waste_percent=payload.waste_percent,
        notes=payload.notes,
        active=1 if payload.active else 0,
        effective_date=date.today().isoformat(),
    )
    db.add(rate)
    db.flush()
    record_rate_version(
        db,
        rate,
        previous_cost=0.0,
        new_cost=rate.cost_per_unit,
        reason="Initial rate created",
        effective_date=rate.effective_date,
        actor=user,
    )
    db.commit()
    db.refresh(rate)
    write_audit(
        db,
        action="rate_created",
        entity_type="rate_item",
        entity_id=rate.id,
        detail={"code": rate.code, "cost_per_unit": rate.cost_per_unit},
        actor=user,
    )
    return rate


@router.get("/{rate_id}/versions", response_model=list[RateVersionRead])
def list_rate_versions(
    rate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("manage_rates")),
) -> list[RateVersionRead]:
    rate = db.get(RateItem, rate_id)
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    rows = (
        db.query(RateVersion)
        .filter(RateVersion.rate_item_id == rate_id)
        .order_by(RateVersion.created_at.desc(), RateVersion.id.desc())
        .all()
    )
    return [
        RateVersionRead(
            id=row.id,
            rate_item_id=row.rate_item_id,
            previous_cost=row.previous_cost,
            new_cost=row.new_cost,
            effective_date=row.effective_date or "",
            reason=row.reason or "",
            changed_by_name=row.changed_by_name or "",
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
        for row in rows
    ]


@router.put("/{rate_id}", response_model=RateItemRead)
def update_rate(
    rate_id: int,
    payload: RateItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_rates")),
) -> RateItem:
    rate = db.get(RateItem, rate_id)
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    data = payload.model_dump(exclude_unset=True)
    change_reason = data.pop("change_reason", None) or ""
    effective_date = data.pop("effective_date", None) or ""
    if "active" in data:
        data["active"] = 1 if data["active"] else 0
    previous_cost = float(rate.cost_per_unit)
    for key, value in data.items():
        setattr(rate, key, value)
    if "cost_per_unit" in data and abs(float(data["cost_per_unit"]) - previous_cost) > 1e-9:
        stamp = effective_date or date.today().isoformat()
        rate.effective_date = stamp
        record_rate_version(
            db,
            rate,
            previous_cost=previous_cost,
            new_cost=float(rate.cost_per_unit),
            reason=change_reason or "Cost updated",
            effective_date=stamp,
            actor=user,
        )
    db.commit()
    db.refresh(rate)
    write_audit(
        db,
        action="rate_updated",
        entity_type="rate_item",
        entity_id=rate.id,
        detail={
            "code": rate.code,
            "cost_per_unit": rate.cost_per_unit,
            "active": bool(rate.active),
            "changed": list(data.keys()),
            "change_reason": change_reason,
        },
        actor=user,
    )
    return rate
