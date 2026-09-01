"""Rate list search, filter, sort, and pagination."""

from __future__ import annotations

import math
from dataclasses import dataclass

from sqlalchemy import or_
from sqlalchemy.orm import Query, Session

from app.models import RateItem

SORT_OPTIONS: dict[str, object] = {
    "code_asc": RateItem.code.asc(),
    "code_desc": RateItem.code.desc(),
    "name_asc": RateItem.name.asc(),
    "name_desc": RateItem.name.desc(),
    "category_asc": RateItem.category.asc(),
    "category_desc": RateItem.category.desc(),
    "cost_asc": RateItem.cost_per_unit.asc(),
    "cost_desc": RateItem.cost_per_unit.desc(),
}

DEFAULT_SORT = "category_asc"
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 200


@dataclass
class RateSearchParams:
    q: str | None = None
    category: str | None = None
    include_inactive: bool = False
    sort: str = DEFAULT_SORT
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE

    def normalized(self) -> RateSearchParams:
        page_size = min(max(int(self.page_size), 1), MAX_PAGE_SIZE)
        page = max(int(self.page), 1)
        sort = self.sort if self.sort in SORT_OPTIONS else DEFAULT_SORT
        q = self.q.strip() if self.q and self.q.strip() else None
        category = self.category.strip() if self.category and self.category.strip() else None
        return RateSearchParams(
            q=q,
            category=category,
            include_inactive=self.include_inactive,
            sort=sort,
            page=page,
            page_size=page_size,
        )


def apply_rate_filters(query: Query, params: RateSearchParams) -> Query:
    if not params.include_inactive:
        query = query.filter(RateItem.active == 1)

    if params.category:
        query = query.filter(RateItem.category == params.category)

    if params.q:
        term = f"%{params.q}%"
        query = query.filter(
            or_(
                RateItem.code.ilike(term),
                RateItem.name.ilike(term),
                RateItem.category.ilike(term),
                RateItem.unit.ilike(term),
                RateItem.notes.ilike(term),
            )
        )

    return query


def search_rates(
    db: Session, params: RateSearchParams
) -> tuple[list[RateItem], int, RateSearchParams]:
    normalized = params.normalized()
    query = db.query(RateItem)
    query = apply_rate_filters(query, normalized)
    total = query.count()
    order = SORT_OPTIONS[normalized.sort]
    rows = (
        query.order_by(order, RateItem.code.asc())
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
