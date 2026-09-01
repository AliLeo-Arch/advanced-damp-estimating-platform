"""Rate CSV import tests."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.rate_import import import_rates_from_csv, normalize_row, read_csv_rows


def test_normalize_row_parses_gbp():
    row = normalize_row(
        {
            "code": "MAT-01",
            "name": "Test material",
            "category": "materials",
            "cost_per_unit": "£12.50",
            "waste_percent": "5",
            "active": "yes",
        }
    )
    assert row["cost_per_unit"] == 12.5
    assert row["active"] is True


def test_normalize_row_requires_fields():
    with pytest.raises(ValueError):
        normalize_row({"code": "", "name": "X", "category": "materials", "cost_per_unit": "1"})


def test_import_upsert(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.database import Base
    from app.models import RateItem

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    db.add(
        RateItem(
            code="MAT-OLD",
            name="Old name",
            category="materials",
            unit="each",
            cost_per_unit=10.0,
            active=1,
        )
    )
    db.commit()

    csv_path = tmp_path / "rates.csv"
    csv_path.write_text(
        "code,name,category,unit,cost_per_unit,waste_percent,notes,active\n"
        "MAT-OLD,Updated name,materials,each,11.50,0,,true\n"
        "MAT-NEW,New line,materials,each,9.00,0,,true\n",
        encoding="utf-8",
    )

    result = import_rates_from_csv(db, csv_path)
    assert result.ok
    assert result.created == 1
    assert result.updated == 1

    old = db.query(RateItem).filter(RateItem.code == "MAT-OLD").one()
    assert old.name == "Updated name"
    assert old.cost_per_unit == 11.5


def test_template_csv_readable():
    path = Path(__file__).resolve().parent.parent / "data" / "rates_import_template.csv"
    rows = read_csv_rows(path)
    assert len(rows) >= 1


def test_export_round_trip(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.database import Base
    from app.models import RateItem
    from app.rate_import import export_rates_to_csv

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    db.add(
        RateItem(
            code="LAB-01",
            name="Labour line",
            category="labour",
            unit="day",
            cost_per_unit=280.0,
            waste_percent=0,
            notes="Test",
            active=1,
        )
    )
    db.commit()

    out = tmp_path / "export.csv"
    count = export_rates_to_csv(db, out)
    assert count == 1
    rows = read_csv_rows(out)
    assert rows[0]["code"] == "LAB-01"
    assert float(rows[0]["cost_per_unit"]) == 280.0

