"""Estimate lifecycle, approval rules, and revisions."""

from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Estimate, EstimateItem, EstimateStatus, User
from app.estimate_service import get_settings


# Assumed production transitions (confirm with Advanced Damp)
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    EstimateStatus.DRAFT.value: {
        EstimateStatus.PRICED.value,
        EstimateStatus.REVIEW_REQUIRED.value,
    },
    EstimateStatus.PRICED.value: {
        EstimateStatus.REVIEW_REQUIRED.value,
        EstimateStatus.APPROVED.value,
        EstimateStatus.READY_TO_QUOTE.value,
        EstimateStatus.DRAFT.value,
    },
    EstimateStatus.REVIEW_REQUIRED.value: {
        EstimateStatus.APPROVED.value,
        EstimateStatus.PRICED.value,
        EstimateStatus.DRAFT.value,
    },
    EstimateStatus.APPROVED.value: {
        EstimateStatus.READY_TO_QUOTE.value,
        EstimateStatus.PRICED.value,
        EstimateStatus.DRAFT.value,
    },
    EstimateStatus.READY_TO_QUOTE.value: {
        EstimateStatus.QUOTED.value,
        EstimateStatus.PRICED.value,
        EstimateStatus.DRAFT.value,
    },
    EstimateStatus.QUOTED.value: {
        EstimateStatus.ACCEPTED.value,
        EstimateStatus.DECLINED.value,
        EstimateStatus.EXPIRED.value,
        EstimateStatus.CLOSED.value,
    },
    EstimateStatus.ACCEPTED.value: {EstimateStatus.CLOSED.value},
    EstimateStatus.DECLINED.value: {EstimateStatus.CLOSED.value},
    EstimateStatus.EXPIRED.value: {EstimateStatus.CLOSED.value},
    EstimateStatus.CLOSED.value: set(),
}

# Statuses that lock commercial edits (must revise instead)
LOCKED_STATUSES = {
    EstimateStatus.QUOTED.value,
    EstimateStatus.ACCEPTED.value,
    EstimateStatus.DECLINED.value,
    EstimateStatus.EXPIRED.value,
    EstimateStatus.CLOSED.value,
}


def assert_transition(current: str, target: str) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move estimate from '{current}' to '{target}'",
        )


def resolve_status_after_pricing(estimate: Estimate) -> str:
    """
    Assumed approval policy:
    - override OR below target margin → review_required
    - already approved stays approved until a new revision
    - otherwise → priced
    """
    needs_review = False
    if estimate.override_sell_price is not None:
        needs_review = True
    if estimate.below_target_margin and settings.assumed_override_requires_approval_below_target:
        needs_review = True
    if needs_review:
        if estimate.status == EstimateStatus.APPROVED.value:
            return EstimateStatus.APPROVED.value
        if estimate.status == EstimateStatus.READY_TO_QUOTE.value:
            return EstimateStatus.READY_TO_QUOTE.value
        return EstimateStatus.REVIEW_REQUIRED.value
    return EstimateStatus.PRICED.value


def assert_can_issue_quotation(estimate: Estimate, db: Session) -> None:
    """Block customer quotation when commercial gates fail."""
    pricing = get_settings(db)
    min_margin = float(pricing.min_permitted_margin_percent or 20.0)

    if estimate.status == EstimateStatus.REVIEW_REQUIRED.value:
        raise HTTPException(
            status_code=400,
            detail="Estimate requires manager approval before quotation.",
        )
    if estimate.status not in {
        EstimateStatus.APPROVED.value,
        EstimateStatus.READY_TO_QUOTE.value,
        EstimateStatus.QUOTED.value,
        EstimateStatus.PRICED.value,
    }:
        # Priced is OK if not below target; review_required already blocked
        if estimate.status in LOCKED_STATUSES and estimate.status != EstimateStatus.QUOTED.value:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot issue quotation from status '{estimate.status}'.",
            )
        if estimate.status in {EstimateStatus.DRAFT.value}:
            raise HTTPException(
                status_code=400,
                detail="Price the estimate before generating a quotation.",
            )

    if estimate.margin_percent + 0.01 < min_margin:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Margin {estimate.margin_percent:.2f}% is below the minimum permitted "
                f"{min_margin:.2f}%. Manager approval and a higher sell price are required."
            ),
        )

    if estimate.status == EstimateStatus.PRICED.value and estimate.below_target_margin:
        raise HTTPException(
            status_code=400,
            detail="Below-target margin requires approval before quotation.",
        )


def approve_estimate(
    estimate: Estimate,
    *,
    actor: User,
    notes: str = "",
) -> None:
    if estimate.status not in {
        EstimateStatus.REVIEW_REQUIRED.value,
        EstimateStatus.PRICED.value,
    }:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve estimate in status '{estimate.status}'.",
        )
    estimate.status = EstimateStatus.APPROVED.value
    estimate.approved_by_user_id = actor.id
    estimate.approved_at = datetime.utcnow()
    estimate.approval_notes = notes or estimate.approval_notes or ""


def create_revision(db: Session, source: Estimate, *, actor: User) -> Estimate:
    """Clone a locked/quoted estimate into a new draft revision."""
    if source.status not in LOCKED_STATUSES | {
        EstimateStatus.READY_TO_QUOTE.value,
        EstimateStatus.APPROVED.value,
        EstimateStatus.PRICED.value,
        EstimateStatus.REVIEW_REQUIRED.value,
    }:
        # Allow revise from most non-draft states; draft can just edit in place
        pass

    next_rev = (source.revision_no or 1) + 1
    # Keep family reference readable: AD-00001 → AD-00001-R2
    base_ref = source.reference.split("-R")[0]
    new_ref = f"{base_ref}-R{next_rev}"
    while db.query(Estimate).filter(Estimate.reference == new_ref).first():
        next_rev += 1
        new_ref = f"{base_ref}-R{next_rev}"

    clone = Estimate(
        reference=new_ref,
        customer_id=source.customer_id,
        site_id=source.site_id,
        survey_id=source.survey_id,
        revision_no=next_rev,
        parent_estimate_id=source.id,
        customer_name=source.customer_name,
        company_name=source.company_name,
        email=source.email,
        telephone=source.telephone,
        site_address=source.site_address,
        postcode=source.postcode,
        surveyor=source.surveyor,
        survey_date=source.survey_date,
        status=EstimateStatus.DRAFT.value,
        notes=source.notes,
        travel_band_code=source.travel_band_code,
        waste_code=source.waste_code,
        prelim_codes_json=source.prelim_codes_json,
        materials_cost=source.materials_cost,
        labour_cost=source.labour_cost,
        waste_cost=source.waste_cost,
        travel_cost=source.travel_cost,
        prelim_cost=source.prelim_cost,
        total_cost=source.total_cost,
        target_margin_percent=source.target_margin_percent,
        calculated_sell_price=source.calculated_sell_price,
        sell_price=source.sell_price,
        override_sell_price=source.override_sell_price,
        override_reason=source.override_reason,
        margin_value=source.margin_value,
        margin_percent=source.margin_percent,
        min_job_applied=source.min_job_applied,
        below_target_margin=source.below_target_margin,
        breakdown_json=source.breakdown_json,
        rates_snapshot_json=source.rates_snapshot_json,
        created_by_user_id=actor.id,
        approval_notes="",
        approved_by_user_id=None,
        approved_at=None,
    )
    db.add(clone)
    db.flush()
    for item in source.items:
        db.add(
            EstimateItem(
                estimate_id=clone.id,
                work_type=item.work_type,
                label=item.label,
                sort_order=item.sort_order,
                measurements_json=item.measurements_json,
                description=item.description,
                line_cost=item.line_cost,
                line_sell=item.line_sell,
                target_margin_percent=item.target_margin_percent,
                breakdown_json=item.breakdown_json,
            )
        )
    db.commit()
    db.refresh(clone)
    return clone
