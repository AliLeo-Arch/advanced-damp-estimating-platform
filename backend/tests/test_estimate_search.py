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
            reference="EST-00001",
            customer_name="Ms Emma Thompson",
            site_address="24 Cedar Road",
            postcode="RG1 4AB",
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
            reference="EST-00002",
            customer_name="Mr Oliver Grant",
            site_address="15 Queens Road",
            postcode="RG1 4AY",
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
            reference="EST-DEMO-04",
            customer_name="Cedar Property Management Ltd",
            site_address="8 Market Place",
            postcode="RG1 2DE",
            surveyor="Sarah Okonkwo",
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
        db, EstimateSearchParams(q="Cedar Property", page=1, page_size=10)
    )
    assert total == 1
    assert rows[0].reference == "EST-DEMO-04"


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
    assert rows[0].reference == "EST-00001"
    assert rows[1].reference == "EST-00002"


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
