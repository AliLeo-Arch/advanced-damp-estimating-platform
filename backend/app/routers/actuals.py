"""Actual job cost entry and quoted-vs-actual comparison."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.actuals import (
    ACTUAL_ENTRY_CATEGORIES,
    CATEGORY_TO_FIELD,
    build_comparison,
    build_comparison_from_view,
    comparison_to_dict,
    sync_category_totals_from_entries,
    view_with_entries,
)
from app.audit import write_audit
from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import Estimate, EstimateActualEntry, EstimateActuals, EstimateStatus, User
from app.pricing_engine import round_money
from app.schemas import (
    ActualEntryCreate,
    ActualEntryRead,
    ActualEntryUpdate,
    ActualsRead,
    ActualsSummaryItem,
    ActualsSummaryResponse,
    ActualsUpdate,
)

router = APIRouter(prefix="/estimates", tags=["actuals"])

ACTUALS_ELIGIBLE_STATUSES = {
    EstimateStatus.QUOTED.value,
    EstimateStatus.ACCEPTED.value,
    EstimateStatus.CLOSED.value,
}


def _get_estimate_or_404(estimate_id: int, db: Session) -> Estimate:
    estimate = db.get(Estimate, estimate_id)
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return estimate


def _require_actuals_eligible(estimate: Estimate, *, writing: bool = False) -> None:
    if estimate.status not in ACTUALS_ELIGIBLE_STATUSES:
        action = "recorded" if writing else "available"
        raise HTTPException(
            status_code=400,
            detail=(
                f"Actual costs are {action} once an estimate is quoted, accepted, or closed."
                if not writing
                else "Actual costs can only be recorded on quoted, accepted, or closed jobs."
            ),
        )


def _get_or_create_actuals(db: Session, estimate_id: int) -> EstimateActuals:
    row = db.query(EstimateActuals).filter(EstimateActuals.estimate_id == estimate_id).first()
    if row:
        return row
    row = EstimateActuals(
        estimate_id=estimate_id,
        materials_actual=None,
        labour_actual=None,
        waste_actual=None,
        travel_actual=None,
        prelims_actual=None,
        other_actual=None,
        revenue_actual=None,
        notes="",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _list_entries(db: Session, estimate_id: int) -> list[EstimateActualEntry]:
    return (
        db.query(EstimateActualEntry)
        .filter(EstimateActualEntry.estimate_id == estimate_id)
        .order_by(EstimateActualEntry.sort_order.asc(), EstimateActualEntry.id.asc())
        .all()
    )


def _serialize_entry(entry: EstimateActualEntry) -> ActualEntryRead:
    return ActualEntryRead(
        id=entry.id,
        estimate_id=entry.estimate_id,
        category=entry.category,
        description=entry.description or "",
        amount=round_money(float(entry.amount or 0)),
        occurred_on=entry.occurred_on or "",
        supplier_ref=entry.supplier_ref or "",
        sort_order=int(entry.sort_order or 0),
    )


def _serialize(estimate: Estimate, actuals: EstimateActuals, db: Session) -> ActualsRead:
    entries = _list_entries(db, estimate.id)
    view, driven = view_with_entries(actuals, entries)
    comparison = build_comparison_from_view(estimate, view)
    return ActualsRead(
        estimate_id=estimate.id,
        materials_actual=view.materials_actual,
        labour_actual=view.labour_actual,
        waste_actual=view.waste_actual,
        travel_actual=view.travel_actual,
        prelims_actual=view.prelims_actual,
        other_actual=view.other_actual,
        revenue_actual=view.revenue_actual,
        notes=view.notes,
        status=comparison.status,
        categories_entered=comparison.categories_entered,
        categories_total=comparison.categories_total,
        entries=[_serialize_entry(row) for row in entries],
        entry_driven_categories=sorted(driven),
        comparison=comparison_to_dict(comparison),
    )


def _validate_category(category: str) -> str:
    normalized = category.strip().lower()
    if normalized not in ACTUAL_ENTRY_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Category must be one of: {', '.join(ACTUAL_ENTRY_CATEGORIES)}",
        )
    return normalized


@router.get("/actuals-summary", response_model=ActualsSummaryResponse)
def actuals_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
) -> ActualsSummaryResponse:
    """Cross-job quoted-vs-actual reporting for jobs with recorded costs."""
    rows = (
        db.query(Estimate)
        .options(joinedload(Estimate.actuals))
        .join(EstimateActuals, EstimateActuals.estimate_id == Estimate.id)
        .filter(Estimate.status.in_(sorted(ACTUALS_ELIGIBLE_STATUSES)))
        .order_by(Estimate.updated_at.desc(), Estimate.id.desc())
        .limit(limit)
        .all()
    )
    items: list[ActualsSummaryItem] = []
    for estimate in rows:
        actuals = estimate.actuals
        if not actuals:
            continue
        entries = _list_entries(db, estimate.id)
        view, _driven = view_with_entries(actuals, entries)
        comparison = build_comparison_from_view(estimate, view)
        if comparison.status != "complete":
            continue
        if (
            comparison.total_cost.actual is None
            or comparison.actual_margin_percent is None
        ):
            continue
        items.append(
            ActualsSummaryItem(
                estimate_id=estimate.id,
                reference=estimate.reference,
                customer_name=estimate.customer_name,
                status=estimate.status,
                estimated_cost=comparison.total_cost.estimated,
                actual_cost=comparison.total_cost.actual,
                cost_variance=comparison.total_cost.variance or 0.0,
                estimated_revenue=comparison.revenue.estimated,
                actual_revenue=comparison.revenue.actual or comparison.revenue.estimated,
                estimated_margin_percent=comparison.estimated_margin_percent,
                actual_margin_percent=comparison.actual_margin_percent,
                margin_percent_variance=comparison.margin_percent_variance or 0.0,
            )
        )

    count = len(items)
    total_est = round_money(sum(item.estimated_cost for item in items))
    total_act = round_money(sum(item.actual_cost for item in items))
    avg_est_margin = (
        round(sum(item.estimated_margin_percent for item in items) / count, 2)
        if count
        else 0.0
    )
    avg_act_margin = (
        round(sum(item.actual_margin_percent for item in items) / count, 2)
        if count
        else 0.0
    )
    return ActualsSummaryResponse(
        items=items,
        count=count,
        total_estimated_cost=total_est,
        total_actual_cost=total_act,
        total_cost_variance=round_money(total_act - total_est),
        average_estimated_margin_percent=avg_est_margin,
        average_actual_margin_percent=avg_act_margin,
    )


@router.get("/{estimate_id}/actuals", response_model=ActualsRead)
def get_actuals(
    estimate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ActualsRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    _require_actuals_eligible(estimate, writing=False)
    actuals = _get_or_create_actuals(db, estimate_id)
    return _serialize(estimate, actuals, db)


@router.put("/{estimate_id}/actuals", response_model=ActualsRead)
def update_actuals(
    estimate_id: int,
    payload: ActualsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_actuals")),
) -> ActualsRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    _require_actuals_eligible(estimate, writing=True)
    actuals = _get_or_create_actuals(db, estimate_id)
    entries = _list_entries(db, estimate_id)
    driven = sync_category_totals_from_entries(actuals, entries)

    field_values = {
        "materials": payload.materials_actual,
        "labour": payload.labour_actual,
        "waste": payload.waste_actual,
        "travel": payload.travel_actual,
        "prelims": payload.prelims_actual,
        "other": payload.other_actual,
    }
    for category, value in field_values.items():
        if category in driven:
            continue
        setattr(actuals, CATEGORY_TO_FIELD[category], value)

    actuals.revenue_actual = payload.revenue_actual
    actuals.notes = payload.notes
    db.commit()
    db.refresh(actuals)

    comparison = build_comparison(estimate, actuals)
    write_audit(
        db,
        action="actuals_updated",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "total_actual": comparison.total_cost.actual,
            "actual_margin_percent": comparison.actual_margin_percent,
            "entry_driven_categories": sorted(driven),
        },
        actor=user,
    )
    return _serialize(estimate, actuals, db)


@router.post(
    "/{estimate_id}/actuals/entries",
    response_model=ActualsRead,
    status_code=201,
)
def create_actual_entry(
    estimate_id: int,
    payload: ActualEntryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_actuals")),
) -> ActualsRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    _require_actuals_eligible(estimate, writing=True)
    category = _validate_category(payload.category)
    actuals = _get_or_create_actuals(db, estimate_id)
    existing = _list_entries(db, estimate_id)
    next_order = (max((row.sort_order for row in existing), default=-1) + 1)

    entry = EstimateActualEntry(
        estimate_id=estimate_id,
        category=category,
        description=(payload.description or "").strip(),
        amount=round_money(float(payload.amount)),
        occurred_on=(payload.occurred_on or "").strip(),
        supplier_ref=(payload.supplier_ref or "").strip(),
        sort_order=next_order,
    )
    db.add(entry)
    db.flush()
    entries = _list_entries(db, estimate_id)
    sync_category_totals_from_entries(actuals, entries)
    db.commit()
    db.refresh(actuals)

    write_audit(
        db,
        action="actuals_entry_created",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "category": category,
            "amount": entry.amount,
            "entry_id": entry.id,
        },
        actor=user,
    )
    return _serialize(estimate, actuals, db)


@router.put(
    "/{estimate_id}/actuals/entries/{entry_id}",
    response_model=ActualsRead,
)
def update_actual_entry(
    estimate_id: int,
    entry_id: int,
    payload: ActualEntryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_actuals")),
) -> ActualsRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    _require_actuals_eligible(estimate, writing=True)
    entry = db.get(EstimateActualEntry, entry_id)
    if not entry or entry.estimate_id != estimate_id:
        raise HTTPException(status_code=404, detail="Actual cost entry not found")
    actuals = _get_or_create_actuals(db, estimate_id)

    if payload.description is not None:
        entry.description = payload.description.strip()
    if payload.amount is not None:
        entry.amount = round_money(float(payload.amount))
    if payload.occurred_on is not None:
        entry.occurred_on = payload.occurred_on.strip()
    if payload.supplier_ref is not None:
        entry.supplier_ref = payload.supplier_ref.strip()

    entries = _list_entries(db, estimate_id)
    sync_category_totals_from_entries(actuals, entries)
    db.commit()
    db.refresh(actuals)

    write_audit(
        db,
        action="actuals_entry_updated",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "entry_id": entry.id,
            "category": entry.category,
            "amount": entry.amount,
        },
        actor=user,
    )
    return _serialize(estimate, actuals, db)


@router.delete(
    "/{estimate_id}/actuals/entries/{entry_id}",
    response_model=ActualsRead,
)
def delete_actual_entry(
    estimate_id: int,
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_actuals")),
) -> ActualsRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    _require_actuals_eligible(estimate, writing=True)
    entry = db.get(EstimateActualEntry, entry_id)
    if not entry or entry.estimate_id != estimate_id:
        raise HTTPException(status_code=404, detail="Actual cost entry not found")
    actuals = _get_or_create_actuals(db, estimate_id)
    category = entry.category
    db.delete(entry)
    db.flush()

    remaining = _list_entries(db, estimate_id)
    driven = sync_category_totals_from_entries(actuals, remaining)
    # If the category no longer has lines, clear the rolled-up total so it
    # returns to "not entered" rather than leaving a stale sum.
    if category not in driven and category in CATEGORY_TO_FIELD:
        setattr(actuals, CATEGORY_TO_FIELD[category], None)

    db.commit()
    db.refresh(actuals)

    write_audit(
        db,
        action="actuals_entry_deleted",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "entry_id": entry_id,
            "category": category,
        },
        actor=user,
    )
    return _serialize(estimate, actuals, db)
