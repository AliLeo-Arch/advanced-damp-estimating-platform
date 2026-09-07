"""Actual cost variance tests."""

from __future__ import annotations

from app.actuals import build_comparison, comparison_to_dict
from app.models import Estimate, EstimateActuals, EstimateStatus


def test_variance_calculation():
    estimate = Estimate(
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
    assert comparison.total_cost.estimated == 950.0
    assert comparison.total_cost.actual == 1055.0
    assert comparison.total_cost.variance == 105.0
    assert comparison.revenue.actual == 1400.0
    assert comparison.actual_margin_percent < comparison.estimated_margin_percent
    assert comparison.waste.label == "Waste"
    data = comparison_to_dict(comparison)
    assert data["materials"]["variance"] == 20.0
    assert "margin_percent_variance" in data


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
