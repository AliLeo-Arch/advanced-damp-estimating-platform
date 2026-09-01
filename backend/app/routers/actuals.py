"""Actual job cost entry and quoted-vs-actual comparison."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.actuals import build_comparison, comparison_to_dict
from app.audit import write_audit
from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import Estimate, EstimateActuals, EstimateStatus, User
from app.schemas import ActualsRead, ActualsUpdate

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
