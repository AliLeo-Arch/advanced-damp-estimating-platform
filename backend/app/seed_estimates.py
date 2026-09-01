"""Seed demo estimates for local testing."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.benchmark_jobs import scenario_to_work_items
from app.estimate_service import apply_pricing
from app.lifecycle import resolve_status_after_pricing
from app.models import Estimate, EstimateStatus, User
from app.seed import _load_seed

DEMO_SEEDS = (
    ("DEMO-01", "AD-DEMO-01", EstimateStatus.READY_TO_QUOTE.value),
    ("DEMO-05", "AD-DEMO-05", EstimateStatus.PRICED.value),
    ("DEMO-04", "AD-DEMO-04", EstimateStatus.PRICED.value),
)


def seed_estimates_if_empty(db: Session) -> None:
    data = _load_seed()
    scenarios = {
        row["id"]: row for row in data.get("demo_scenarios") or [] if row.get("id")
    }
    surveyor = (
        db.query(User).filter(User.email == "james.whitaker@advanceddamp.co.uk").first()
    )

    created = False
    for demo_id, reference, preferred_status in DEMO_SEEDS:
        if db.query(Estimate).filter(Estimate.reference == reference).first():
            continue
        scenario = scenarios.get(demo_id)
        if not scenario:
            continue

        estimate = Estimate(
            reference=reference,
            customer_name=scenario.get("customer_name") or "Demo Customer",
            site_address=scenario.get("site_address") or "",
            postcode=scenario.get("postcode") or "",
            surveyor=scenario.get("surveyor") or "James Whitaker",
            survey_date=scenario.get("survey_date") or "",
            notes=scenario.get("title") or "",
            travel_band_code=scenario.get("travel_band") or "TRV-LOCAL",
            waste_code=scenario.get("waste") or "WS-ALLOW-SMALL",
            prelim_codes_json=json.dumps(scenario.get("preliminaries") or ["PRE-STD"]),
            status=EstimateStatus.DRAFT.value,
            created_by_user_id=surveyor.id if surveyor else None,
        )
        db.add(estimate)
        db.flush()

        apply_pricing(
            db,
            estimate,
            work_items=scenario_to_work_items(scenario["work_items"]),
            travel_band_code=estimate.travel_band_code,
            waste_code=estimate.waste_code,
            prelim_codes=scenario.get("preliminaries") or ["PRE-STD"],
        )
        resolved = resolve_status_after_pricing(estimate)
        if resolved == EstimateStatus.PRICED.value:
            estimate.status = preferred_status
        else:
            estimate.status = resolved
        created = True

    if created:
        db.commit()
