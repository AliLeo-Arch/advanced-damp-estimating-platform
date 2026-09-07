"""Rate version history recording tests."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app import models  # noqa: F401
from app.database import Base
from app.models import RateItem, RateVersion, User
from app.rate_versions import record_rate_version


def _session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_record_rate_version_on_cost_change():
    db = _session()
    user = User(
        email="admin@example.com",
        full_name="Demo Admin",
        password_hash="x",
        role="admin",
        active=1,
    )
    db.add(user)
    db.flush()
    rate = RateItem(
        code="MAT-INJ-CREAM",
        name="Injection cream",
        category="materials",
        unit="litre",
        cost_per_unit=28.5,
        waste_percent=8,
        notes="",
        active=1,
        effective_date="2026-01-01",
    )
    db.add(rate)
    db.flush()

    record_rate_version(
        db,
        rate,
        previous_cost=28.5,
        new_cost=31.0,
        reason="Supplier increase",
        effective_date="2026-04-01",
        actor=user,
    )
    rate.cost_per_unit = 31.0
    rate.effective_date = "2026-04-01"
    db.commit()

    rows = (
        db.query(RateVersion)
        .filter(RateVersion.rate_item_id == rate.id)
        .order_by(RateVersion.id.asc())
        .all()
    )
    assert len(rows) == 1
    assert rows[0].previous_cost == 28.5
    assert rows[0].new_cost == 31.0
    assert rows[0].reason == "Supplier increase"
    assert rows[0].effective_date == "2026-04-01"
    assert rows[0].changed_by_name == "Demo Admin"
