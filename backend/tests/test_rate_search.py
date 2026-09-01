"""Rate search and pagination tests."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app import models  # noqa: F401
from app.database import Base
from app.rate_query import RateSearchParams, search_rates
from app.models import RateItem


def _session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _seed_rows(db: Session) -> None:
    rows = [
        RateItem(
            code="MAT-DPC-CREAM",
            name="DPC injection cream",
            category="materials",
            unit="tube",
            cost_per_unit=18.5,
            waste_percent=5,
            notes="",
            active=1,
        ),
        RateItem(
            code="LAB-REPLASTER",
            name="Replaster labour",
            category="labour",
            unit="m2",
            cost_per_unit=42.0,
            waste_percent=0,
            notes="",
            active=1,
        ),
        RateItem(
            code="TRV-LOCAL",
            name="Local travel",
            category="travel",
            unit="visit",
            cost_per_unit=45.0,
            waste_percent=0,
            notes="Legacy",
            active=0,
        ),
    ]
    db.add_all(rows)
    db.commit()


def test_search_by_code_or_name():
    db = _session()
    _seed_rows(db)
    rows, total, _ = search_rates(db, RateSearchParams(q="replaster"))
    assert total == 1
    assert rows[0].code == "LAB-REPLASTER"


def test_filter_category_and_include_inactive():
    db = _session()
    _seed_rows(db)
    active_only, total_active, _ = search_rates(
        db, RateSearchParams(category="travel", include_inactive=False)
    )
    with_inactive, total_all, _ = search_rates(
        db, RateSearchParams(category="travel", include_inactive=True)
    )
    assert total_active == 0
    assert total_all == 1
    assert with_inactive[0].code == "TRV-LOCAL"


def test_pagination():
    db = _session()
    _seed_rows(db)
    page1, total, _ = search_rates(db, RateSearchParams(page=1, page_size=2))
    page2, _, _ = search_rates(db, RateSearchParams(page=2, page_size=2))
    assert total == 2
    assert len(page1) == 2
    assert len(page2) == 0
