"""Benchmark and historical job validation against the pricing engine."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.pricing_engine import calculate_estimate, round_money
from app.seed import _load_seed

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
BENCHMARK_PATH = DATA_DIR / "benchmark_jobs.json"


def seed_rates_for_engine() -> list[dict[str, Any]]:
    """Build rate list in pricing-engine shape from sample_seed.json."""
    data = _load_seed()
    rates: list[dict[str, Any]] = []

    for item in data.get("materials", []):
        rates.append(
            {
                **item,
                "active": item.get("active", True),
                "waste_percent": float(item.get("waste_percent") or 0),
            }
        )

    for item in data.get("labour_rates", []):
        rates.append(
            {
                **item,
                "category": "labour",
                "active": True,
                "waste_percent": 0.0,
            }
        )

    for item in data.get("waste_and_skips", []):
        rates.append(
            {
                **item,
                "category": "waste_skip",
                "active": True,
                "waste_percent": 0.0,
            }
        )

    for item in data.get("travel_bands", []):
        rates.append(
            {
                "code": item["code"],
                "name": item["label"],
                "category": "travel",
                "unit": "band",
                "cost_per_unit": float(item["charge"]),
                "active": True,
                "waste_percent": 0.0,
            }
        )

    for item in data.get("preliminaries", []):
        rates.append(
            {
                **item,
                "category": "preliminaries",
                "active": True,
                "waste_percent": 0.0,
            }
        )

    for item in data.get("sump_packages", []):
        rates.append(
            {
                "code": item["code"],
                "name": item["name"],
                "category": "sump_package",
                "unit": "package",
                "cost_per_unit": float(item["material_package_cost"]),
                "active": item.get("active", True),
                "waste_percent": 0.0,
                "meta": {
                    "labour_code": item.get("labour_code"),
                    "labour_extra_cost": item.get("labour_extra_cost", 0),
                    "includes": item.get("includes") or [],
                },
            }
        )

    return rates


def seed_pricing_rules() -> tuple[dict[str, float], float]:
    data = _load_seed()
    rules = data.get("pricing_rules", {})
    margins = {
        m["work_type"]: float(m["target_margin_percent"])
        for m in rules.get("margins_by_work_type", [])
    }
    minimum_job = float(rules.get("minimum_job_value", 750.0))
    return margins, minimum_job


def scenario_to_work_items(raw_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for row in raw_items:
        work_type = row["work_type"]
        measurements = {k: v for k, v in row.items() if k != "work_type"}
        items.append({"work_type": work_type, "measurements": measurements})
    return items


def price_scenario(scenario: dict[str, Any]) -> Any:
    margins, minimum_job = seed_pricing_rules()
    return calculate_estimate(
        work_items=scenario_to_work_items(scenario["work_items"]),
        rates=seed_rates_for_engine(),
        margins_by_type=margins,
        travel_band_code=scenario["travel_band"],
        waste_code=scenario["waste"],
        prelim_codes=scenario.get("preliminaries") or [],
        minimum_job_value=minimum_job,
        override_sell_price=scenario.get("override_sell_price"),
    )


@dataclass
class BenchmarkCheck:
    scenario_id: str
    title: str
    passed: bool
    messages: list[str]
    sell_price: float
    total_cost: float
    margin_percent: float


def _within(value: float, expected: float, tolerance: float) -> bool:
    return abs(value - expected) <= tolerance


def validate_scenario(
    scenario: dict[str, Any],
    *,
    tolerance_gbp: float = 1.0,
) -> BenchmarkCheck:
    result = price_scenario(scenario)
    messages: list[str] = []
    scenario_id = scenario.get("id") or scenario.get("reference") or "unknown"
    title = scenario.get("title") or scenario.get("name") or scenario_id

    line_sum = round_money(sum(line.line_sell for line in result.lines))
    if line_sum != result.sell_price:
        messages.append(f"Line sells {line_sum} != job sell {result.sell_price}")

    if not result.breakdown.get("reconciliation", {}).get("balanced", False):
        messages.append("Reconciliation flag not balanced")

    expected = scenario.get("expect") or {}
    if "sell_price" in expected:
        if not _within(result.sell_price, float(expected["sell_price"]), tolerance_gbp):
            messages.append(
                f"Sell £{result.sell_price:.2f} outside tolerance of £{expected['sell_price']:.2f}"
            )
    if "min_sell" in expected and result.sell_price < float(expected["min_sell"]):
        messages.append(f"Sell £{result.sell_price:.2f} below min £{expected['min_sell']:.2f}")
    if "max_sell" in expected and result.sell_price > float(expected["max_sell"]):
        messages.append(f"Sell £{result.sell_price:.2f} above max £{expected['max_sell']:.2f}")
    if "min_job_applied" in expected and result.min_job_applied != expected["min_job_applied"]:
        messages.append(
            f"min_job_applied expected {expected['min_job_applied']}, got {result.min_job_applied}"
        )
    if "min_margin_percent" in expected and result.margin_percent < float(
        expected["min_margin_percent"]
    ):
        messages.append(
            f"Margin {result.margin_percent:.2f}% below min {expected['min_margin_percent']:.2f}%"
        )

    return BenchmarkCheck(
        scenario_id=scenario_id,
        title=title,
        passed=len(messages) == 0,
        messages=messages,
        sell_price=result.sell_price,
        total_cost=result.total_cost,
        margin_percent=result.margin_percent,
    )


def load_demo_scenarios() -> list[dict[str, Any]]:
    data = _load_seed()
    scenarios = list(data.get("demo_scenarios") or [])
    expected_by_id = {
        "DEMO-01": {"sell_price": 2152.67},
        "DEMO-02": {"sell_price": 13152.65},
        "DEMO-03": {"sell_price": 2351.46},
        "DEMO-04": {"sell_price": 1607.64},
        "DEMO-05": {"sell_price": 750.0, "min_job_applied": True},
    }
    for scenario in scenarios:
        sid = scenario.get("id")
        if sid in expected_by_id:
            scenario["expect"] = expected_by_id[sid]
    return scenarios


def load_custom_benchmarks() -> list[dict[str, Any]]:
    if not BENCHMARK_PATH.exists():
        return []
    payload = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    return list(payload.get("scenarios") or [])


def run_all_benchmarks(*, tolerance_gbp: float = 1.0) -> list[BenchmarkCheck]:
    scenarios = load_demo_scenarios() + load_custom_benchmarks()
    return [validate_scenario(s, tolerance_gbp=tolerance_gbp) for s in scenarios]
