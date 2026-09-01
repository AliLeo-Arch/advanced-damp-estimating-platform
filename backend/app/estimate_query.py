"""Estimate list search, filter, sort, and pagination."""

from __future__ import annotations

import math
from dataclasses import dataclass

from sqlalchemy import or_
from sqlalchemy.orm import Query, Session

from app.models import Estimate

SORT_OPTIONS: dict[str, object] = {
    "created_at_desc": Estimate.created_at.desc(),
    "created_at_asc": Estimate.created_at.asc(),
    "sell_price_desc": Estimate.sell_price.desc(),
    "sell_price_asc": Estimate.sell_price.asc(),
    "reference_asc": Estimate.reference.asc(),
    "reference_desc": Estimate.reference.desc(),
    "customer_asc": Estimate.customer_name.asc(),
    "customer_desc": Estimate.customer_name.desc(),
}

DEFAULT_SORT = "created_at_desc"
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 50


@dataclass
class EstimateSearchParams:
    q: str | None = None
    status: list[str] | None = None
    surveyor: str | None = None
    survey_date_from: str | None = None
    survey_date_to: str | None = None
    sell_min: float | None = None
    sell_max: float | None = None
    sort: str = DEFAULT_SORT
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE

    def normalized(self) -> EstimateSearchParams:
        page_size = min(max(int(self.page_size), 1), MAX_PAGE_SIZE)
        page = max(int(self.page), 1)
        sort = self.sort if self.sort in SORT_OPTIONS else DEFAULT_SORT
        q = self.q.strip() if self.q and self.q.strip() else None
        surveyor = self.surveyor.strip() if self.surveyor and self.surveyor.strip() else None
        status = normalize_status_list(self.status)
        return EstimateSearchParams(
            q=q,
            status=status,
            surveyor=surveyor,
            survey_date_from=self.survey_date_from or None,
            survey_date_to=self.survey_date_to or None,
            sell_min=self.sell_min,
            sell_max=self.sell_max,
            sort=sort,
            page=page,
            page_size=page_size,
        )


def normalize_status_list(raw: list[str] | None) -> list[str] | None:
    if not raw:
        return None
    values: list[str] = []
    for entry in raw:
        for part in entry.split(","):
            token = part.strip().lower()
            if token:
                values.append(token)
    return values or None


def apply_estimate_filters(query: Query, params: EstimateSearchParams) -> Query:
    if params.q:
        term = f"%{params.q}%"
        query = query.filter(
            or_(
                Estimate.reference.ilike(term),
                Estimate.customer_name.ilike(term),
                Estimate.company_name.ilike(term),
                Estimate.site_address.ilike(term),
                Estimate.postcode.ilike(term),
                Estimate.surveyor.ilike(term),
                Estimate.notes.ilike(term),
            )
        )

    if params.status:
        query = query.filter(Estimate.status.in_(params.status))

    if params.surveyor:
        query = query.filter(Estimate.surveyor.ilike(f"%{params.surveyor}%"))

    if params.survey_date_from:
        query = query.filter(Estimate.survey_date >= params.survey_date_from)

    if params.survey_date_to:
        query = query.filter(Estimate.survey_date <= params.survey_date_to)

    if params.sell_min is not None:
        query = query.filter(Estimate.sell_price >= params.sell_min)

    if params.sell_max is not None:
        query = query.filter(Estimate.sell_price <= params.sell_max)

    return query


def search_estimates(
    db: Session, params: EstimateSearchParams
) -> tuple[list[Estimate], int, EstimateSearchParams]:
    normalized = params.normalized()
    query = db.query(Estimate)
    query = apply_estimate_filters(query, normalized)
    total = query.count()
    order = SORT_OPTIONS[normalized.sort]
    rows = (
        query.order_by(order)
        .offset((normalized.page - 1) * normalized.page_size)
        .limit(normalized.page_size)
        .all()
    )
    return rows, total, normalized


def pagination_meta(total: int, page: int, page_size: int) -> dict[str, int | bool]:
    total_pages = max(1, math.ceil(total / page_size)) if total else 1
    safe_page = min(max(page, 1), total_pages)
    return {
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": safe_page < total_pages,
        "has_prev": safe_page > 1,
    }
