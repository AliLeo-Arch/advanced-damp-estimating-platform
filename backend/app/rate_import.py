"""Import rate lines from CSV (upsert by code)."""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import RateItem

REQUIRED_COLUMNS = ("code", "name", "category", "cost_per_unit")
OPTIONAL_COLUMNS = ("unit", "waste_percent", "notes", "active")
EXPORT_COLUMNS = (
    "code",
    "name",
    "category",
    "unit",
    "cost_per_unit",
    "waste_percent",
    "notes",
    "active",
)


@dataclass
class ImportResult:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def _parse_bool(value: str | None, default: bool = True) -> bool:
    if value is None or str(value).strip() == "":
        return default
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "active"}:
        return True
    if normalized in {"0", "false", "no", "n", "inactive"}:
        return False
    raise ValueError(f"Invalid active flag: {value!r}")


def normalize_row(row: dict[str, str]) -> dict:
    code = (row.get("code") or "").strip()
    name = (row.get("name") or "").strip()
    category = (row.get("category") or "").strip()
    if not code or not name or not category:
        raise ValueError("code, name, and category are required")

    cost_raw = (row.get("cost_per_unit") or "").strip()
    if cost_raw == "":
        raise ValueError(f"{code}: cost_per_unit is required")
    cost = float(cost_raw.replace("£", "").replace(",", ""))
    if cost < 0:
        raise ValueError(f"{code}: cost_per_unit must be >= 0")

    waste_raw = (row.get("waste_percent") or "0").strip()
    waste = float(waste_raw) if waste_raw else 0.0
    if waste < 0 or waste > 100:
        raise ValueError(f"{code}: waste_percent must be 0–100")

    return {
        "code": code,
        "name": name,
        "category": category,
        "unit": (row.get("unit") or "each").strip() or "each",
        "cost_per_unit": cost,
        "waste_percent": waste,
        "notes": (row.get("notes") or "").strip(),
        "active": _parse_bool(row.get("active"), default=True),
    }


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("CSV has no header row")
        missing = [col for col in REQUIRED_COLUMNS if col not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSV missing columns: {', '.join(missing)}")
        return [dict(row) for row in reader]


def import_rates_from_csv(
    db: Session,
    path: Path,
    *,
    dry_run: bool = False,
) -> ImportResult:
    result = ImportResult()
    try:
        raw_rows = read_csv_rows(path)
    except Exception as exc:
        result.errors.append(str(exc))
        return result

    for index, raw in enumerate(raw_rows, start=2):
        if not any(str(v or "").strip() for v in raw.values()):
            result.skipped += 1
            continue
        try:
            data = normalize_row(raw)
        except ValueError as exc:
            result.errors.append(f"Row {index}: {exc}")
            continue

        existing = db.query(RateItem).filter(RateItem.code == data["code"]).one_or_none()
        if existing:
            existing.name = data["name"]
            existing.category = data["category"]
            existing.unit = data["unit"]
            existing.cost_per_unit = data["cost_per_unit"]
            existing.waste_percent = data["waste_percent"]
            existing.notes = data["notes"]
            existing.active = 1 if data["active"] else 0
            result.updated += 1
        else:
            db.add(
                RateItem(
                    code=data["code"],
                    name=data["name"],
                    category=data["category"],
                    unit=data["unit"],
                    cost_per_unit=data["cost_per_unit"],
                    waste_percent=data["waste_percent"],
                    notes=data["notes"],
                    active=1 if data["active"] else 0,
                    meta_json="{}",
                )
            )
            result.created += 1

    if result.errors:
        db.rollback()
        return result

    if dry_run:
        db.rollback()
    else:
        db.commit()

    return result


def export_rates_to_csv(
    db: Session,
    path: Path,
    *,
    include_inactive: bool = False,
) -> int:
    """Write current rates to CSV. Returns number of rows exported."""
    query = db.query(RateItem).order_by(RateItem.category, RateItem.code)
    if not include_inactive:
        query = query.filter(RateItem.active == 1)

    rows = query.all()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for rate in rows:
            waste = rate.waste_percent or 0.0
            waste_text = str(int(waste)) if waste == int(waste) else f"{waste:.2f}"
            writer.writerow(
                {
                    "code": rate.code,
                    "name": rate.name,
                    "category": rate.category,
                    "unit": rate.unit or "each",
                    "cost_per_unit": f"{rate.cost_per_unit:.2f}",
                    "waste_percent": waste_text,
                    "notes": rate.notes or "",
                    "active": "true" if rate.active else "false",
                }
            )
    return len(rows)
