"""Actual cost variance tests."""

from __future__ import annotations

from app.actuals import build_comparison, comparison_to_dict
from app.models import Estimate, EstimateActuals, EstimateStatus


def _base_estimate(**kwargs) -> Estimate:
    defaults = dict(
        reference="EST-00100",
        customer_name="Test",
        status=EstimateStatus.ACCEPTED.value,
        materials_cost=400,
        labour_cost=300,
        waste_cost=85,
        travel_cost=45,
        prelim_cost=120,
        total_cost=950,
        sell_price=1400,
        margin_value=450,
        margin_percent=32.14,
    )
    defaults.update(kwargs)
    return Estimate(**defaults)


def test_variance_calculation_when_complete():
    estimate = _base_estimate()
    actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=420,
        labour_actual=350,
        waste_actual=90,
        travel_actual=50,
        prelims_actual=120,
        other_actual=25,
        revenue_actual=None,
    )
    comparison = build_comparison(estimate, actuals)
    assert comparison.status == "complete"
    assert comparison.total_cost.estimated == 950.0
    assert comparison.total_cost.actual == 1055.0
    assert comparison.total_cost.variance == 105.0
    assert comparison.revenue.actual == 1400.0
    assert comparison.actual_margin_percent is not None
    assert comparison.actual_margin_percent < comparison.estimated_margin_percent
    assert comparison.waste.label == "Waste"
    data = comparison_to_dict(comparison)
    assert data["materials"]["variance"] == 20.0
    assert data["materials"]["entered"] is True
    assert "margin_percent_variance" in data


def test_not_started_does_not_imply_zero_cost_or_full_margin():
    estimate = _base_estimate()
    actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=None,
        labour_actual=None,
        waste_actual=None,
        travel_actual=None,
        prelims_actual=None,
        other_actual=None,
        revenue_actual=None,
    )
    comparison = build_comparison(estimate, actuals)
    assert comparison.status == "not_started"
    assert comparison.total_cost.actual is None
    assert comparison.total_cost.variance is None
    assert comparison.materials.actual is None
    assert comparison.materials.entered is False
    assert comparison.actual_margin_percent is None
    assert comparison.margin_percent_variance is None
    data = comparison_to_dict(comparison)
    assert data["status"] == "not_started"
    assert data["actual_margin_percent"] is None
    assert data["materials"]["entered"] is False


def test_legacy_all_zero_row_treated_as_not_started():
    estimate = _base_estimate()
    actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=0,
        labour_actual=0,
        waste_actual=0,
        travel_actual=0,
        prelims_actual=0,
        other_actual=0,
        revenue_actual=None,
        notes="",
    )
    comparison = build_comparison(estimate, actuals)
    assert comparison.status == "not_started"
    assert comparison.actual_margin_percent is None
    assert comparison.total_cost.actual is None


def test_partial_actuals_skip_definitive_margin():
    estimate = _base_estimate()
    actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=420,
        labour_actual=350,
        waste_actual=None,
        travel_actual=None,
        prelims_actual=None,
        other_actual=None,
        revenue_actual=None,
    )
    comparison = build_comparison(estimate, actuals)
    assert comparison.status == "partial"
    assert comparison.categories_entered == 2
    assert comparison.materials.entered is True
    assert comparison.waste.entered is False
    assert comparison.waste.actual is None
    assert comparison.total_cost.actual == 770.0
    assert comparison.actual_margin_percent is None
    assert comparison.margin_value.entered is False


def test_genuine_zero_other_cost_is_entered():
    estimate = _base_estimate()
    actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=400,
        labour_actual=300,
        waste_actual=85,
        travel_actual=45,
        prelims_actual=120,
        other_actual=0,
        revenue_actual=1400,
        notes="all categories known",
    )
    comparison = build_comparison(estimate, actuals)
    assert comparison.status == "complete"
    assert comparison.other.entered is True
    assert comparison.other.actual == 0.0
    assert comparison.actual_margin_percent is not None


def test_list_csv_includes_actuals_columns():
    from app.estimate_export import render_estimates_list_csv

    estimate = Estimate(
        reference="EST-200",
        customer_name="Demo",
        site_address="1 High Street",
        postcode="RG1 1AA",
        status=EstimateStatus.ACCEPTED.value,
        sell_price=2000,
        margin_percent=30,
        total_cost=1400,
        materials_cost=700,
        labour_cost=500,
        waste_cost=50,
        travel_cost=50,
        prelim_cost=100,
        margin_value=600,
        surveyor="Surveyor",
        survey_date="2026-01-01",
    )
    estimate.actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=750,
        labour_actual=520,
        waste_actual=50,
        travel_actual=50,
        prelims_actual=100,
        other_actual=0,
        revenue_actual=2000,
    )
    csv_bytes = render_estimates_list_csv([estimate])
    text = csv_bytes.decode("utf-8-sig")
    assert "Actual cost" in text
    assert "Cost variance" in text
    assert "Actual margin %" in text
    assert "EST-200" in text


def test_list_csv_leaves_blank_when_actuals_not_started():
    from app.estimate_export import render_estimates_list_csv

    estimate = Estimate(
        reference="EST-201",
        customer_name="Demo",
        site_address="2 High Street",
        postcode="RG1 1BB",
        status=EstimateStatus.ACCEPTED.value,
        sell_price=2000,
        margin_percent=30,
        total_cost=1400,
        materials_cost=700,
        labour_cost=500,
        waste_cost=50,
        travel_cost=50,
        prelim_cost=100,
        margin_value=600,
        surveyor="Surveyor",
        survey_date="2026-01-01",
    )
    estimate.actuals = EstimateActuals(
        estimate_id=1,
        materials_actual=None,
        labour_actual=None,
        waste_actual=None,
        travel_actual=None,
        prelims_actual=None,
        other_actual=None,
        revenue_actual=None,
    )
    csv_bytes = render_estimates_list_csv([estimate])
    text = csv_bytes.decode("utf-8-sig")
    row = [line for line in text.splitlines() if line.startswith("EST-201")][0]
    # Sell, margin %, estimated cost present; actual columns blank (no 100% margin).
    assert "2000.00" in row
    assert "1400.00" in row
    parts = row.split(",")
    # Actual cost, cost variance, actual margin %, margin % variance should be empty.
    assert parts[8] == ""
    assert parts[9] == ""
    assert parts[10] == ""
    assert parts[11] == ""
