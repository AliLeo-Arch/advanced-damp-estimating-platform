"""Quotation reconciliation and PDF smoke tests."""

from __future__ import annotations

from app.pricing_engine import calculate_estimate, round_money
from app.quotation import DEFAULT_ASSUMPTIONS, render_quotation_pdf
from app.schemas import EstimateItemRead, EstimateRead, QuotationRead


def test_render_pdf_reconciles_and_is_valid_pdf():
    lines = [
        EstimateItemRead(
            id=1,
            work_type="dpc_replastering",
            label="Chemical DPC Injection & Replastering",
            sort_order=0,
            measurements={},
            description="DPC works",
            line_cost=500,
            line_sell=700.0,
            target_margin_percent=35,
        ),
        EstimateItemRead(
            id=2,
            work_type="cavity_drain",
            label="Cavity Drain Membrane Systems",
            sort_order=1,
            measurements={},
            description="Membrane works",
            line_cost=800,
            line_sell=1100.55,
            target_margin_percent=32,
        ),
    ]
    subtotal = round_money(sum(item.line_sell for item in lines))
    # Force a 1p drift then rely on builder-side correction path via QuotationRead direct
    estimate = EstimateRead(
        id=1,
        reference="AD-00099",
        revision_no=2,
        customer_name="Mrs Smith",
        site_address="12 High Street",
        postcode="CR0 1AB",
        surveyor="James Whitaker",
        status="ready_to_quote",
        notes="",
        total_cost=1300,
        sell_price=subtotal,
        margin_value=subtotal - 1300,
        margin_percent=30,
        items=lines,
    )
    quote = QuotationRead(
        estimate=estimate,
        company_name="Advanced Damp Ltd",
        company_phone="0300 373 7251",
        company_email="info@advanceddamp.co.uk",
        company_address="45 Fitzroy St, London W1T 6EB",
        vat_rate=0.2,
        vat_amount=round_money(subtotal * 0.2),
        total_inc_vat=round_money(subtotal * 1.2),
        validity_days=30,
        issue_date="2026-08-31",
        valid_until="2026-09-30",
        payment_terms="50% deposit on acceptance; balance due on completion.",
        assumptions=DEFAULT_ASSUMPTIONS,
        exclusions=["Asbestos survey or removal"],
        guarantee_wording="Standard guarantee applies.",
        survey_fee_credit_wording="Survey fee may be credited.",
        acceptance_instructions="Confirm in writing.",
        scope_lines=[
            {
                "label": item.label,
                "description": item.description,
                "amount": item.line_sell,
            }
            for item in lines
        ],
        lines_reconciled=True,
        line_amount_sum=subtotal,
        revision_no=2,
    )
    assert round_money(sum(float(l["amount"]) for l in quote.scope_lines)) == quote.estimate.sell_price
    buffer, filename = render_quotation_pdf(quote)
    data = buffer.read()
    assert data.startswith(b"%PDF")
    assert "AD-00099" in filename
    assert "Mrs-Smith" in filename
    assert "Quotation.pdf" in filename


def test_pricing_lines_still_sum_to_sell():
    from tests.test_pricing_engine import SAMPLE_RATES

    result = calculate_estimate(
        work_items=[
            {
                "work_type": "dpc_replastering",
                "measurements": {
                    "walls": 1,
                    "wall_length_lm": 10,
                    "replaster_height_m": 1.2,
                },
            },
            {
                "work_type": "cavity_drain",
                "measurements": {
                    "wall_area_m2": 15,
                    "floor_area_m2": 8,
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
    )
    assert round_money(sum(line.line_sell for line in result.lines)) == result.sell_price
