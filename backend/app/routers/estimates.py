"""Estimate endpoints with work scope, pricing, and quotation."""

from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.auth import (
    ROLE_PERMISSIONS,
    get_current_user,
    get_current_user_from_header_or_query,
    require_permission,
)
from app.database import get_db
from app.estimate_export import (
    render_estimate_csv,
    render_estimate_xlsx,
    render_estimates_list_csv,
)
from app.estimate_query import (
    EstimateSearchParams,
    apply_estimate_filters,
    pagination_meta,
    search_estimates,
)
from app.estimate_service import apply_pricing, serialize_estimate
from app.lifecycle import (
    LOCKED_STATUSES,
    approve_estimate,
    assert_can_issue_quotation,
    assert_transition,
    create_revision,
    resolve_status_after_pricing,
)
from app.models import Customer, Estimate, EstimateStatus, Site, Survey, User
from app.quotation import build_quotation, lock_quotation_snapshot, render_quotation_pdf
from app.schemas import (
    EstimateApproveRequest,
    EstimateCreate,
    EstimateListResponse,
    EstimateRead,
    EstimateTransitionRequest,
    EstimateUpdate,
    QuotationRead,
)
from app.seed import WORK_TYPE_LABELS

router = APIRouter(prefix="/estimates", tags=["estimates"])


def _search_params_from_query(
    q: str | None = Query(None, max_length=200),
    status: list[str] | None = Query(None),
    surveyor: str | None = Query(None, max_length=100),
    survey_from: str | None = Query(None, max_length=20),
    survey_to: str | None = Query(None, max_length=20),
    sell_min: float | None = Query(None, ge=0),
    sell_max: float | None = Query(None, ge=0),
    sort: str = Query("created_at_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
) -> EstimateSearchParams:
    return EstimateSearchParams(
        q=q,
        status=status,
        surveyor=surveyor,
        survey_date_from=survey_from,
        survey_date_to=survey_to,
        sell_min=sell_min,
        sell_max=sell_max,
        sort=sort,
        page=page,
        page_size=page_size,
    )


def _next_reference(db: Session) -> str:
    count = db.query(Estimate).count() + 1
    return f"AD-{count:05d}"


def _get_estimate_or_404(estimate_id: int, db: Session) -> Estimate:
    estimate = db.get(Estimate, estimate_id)
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return estimate


def _apply_hierarchy(
    db: Session,
    estimate: Estimate,
    *,
    customer_id: int | None,
    site_id: int | None,
    survey_id: int | None,
) -> None:
    """Resolve Customer → Site → Survey FKs when IDs are supplied."""
    resolved_customer_id = customer_id
    resolved_site_id = site_id
    resolved_survey_id = survey_id

    if survey_id is not None:
        survey = db.get(Survey, survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        site = db.get(Site, survey.site_id)
        if not site:
            raise HTTPException(status_code=404, detail="Site not found for survey")
        resolved_survey_id = survey.id
        resolved_site_id = site.id
        resolved_customer_id = site.customer_id
    elif site_id is not None:
        site = db.get(Site, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        resolved_site_id = site.id
        resolved_customer_id = site.customer_id
        resolved_survey_id = None
    elif customer_id is not None:
        customer = db.get(Customer, customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        resolved_customer_id = customer.id
        resolved_site_id = None
        resolved_survey_id = None

    if any(value is not None for value in (customer_id, site_id, survey_id)):
        estimate.customer_id = resolved_customer_id
        estimate.site_id = resolved_site_id
        estimate.survey_id = resolved_survey_id


@router.get("/work-types")
def list_work_types(
    _: User = Depends(get_current_user),
) -> list[dict]:
    return [
        {"code": code, "label": label}
        for code, label in WORK_TYPE_LABELS.items()
    ]


@router.get("/", response_model=EstimateListResponse)
def list_estimates(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    params: EstimateSearchParams = Depends(_search_params_from_query),
) -> EstimateListResponse:
    rows, total, normalized = search_estimates(db, params)
    meta = pagination_meta(total, normalized.page, normalized.page_size)
    return EstimateListResponse(
        items=[serialize_estimate(row) for row in rows],
        total=int(meta["total"]),
        page=int(meta["page"]),
        page_size=int(meta["page_size"]),
        total_pages=int(meta["total_pages"]),
        has_next=bool(meta["has_next"]),
        has_prev=bool(meta["has_prev"]),
    )


@router.get("/export/list.csv")
def download_estimates_list_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_from_header_or_query),
    params: EstimateSearchParams = Depends(_search_params_from_query),
):
    query = db.query(Estimate)
    query = apply_estimate_filters(query, params.normalized())
    rows = query.order_by(Estimate.created_at.desc()).all()
    data = render_estimates_list_csv(rows)
    return StreamingResponse(
        BytesIO(data),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="estimates-list.csv"'},
    )


@router.post("/", response_model=EstimateRead, status_code=201)
def create_estimate(
    payload: EstimateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("create_estimates")),
) -> EstimateRead:
    estimate = Estimate(
        reference=_next_reference(db),
        customer_name=payload.customer_name,
        company_name=payload.company_name,
        email=payload.email,
        telephone=payload.telephone,
        site_address=payload.site_address,
        postcode=payload.postcode,
        surveyor=payload.surveyor,
        survey_date=payload.survey_date,
        notes=payload.notes,
        status=EstimateStatus.DRAFT.value,
    )
    _apply_hierarchy(
        db,
        estimate,
        customer_id=payload.customer_id,
        site_id=payload.site_id,
        survey_id=payload.survey_id,
    )
    db.add(estimate)
    db.commit()
    db.refresh(estimate)
    write_audit(
        db,
        action="estimate_created",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "customer_id": estimate.customer_id,
            "site_id": estimate.site_id,
            "survey_id": estimate.survey_id,
        },
        actor=user,
    )
    return serialize_estimate(estimate)


@router.get("/{estimate_id}", response_model=EstimateRead)
def get_estimate(
    estimate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> EstimateRead:
    return serialize_estimate(_get_estimate_or_404(estimate_id, db))


@router.put("/{estimate_id}", response_model=EstimateRead)
def update_estimate(
    estimate_id: int,
    payload: EstimateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("create_estimates")),
) -> EstimateRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    if estimate.status in LOCKED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Estimate is '{estimate.status}' and locked. "
                "Create a revision to continue editing."
            ),
        )

    estimate.customer_name = payload.customer_name
    estimate.company_name = payload.company_name
    estimate.email = payload.email
    estimate.telephone = payload.telephone
    estimate.site_address = payload.site_address
    estimate.postcode = payload.postcode
    estimate.surveyor = payload.surveyor
    estimate.survey_date = payload.survey_date
    estimate.notes = payload.notes

    requested_status = payload.status
    if requested_status == EstimateStatus.READY_TO_QUOTE.value:
        # Defer gate check until after pricing refresh
        pass
    elif requested_status and requested_status != estimate.status:
        assert_transition(estimate.status, requested_status)

    _apply_hierarchy(
        db,
        estimate,
        customer_id=payload.customer_id,
        site_id=payload.site_id,
        survey_id=payload.survey_id,
    )

    if payload.clear_override:
        estimate.override_reason = ""
    elif payload.override_sell_price is not None:
        allowed = ROLE_PERMISSIONS.get(user.role, set())
        if "override_price" not in allowed and user.role != "admin":
            raise HTTPException(status_code=403, detail="Permission denied for price override")
        estimate.override_reason = payload.override_reason or estimate.override_reason

    apply_pricing(
        db,
        estimate,
        work_items=[item.model_dump() for item in payload.items],
        travel_band_code=payload.travel_band_code,
        waste_code=payload.waste_code,
        prelim_codes=payload.prelim_codes,
        override_sell_price=payload.override_sell_price,
        clear_override=payload.clear_override,
    )

    # Auto commercial status after pricing unless a safe explicit target was requested
    if requested_status == EstimateStatus.READY_TO_QUOTE.value:
        auto = resolve_status_after_pricing(estimate)
        if auto == EstimateStatus.REVIEW_REQUIRED.value:
            estimate.status = auto
        else:
            # Approved estimates stay approved; priced can move to ready_to_quote
            if estimate.status == EstimateStatus.APPROVED.value:
                assert_transition(estimate.status, EstimateStatus.READY_TO_QUOTE.value)
                estimate.status = EstimateStatus.READY_TO_QUOTE.value
            elif auto == EstimateStatus.PRICED.value:
                estimate.status = EstimateStatus.PRICED.value
                assert_can_issue_quotation(estimate, db)
                assert_transition(estimate.status, EstimateStatus.READY_TO_QUOTE.value)
                estimate.status = EstimateStatus.READY_TO_QUOTE.value
            else:
                estimate.status = auto
        db.commit()
        db.refresh(estimate)
        assert_can_issue_quotation(estimate, db)
    elif requested_status and requested_status not in {
        EstimateStatus.PRICED.value,
        EstimateStatus.REVIEW_REQUIRED.value,
    }:
        estimate.status = requested_status
        db.commit()
        db.refresh(estimate)
    else:
        estimate.status = resolve_status_after_pricing(estimate)
        db.commit()
        db.refresh(estimate)

    write_audit(
        db,
        action="estimate_updated",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "status": estimate.status,
            "sell_price": estimate.sell_price,
            "override_sell_price": estimate.override_sell_price,
            "override_reason": estimate.override_reason or "",
            "customer_id": estimate.customer_id,
            "site_id": estimate.site_id,
            "survey_id": estimate.survey_id,
        },
        actor=user,
    )
    return serialize_estimate(estimate)


@router.post("/{estimate_id}/transition", response_model=EstimateRead)
def transition_estimate(
    estimate_id: int,
    payload: EstimateTransitionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("create_estimates")),
) -> EstimateRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    assert_transition(estimate.status, payload.status)
    if payload.status == EstimateStatus.READY_TO_QUOTE.value:
        assert_can_issue_quotation(estimate, db)
    if payload.status == EstimateStatus.QUOTED.value:
        assert_can_issue_quotation(estimate, db)
        lock_quotation_snapshot(db, estimate)
    estimate.status = payload.status
    if payload.notes:
        estimate.notes = f"{estimate.notes}\n{payload.notes}".strip()
    db.commit()
    db.refresh(estimate)
    write_audit(
        db,
        action="estimate_transition",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={"reference": estimate.reference, "status": estimate.status},
        actor=user,
    )
    return serialize_estimate(estimate)


@router.post("/{estimate_id}/approve", response_model=EstimateRead)
def approve_estimate_endpoint(
    estimate_id: int,
    payload: EstimateApproveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("approve_override")),
) -> EstimateRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    approve_estimate(estimate, actor=user, notes=payload.notes)
    db.commit()
    db.refresh(estimate)
    write_audit(
        db,
        action="estimate_approved",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={
            "reference": estimate.reference,
            "status": estimate.status,
            "notes": payload.notes,
            "margin_percent": estimate.margin_percent,
            "override_sell_price": estimate.override_sell_price,
        },
        actor=user,
    )
    return serialize_estimate(estimate)


@router.post("/{estimate_id}/revisions", response_model=EstimateRead, status_code=201)
def revise_estimate(
    estimate_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("create_estimates")),
) -> EstimateRead:
    source = _get_estimate_or_404(estimate_id, db)
    clone = create_revision(db, source, actor=user)
    write_audit(
        db,
        action="estimate_revision_created",
        entity_type="estimate",
        entity_id=clone.id,
        detail={
            "reference": clone.reference,
            "parent_estimate_id": source.id,
            "parent_reference": source.reference,
            "revision_no": clone.revision_no,
        },
        actor=user,
    )
    return serialize_estimate(clone)


@router.post("/{estimate_id}/recalculate", response_model=EstimateRead)
def recalculate_estimate(
    estimate_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("create_estimates")),
) -> EstimateRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    apply_pricing(db, estimate)
    write_audit(
        db,
        action="estimate_recalculated",
        entity_type="estimate",
        entity_id=estimate.id,
        detail={"reference": estimate.reference, "sell_price": estimate.sell_price},
        actor=user,
    )
    return serialize_estimate(estimate)


@router.get("/{estimate_id}/quotation", response_model=QuotationRead)
def get_quotation(
    estimate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> QuotationRead:
    estimate = _get_estimate_or_404(estimate_id, db)
    return build_quotation(db, estimate)


@router.get("/{estimate_id}/quotation.pdf")
def download_quotation_pdf(
    estimate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_from_header_or_query),
):
    estimate = _get_estimate_or_404(estimate_id, db)
    quote = build_quotation(db, estimate)
    buffer, filename = render_quotation_pdf(quote)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{estimate_id}/export.csv")
def download_estimate_csv(
    estimate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_from_header_or_query),
):
    estimate = _get_estimate_or_404(estimate_id, db)
    data, filename = render_estimate_csv(db, estimate)
    return StreamingResponse(
        BytesIO(data),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{estimate_id}/export.xlsx")
def download_estimate_xlsx(
    estimate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user_from_header_or_query),
):
    estimate = _get_estimate_or_404(estimate_id, db)
    data, filename = render_estimate_xlsx(db, estimate)
    return StreamingResponse(
        BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
