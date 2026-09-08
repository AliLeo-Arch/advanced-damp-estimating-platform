"""Quotation reconciliation and PDF smoke tests."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.lifecycle import assert_can_issue_quotation
from app.models import Estimate, EstimateItem, EstimateStatus, PricingSettings
from app.pricing_engine import calculate_estimate, round_money
from app.quotation import DEFAULT_ASSUMPTIONS, build_quotation, render_quotation_pdf
from app.schemas import EstimateItemRead, EstimateRead, QuotationRead


class _FakeQuery:
    def __init__(self, row):
        self._row = row

    def first(self):
        return self._row


class _FakeSession:
    def __init__(self, settings: PricingSettings):
        self._settings = settings

    def query(self, _model):
        return _FakeQuery(self._settings)


def test_render_pdf_reconciles_and_is_valid_pdf():
    lines = [
        EstimateItemRead(
            id=1,
            work_type="injection_replaster",
            label="Injection Treatment & Replastering",
            sort_order=0,
            measurements={},
            description="DPC works",
            line_cost=500,
            line_sell=700.0,
            target_margin_percent=35,
        ),
        EstimateItemRead(
            id=2,
            work_type="membrane_waterproofing",
            label="Membrane Waterproofing System",
            sort_order=1,
            measurements={},
            description="Membrane works",
            line_cost=800,
            line_sell=1100.55,
            target_margin_percent=32,
        ),
    ]
    subtotal = round_money(sum(item.line_sell for item in lines))
    estimate = EstimateRead(
        id=1,
        reference="EST-00099",
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
        company_name="Northbridge Property Services Ltd",
        company_phone="0118 496 0123",
        company_email="info@northbridge-demo.example",
        company_address="12 Station Approach, Reading RG1 1LG",
        company_website="https://www.northbridge-demo.example",
        company_tagline="Specialist Trade Estimating & Quoting",
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
    assert round_money(quote.vat_amount + quote.estimate.sell_price) == quote.total_inc_vat
    buffer, filename = render_quotation_pdf(quote)
    data = buffer.read()
    assert data.startswith(b"%PDF")
    assert "EST-00099" in filename
    assert "Mrs-Smith" in filename
    assert "Quotation.pdf" in filename


def test_pricing_lines_still_sum_to_sell():
    from tests.test_pricing_engine import SAMPLE_RATES

    result = calculate_estimate(
        work_items=[
            {
                "work_type": "injection_replaster",
                "measurements": {
                    "walls": 1,
                    "wall_length_lm": 10,
                    "replaster_height_m": 1.2,
                },
            },
            {
                "work_type": "membrane_waterproofing",
                "measurements": {
                    "wall_area_m2": 15,
                    "floor_area_m2": 8,
                    "include_battens": True,
                    "include_boarding": True,
                },
            },
        ],
        rates=SAMPLE_RATES,
        margins_by_type={"injection_replaster": 35.0, "membrane_waterproofing": 32.0},
        travel_band_code="TRV-LOCAL",
        waste_code="WS-ALLOW-SMALL",
        prelim_codes=["PRE-STD"],
        minimum_job_value=750.0,
    )
    assert round_money(sum(line.line_sell for line in result.lines)) == result.sell_price


def test_issue_blocked_when_line_amounts_do_not_reconcile():
    settings = PricingSettings(
        min_permitted_margin_percent=20,
    )
    estimate = Estimate(
        reference="EST-UNBAL",
        customer_name="Unbalanced",
        status=EstimateStatus.READY_TO_QUOTE.value,
        sell_price=1000,
        margin_percent=30,
        below_target_margin=0,
        items=[
            EstimateItem(
                work_type="injection_replaster",
                label="Injection",
                line_sell=400,
                target_margin_percent=30,
                sort_order=0,
            ),
            EstimateItem(
                work_type="membrane_waterproofing",
                label="Membrane",
                line_sell=500,
                target_margin_percent=30,
                sort_order=1,
            ),
        ],
    )
    with pytest.raises(HTTPException) as exc:
        assert_can_issue_quotation(estimate, _FakeSession(settings))
    assert exc.value.status_code == 400
    assert "do not match" in str(exc.value.detail)


def test_build_quotation_marks_unbalanced_without_silent_adjust(monkeypatch):
    settings = PricingSettings(
        vat_rate=0.2,
        quote_validity_days=30,
        payment_terms="Pay on completion",
        min_permitted_margin_percent=20,
    )
    estimate = Estimate(
        id=9,
        reference="EST-DRIFT",
        customer_name="Drift",
        site_address="1 Test Street",
        postcode="RG1 1AA",
        surveyor="Surveyor",
        notes="",
        status=EstimateStatus.READY_TO_QUOTE.value,
        sell_price=1000,
        total_cost=700,
        margin_percent=30,
        margin_value=300,
        below_target_margin=0,
        items=[
            EstimateItem(
                id=1,
                work_type="injection_replaster",
                label="Injection",
                description="Works",
                line_cost=300,
                line_sell=400,
                target_margin_percent=30,
                sort_order=0,
            ),
            EstimateItem(
                id=2,
                work_type="membrane_waterproofing",
                label="Membrane",
                description="Works",
                line_cost=400,
                line_sell=500,
                target_margin_percent=30,
                sort_order=1,
            ),
        ],
    )

    monkeypatch.setattr(
        "app.quotation.assert_can_issue_quotation",
        lambda *_args, **_kwargs: None,
    )
    monkeypatch.setattr("app.quotation.get_settings", lambda _db: settings)
    monkeypatch.setattr(
        "app.quotation.resolve_company_profile",
        lambda _settings: type(
            "Company",
            (),
            {
                "name": "Northbridge Property Services Ltd",
                "phone": "0118",
                "email": "info@example.com",
                "address": "Reading",
                "website": "",
                "tagline": "",
            },
        )(),
    )

    quote = build_quotation(_FakeSession(settings), estimate)
    assert quote.lines_reconciled is False
    assert quote.line_amount_sum == 900.0
    assert quote.estimate.sell_price == 1000.0
    assert round_money(sum(float(line["amount"]) for line in quote.scope_lines)) == 900.0
