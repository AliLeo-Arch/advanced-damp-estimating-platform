"""Estimate persistence helpers and recalculation."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import Estimate, EstimateItem, PricingSettings, RateItem
from app.pricing_engine import calculate_estimate
from app.schemas import EstimateItemRead, EstimateRead


def rates_as_dicts(db: Session) -> list[dict[str, Any]]:
    rows = db.query(RateItem).filter(RateItem.active == 1).all()
    result = []
    for row in rows:
        result.append(
            {
                "code": row.code,
                "name": row.name,
                "category": row.category,
                "unit": row.unit,
                "cost_per_unit": row.cost_per_unit,
                "waste_percent": row.waste_percent,
                "notes": row.notes,
                "meta_json": row.meta_json,
                "meta": json.loads(row.meta_json or "{}"),
                "active": True,
            }
        )
    return result


def get_settings(db: Session) -> PricingSettings:
    settings = db.query(PricingSettings).first()
    if not settings:
        settings = PricingSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def serialize_estimate(estimate: Estimate) -> EstimateRead:
    items = []
    for item in estimate.items:
        items.append(
            EstimateItemRead(
                id=item.id,
                work_type=item.work_type,
                label=item.label,
                sort_order=item.sort_order,
                measurements=json.loads(item.measurements_json or "{}"),
                description=item.description,
                line_cost=item.line_cost,
                line_sell=item.line_sell,
                target_margin_percent=item.target_margin_percent,
            )
        )
    return EstimateRead(
        id=estimate.id,
        reference=estimate.reference,
        revision_no=estimate.revision_no or 1,
        parent_estimate_id=estimate.parent_estimate_id,
        customer_id=estimate.customer_id,
        site_id=estimate.site_id,
        survey_id=estimate.survey_id,
        customer_name=estimate.customer_name,
        company_name=estimate.company_name or "",
        email=estimate.email or "",
        telephone=estimate.telephone or "",
        site_address=estimate.site_address,
        postcode=estimate.postcode,
        surveyor=estimate.surveyor,
        survey_date=estimate.survey_date or "",
        status=estimate.status,
        notes=estimate.notes,
        travel_band_code=estimate.travel_band_code or "TRV-LOCAL",
        waste_code=estimate.waste_code or "WS-ALLOW-SMALL",
        prelim_codes=json.loads(estimate.prelim_codes_json or "[]"),
        materials_cost=estimate.materials_cost or 0.0,
        labour_cost=estimate.labour_cost or 0.0,
        waste_cost=estimate.waste_cost or 0.0,
        travel_cost=estimate.travel_cost or 0.0,
        prelim_cost=estimate.prelim_cost or 0.0,
        total_cost=estimate.total_cost,
        target_margin_percent=estimate.target_margin_percent or 0.0,
        calculated_sell_price=estimate.calculated_sell_price or 0.0,
        sell_price=estimate.sell_price,
        override_sell_price=estimate.override_sell_price,
        override_reason=estimate.override_reason or "",
        margin_value=estimate.margin_value,
        margin_percent=estimate.margin_percent,
        min_job_applied=bool(estimate.min_job_applied),
        below_target_margin=bool(estimate.below_target_margin),
        approved_by_user_id=estimate.approved_by_user_id,
        approved_at=estimate.approved_at.isoformat() if estimate.approved_at else None,
        approval_notes=estimate.approval_notes or "",
        breakdown=json.loads(estimate.breakdown_json or "{}"),
        items=items,
    )


def apply_pricing(
    db: Session,
    estimate: Estimate,
    *,
    work_items: list[dict[str, Any]] | None = None,
    travel_band_code: str | None = None,
    waste_code: str | None = None,
    prelim_codes: list[str] | None = None,
    override_sell_price: float | None = None,
    clear_override: bool = False,
) -> Estimate:
    settings = get_settings(db)
    margins = json.loads(settings.margins_json or "{}")
    rates = rates_as_dicts(db)

    if travel_band_code is not None:
        estimate.travel_band_code = travel_band_code
    if waste_code is not None:
        estimate.waste_code = waste_code
    if prelim_codes is not None:
        estimate.prelim_codes_json = json.dumps(prelim_codes)

    if clear_override:
        estimate.override_sell_price = None
    elif override_sell_price is not None:
        estimate.override_sell_price = override_sell_price

    if work_items is not None:
        estimate.items.clear()
        db.flush()
        for index, item in enumerate(work_items):
            estimate.items.append(
                EstimateItem(
                    work_type=item["work_type"],
                    label="",
                    sort_order=item.get("sort_order", index),
                    measurements_json=json.dumps(item.get("measurements") or {}),
                )
            )

    payload_items = [
        {
            "work_type": item.work_type,
            "measurements": json.loads(item.measurements_json or "{}"),
            "sort_order": item.sort_order,
        }
        for item in estimate.items
    ]

    result = calculate_estimate(
        work_items=payload_items,
        rates=rates,
        margins_by_type=margins,
        travel_band_code=estimate.travel_band_code or "TRV-LOCAL",
        waste_code=estimate.waste_code or "WS-ALLOW-SMALL",
        prelim_codes=json.loads(estimate.prelim_codes_json or "[]"),
        minimum_job_value=settings.minimum_job_value,
        override_sell_price=estimate.override_sell_price,
    )

    # Sync priced line metadata
    by_type_order = list(result.lines)
    for index, item in enumerate(estimate.items):
        if index < len(by_type_order):
            line = by_type_order[index]
            item.label = line.label
            item.description = line.description
            item.line_cost = line.line_cost
            item.line_sell = line.line_sell
            item.target_margin_percent = line.target_margin_percent
            item.breakdown_json = json.dumps(
                {"components": [c.__dict__ for c in line.components]}
            )
            item.measurements_json = json.dumps(line.measurements)

    estimate.materials_cost = result.materials_cost
    estimate.labour_cost = result.labour_cost
    estimate.waste_cost = result.waste_cost
    estimate.travel_cost = result.travel_cost
    estimate.prelim_cost = result.prelim_cost
    estimate.total_cost = result.total_cost
    estimate.target_margin_percent = result.target_margin_percent
    estimate.calculated_sell_price = result.calculated_sell_price
    estimate.sell_price = result.sell_price
    estimate.margin_value = result.margin_value
    estimate.margin_percent = result.margin_percent
    estimate.min_job_applied = 1 if result.min_job_applied else 0
    estimate.below_target_margin = 1 if result.below_target_margin else 0
    estimate.breakdown_json = json.dumps(result.breakdown)
    snapshot = result.breakdown.get("rate_snapshot") or {
        r["code"]: r["cost_per_unit"] for r in rates
    }
    estimate.rates_snapshot_json = json.dumps(snapshot)
    db.commit()
    db.refresh(estimate)
    return estimate
