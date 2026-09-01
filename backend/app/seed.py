"""Load sample commercial rates into SQLite for the POC."""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import PricingSettings, RateItem

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_seed.json"

WORK_TYPE_LABELS = {
    "dpc_replastering": "Chemical DPC Injection & Replastering",
    "cavity_drain": "Cavity Drain Membrane Systems",
    "sump_pump": "Sump & Pump Installations",
    "timber_treatment": "Timber Treatment",
    "ventilation": "Condensation & Ventilation",
}


def _load_seed() -> dict:
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def seed_rates_if_empty(db: Session) -> None:
    if db.query(RateItem).count() > 0:
        return

    data = _load_seed()
    rows: list[RateItem] = []

    for item in data.get("materials", []):
        rows.append(
            RateItem(
                code=item["code"],
                name=item["name"],
                category="materials",
                unit=item.get("unit", "each"),
                cost_per_unit=float(item.get("cost_per_unit", 0)),
                waste_percent=float(item.get("waste_percent", 0)),
                notes=item.get("consumption_note") or item.get("notes") or "",
                meta_json=json.dumps(
                    {
                        "work_category": item.get("category"),
                        "supplier_ref": item.get("supplier_ref"),
                    }
                ),
                active=1 if item.get("active", True) else 0,
            )
        )

    for item in data.get("labour_rates", []):
        rows.append(
            RateItem(
                code=item["code"],
                name=item["name"],
                category="labour",
                unit=item.get("unit", "each"),
                cost_per_unit=float(item.get("cost_per_unit", 0)),
                notes=item.get("notes") or "",
                meta_json="{}",
                active=1,
            )
        )

    for item in data.get("waste_and_skips", []):
        rows.append(
            RateItem(
                code=item["code"],
                name=item["name"],
                category="waste_skip",
                unit=item.get("unit", "job"),
                cost_per_unit=float(item.get("cost_per_unit", 0)),
                notes=item.get("notes") or "",
                meta_json="{}",
                active=1,
            )
        )

    for item in data.get("travel_bands", []):
        rows.append(
            RateItem(
                code=item["code"],
                name=item["label"],
                category="travel",
                unit="band",
                cost_per_unit=float(item.get("charge", 0)),
                notes=item.get("notes") or "",
                meta_json=json.dumps(
                    {
                        "distance_min_miles": item.get("distance_min_miles"),
                        "distance_max_miles": item.get("distance_max_miles"),
                    }
                ),
                active=1,
            )
        )

    for item in data.get("preliminaries", []):
        rows.append(
            RateItem(
                code=item["code"],
                name=item["name"],
                category="preliminaries",
                unit=item.get("unit", "job"),
                cost_per_unit=float(item.get("cost_per_unit", 0)),
                notes=item.get("notes") or "",
                meta_json="{}",
                active=1,
            )
        )

    for item in data.get("sump_packages", []):
        rows.append(
            RateItem(
                code=item["code"],
                name=item["name"],
                category="sump_package",
                unit="package",
                cost_per_unit=float(item.get("material_package_cost", 0)),
                notes="; ".join(item.get("includes") or []),
                meta_json=json.dumps(
                    {
                        "labour_code": item.get("labour_code"),
                        "labour_extra_cost": item.get("labour_extra_cost", 0),
                        "includes": item.get("includes") or [],
                    }
                ),
                active=1 if item.get("active", True) else 0,
            )
        )

    db.add_all(rows)

    rules = data.get("pricing_rules", {})
    margins = {
        m["work_type"]: float(m["target_margin_percent"])
        for m in rules.get("margins_by_work_type", [])
    }
    db.add(
        PricingSettings(
            minimum_job_value=float(rules.get("minimum_job_value", 750)),
            vat_rate=float(data.get("meta", {}).get("vat_rate", 0.20)),
            quote_validity_days=int(rules.get("quote_validity_days", 30)),
            payment_terms=rules.get("default_payment_terms") or "",
            margins_json=json.dumps(margins),
            min_permitted_margin_percent=20.0,
            survey_fee_default=195.0,
        )
    )
    db.commit()
