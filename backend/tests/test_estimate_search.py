"""Estimate search and pagination tests."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app import models  # noqa: F401
from app.database import Base
from app.estimate_query import EstimateSearchParams, search_estimates
from app.models import Estimate, EstimateStatus


def _session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _seed_rows(db: Session) -> None:
    rows = [
        Estimate(
            reference="AD-00001",
            customer_name="Mrs Helen Carter",
            site_address="12 Oak Road",
            postcode="BR1 3AA",
            surveyor="James Whitaker",
            survey_date="2026-08-01",
            status=EstimateStatus.READY_TO_QUOTE.value,
            notes="",
            total_cost=1200,
            sell_price=2152.67,
            margin_value=952.67,
            margin_percent=44.0,
        ),
        Estimate(
            reference="AD-00002",
            customer_name="Mr David Patel",
            site_address="5 Station Parade",
            postcode="CR0 2QQ",
            surveyor="James Whitaker",
            survey_date="2026-07-15",
            status=EstimateStatus.PRICED.value,
            notes="",
            total_cost=500,
            sell_price=750.0,
            margin_value=250.0,
            margin_percent=33.3,
        ),
        Estimate(
            reference="AD-DEMO-04",
            customer_name="Greenfield Lettings Ltd",
            site_address="42A Kingsland Road",
            postcode="E8 4AA",
            surveyor="Sarah Cole",
            survey_date="2026-06-20",
            status=EstimateStatus.ACCEPTED.value,
            notes="",
            total_cost=1100,
            sell_price=1607.64,
            margin_value=507.64,
            margin_percent=31.6,
        ),
    ]
    db.add_all(rows)
    db.commit()


def test_search_by_customer_and_postcode():
    db = _session()
    _seed_rows(db)
    rows, total, _ = search_estimates(
        db, EstimateSearchParams(q="Greenfield", page=1, page_size=10)
    )
    assert total == 1
    assert rows[0].reference == "AD-DEMO-04"


def test_filter_status_and_sell_range():
    db = _session()
    _seed_rows(db)
    rows, total, _ = search_estimates(
        db,
        EstimateSearchParams(
            status=[EstimateStatus.PRICED.value, EstimateStatus.READY_TO_QUOTE.value],
            sell_min=700,
            sell_max=2200,
            sort="sell_price_desc",
        ),
    )
    assert total == 2
    assert rows[0].reference == "AD-00001"
    assert rows[1].reference == "AD-00002"


def test_pagination_pages():
    db = _session()
    _seed_rows(db)
    page1, total, params = search_estimates(
        db, EstimateSearchParams(page=1, page_size=2, sort="reference_asc")
    )
    page2, _, _ = search_estimates(db, EstimateSearchParams(page=2, page_size=2, sort="reference_asc"))
    assert total == 3
    assert len(page1) == 2
    assert len(page2) == 1
    assert params.page_size == 2
