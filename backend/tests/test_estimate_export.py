"""Estimate CSV/Excel export smoke tests."""

from __future__ import annotations

from app.estimate_export import _safe_filename, render_estimates_list_csv
from app.models import Estimate


def test_safe_filename():
    name = _safe_filename("EST-DEMO-01", "Ms Emma Thompson", "Quotation.csv")
    assert name == "EST-DEMO-01-Ms-Emma-Thompson-Quotation.csv"


def test_render_estimates_list_csv():
    row = Estimate(
        reference="EST-DEMO-01",
        customer_name="Ms Emma Thompson",
        site_address="24 Cedar Road",
        postcode="RG1 4AB",
        surveyor="James Whitaker",
        survey_date="2026-08-15",
        status="ready_to_quote",
        notes="",
        total_cost=1500,
        sell_price=2583.2,
        margin_value=1083.2,
        margin_percent=42.0,
    )
    data = render_estimates_list_csv([row])
    text = data.decode("utf-8-sig")
    assert "Reference,Customer,Site" in text
    assert "EST-DEMO-01" in text
    assert "Ms Emma Thompson" in text
    assert "2583.20" in text
