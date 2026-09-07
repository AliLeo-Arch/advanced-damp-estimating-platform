"""Actual job cost entry and quoted-vs-actual comparison."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.actuals import build_comparison, comparison_to_dict
from app.audit import write_audit
from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import Estimate, EstimateActuals, EstimateStatus, User
from app.pricing_engine import round_money
from app.schemas import (
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


def _get_or_create_actuals(db: Session, estimate_id: int) -> EstimateActuals:
    row = db.query(EstimateActuals).filter(EstimateActuals.estimate_id == estimate_id).first()
    if row:
        return row
    row = EstimateActuals(estimate_id=estimate_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _serialize(estimate: Estimate, actuals: EstimateActuals) -> ActualsRead:
    comparison = build_comparison(estimate, actuals)
    return ActualsRead(
        estimate_id=estimate.id,
        materials_actual=actuals.materials_actual or 0,
        labour_actual=actuals.labour_actual or 0,
        waste_actual=actuals.waste_actual or 0,
        travel_actual=actuals.travel_actual or 0,
        prelims_actual=actuals.prelims_actual or 0,
        other_actual=actuals.other_actual or 0,
        revenue_actual=actuals.revenue_actual,
        notes=actuals.notes or "",
        comparison=comparison_to_dict(comparison),
    )


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
        # Skip untouched zero rows so the dashboard shows meaningful jobs only.
        touched = any(
            [
                actuals.materials_actual,
                actuals.labour_actual,
                actuals.waste_actual,
                actuals.travel_actual,
                actuals.prelims_actual,
                actuals.other_actual,
                actuals.revenue_actual is not None,
                (actuals.notes or "").strip(),
            ]
        )
        if not touched:
            continue
        comparison = build_comparison(estimate, actuals)
        items.append(
            ActualsSummaryItem(
                estimate_id=estimate.id,
                reference=estimate.reference,
                customer_name=estimate.customer_name,
                status=estimate.status,
                estimated_cost=comparison.total_cost.estimated,
                actual_cost=comparison.total_cost.actual,
                cost_variance=comparison.total_cost.variance,
                estimated_revenue=comparison.revenue.estimated,
                actual_revenue=comparison.revenue.actual,
                estimated_margin_percent=comparison.estimated_margin_percent,
                actual_margin_percent=comparison.actual_margin_percent,
                margin_percent_variance=comparison.margin_percent_variance,
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
    if estimate.status not in ACTUALS_ELIGIBLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Actual costs are available once an estimate is quoted, accepted, or closed."
            ),
        )
    actuals = _get_or_create_actuals(db, estimate_id)
    return _serialize(estimate, actuals)


@router.put("/{estimate_id}/actuals", response_model=ActualsRead)
def update_actuals(
    estimate_id: int,
    payload: ActualsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_actuals")),
) -> ActualsRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    if estimate.status not in ACTUALS_ELIGIBLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Actual costs can only be recorded on quoted, accepted, or closed jobs.",
        )
    actuals = _get_or_create_actuals(db, estimate_id)
    actuals.materials_actual = payload.materials_actual
    actuals.labour_actual = payload.labour_actual
    actuals.waste_actual = payload.waste_actual
    actuals.travel_actual = payload.travel_actual
    actuals.prelims_actual = payload.prelims_actual
    actuals.other_actual = payload.other_actual
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
        },
        actor=user,
    )
    return _serialize(estimate, actuals)
