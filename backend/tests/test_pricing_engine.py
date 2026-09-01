"""Tests for pricing engine reconciliation and allocation."""

from __future__ import annotations

from app.pricing_engine import calculate_estimate, reconcile_line_sells, round_money


def _rate(code: str, cost: float, category: str = "materials", **extra):
    return {
        "code": code,
        "name": code,
        "category": category,
        "unit": "each",
        "cost_per_unit": cost,
        "waste_percent": 0,
        "notes": "",
        "meta": {},
        "active": True,
        **extra,
    }


SAMPLE_RATES = [
    _rate("MAT-DPC-CREAM", 12.0),
    _rate("MAT-DPC-PLUGS", 0.15),
    _rate("MAT-RENOV-PLASTER", 18.0),
    _rate("MAT-SBR-PRIMER", 8.0),
    _rate("LAB-DPC-LM", 22.0, "labour"),
    _rate("LAB-REPLASTER-M2", 28.0, "labour"),
    _rate("MAT-CDM-WALL-8", 14.0),
    _rate("MAT-CDM-FLOOR-20", 16.0),
    _rate("MAT-CDM-FIXINGS", 0.08),
    _rate("MAT-BATTEN-25", 1.2),
    _rate("MAT-BOARD-12.5", 6.5),
    _rate("MAT-DRAIN-CHANNEL", 18.0),
    _rate("LAB-MEMBRANE-M2", 25.0, "labour"),
    _rate("LAB-BOARD-M2", 18.0, "labour"),
    _rate("WS-ALLOW-SMALL", 85.0, "waste_skip"),
    _rate("TRV-LOCAL", 45.0, "travel"),
    _rate("PRE-STD", 120.0, "preliminaries"),
]


def test_line_sells_reconcile_to_job_sell():
    result = calculate_estimate(
        work_items=[
            {
                "work_type": "dpc_replastering",
                "measurements": {
                    "walls": 1,
                    "wall_length_lm": 12,
                    "replaster_height_m": 1.2,
                },
            },
            {
                "work_type": "cavity_drain",
                "measurements": {
                    "wall_area_m2": 20,
                    "floor_area_m2": 10,
                    "include_battens": True,
                    "include_boarding": True,
                    "drainage_channel_lm": 0,
                },
            },
        ],
        rates=SAMPLE_RATES,
        margins_by_type={"dpc_replastering": 35.0, "cavity_drain": 32.0},
        travel_band_code="TRV-LOCAL",
        waste_code="WS-ALLOW-SMALL",
        prelim_codes=["PRE-STD"],
        minimum_job_value=750.0,
    )
    line_sum = round_money(sum(line.line_sell for line in result.lines))
    assert line_sum == result.sell_price
    assert result.breakdown["reconciliation"]["balanced"] is True
    assert result.breakdown["job_level_cost"] == round_money(85 + 45 + 120)


def test_minimum_job_still_reconciles():
    result = calculate_estimate(
        work_items=[
            {
                "work_type": "dpc_replastering",
                "measurements": {
                    "walls": 1,
                    "wall_length_lm": 1,
                    "replaster_height_m": 0.5,
                },
            }
        ],
        rates=SAMPLE_RATES,
        margins_by_type={"dpc_replastering": 35.0},
        travel_band_code="TRV-LOCAL",
        waste_code="WS-ALLOW-SMALL",
        prelim_codes=["PRE-STD"],
        minimum_job_value=750.0,
    )
    assert result.min_job_applied is True
    assert result.sell_price == 750.0
    assert round_money(sum(line.line_sell for line in result.lines)) == 750.0


def test_override_sell_reconciles():
    result = calculate_estimate(
        work_items=[
            {
                "work_type": "dpc_replastering",
                "measurements": {
                    "walls": 1,
                    "wall_length_lm": 12,
                    "replaster_height_m": 1.2,
                },
            },
            {
                "work_type": "cavity_drain",
                "measurements": {
                    "wall_area_m2": 20,
                    "floor_area_m2": 10,
                    "include_battens": True,
                    "include_boarding": True,
                },
            },
        ],
        rates=SAMPLE_RATES,
        margins_by_type={"dpc_replastering": 35.0, "cavity_drain": 32.0},
        travel_band_code="TRV-LOCAL",
        waste_code="WS-ALLOW-SMALL",
        prelim_codes=["PRE-STD"],
        minimum_job_value=750.0,
        override_sell_price=5000.0,
    )
    assert result.sell_price == 5000.0
    assert round_money(sum(line.line_sell for line in result.lines)) == 5000.0


def test_reconcile_helper_penny_perfect():
    from app.pricing_engine import WorkLineResult

    lines = [
        WorkLineResult(
            work_type="a",
            label="A",
            description="",
            line_sell=100.0,
            target_margin_percent=30,
        ),
        WorkLineResult(
            work_type="b",
            label="B",
            description="",
            line_sell=200.0,
            target_margin_percent=30,
        ),
    ]
    reconcile_line_sells(lines, 333.33)
    assert round_money(sum(line.line_sell for line in lines)) == 333.33


def test_validation_warnings_for_empty_ventilation():
    result = calculate_estimate(
        work_items=[{"work_type": "ventilation", "measurements": {"items": []}}],
        rates=SAMPLE_RATES,
        margins_by_type={"ventilation": 34.0},
        travel_band_code="TRV-LOCAL",
        waste_code="WS-ALLOW-SMALL",
        prelim_codes=[],
        minimum_job_value=750.0,
    )
    assert any("Ventilation" in w for w in result.breakdown["validation_warnings"])
