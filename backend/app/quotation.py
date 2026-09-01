"""Customer quotation assembly and branded PDF rendering."""

from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta
from io import BytesIO
from urllib.request import urlopen

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.estimate_service import get_settings, serialize_estimate
from app.lifecycle import assert_can_issue_quotation
from app.models import Estimate, PricingSettings
from app.pricing_engine import round_money
from app.schemas import QuotationRead

LOGO_URL = (
    "https://advanceddamp.co.uk/wp-content/uploads/2026/05/Advanced-Damp-1-copy.png"
)

DEFAULT_ASSUMPTIONS = [
    "Access to all specified areas will be provided during normal working hours.",
    "Existing finishes beyond the stated works are excluded unless itemised.",
    "Electrical supply for pumps and ventilation units is assumed available nearby.",
]

DEFAULT_EXCLUSIONS = [
    "Making good of decorations beyond specified plaster/board areas",
    "Structural repairs not identified at survey",
    "Asbestos survey or removal",
    "Building Control / Party Wall fees unless stated",
]

DEFAULT_GUARANTEE = (
    "Where applicable, works are offered with Advanced Damp's standard guarantee "
    "subject to correct use, maintenance, and payment in full. Guarantee certificates "
    "are issued on completion as appropriate to the treatment."
)

DEFAULT_SURVEY_FEE_CREDIT = (
    "Where a survey fee has been paid and the customer proceeds with the quoted works, "
    "the survey fee may be credited against the works invoice in line with Advanced Damp policy."
)

DEFAULT_ACCEPTANCE = (
    "To accept this quotation, please confirm in writing (email is acceptable) quoting the "
    "quotation reference. A deposit may be required before works are scheduled."
)


def _json_list(raw: str | None, fallback: list[str]) -> list[str]:
    if not raw:
        return list(fallback)
    try:
        data = json.loads(raw)
        if isinstance(data, list) and data:
            return [str(item) for item in data]
    except json.JSONDecodeError:
        pass
    return list(fallback)


def quotation_terms(settings_row: PricingSettings) -> dict[str, object]:
    return {
        "assumptions": _json_list(
            getattr(settings_row, "assumptions_json", None), DEFAULT_ASSUMPTIONS
        ),
        "exclusions": _json_list(
            getattr(settings_row, "exclusions_json", None), DEFAULT_EXCLUSIONS
        ),
        "guarantee_wording": getattr(settings_row, "guarantee_wording", None)
        or DEFAULT_GUARANTEE,
        "survey_fee_credit_wording": getattr(
            settings_row, "survey_fee_credit_wording", None
        )
        or DEFAULT_SURVEY_FEE_CREDIT,
        "acceptance_instructions": getattr(
            settings_row, "acceptance_instructions", None
        )
        or DEFAULT_ACCEPTANCE,
    }


def build_quotation(db: Session, estimate: Estimate) -> QuotationRead:
    assert_can_issue_quotation(estimate, db)
    settings_row = get_settings(db)
    read = serialize_estimate(estimate)

    # Snapshot VAT / dates: prefer locked quote values when already issued
    vat_rate = float(
        getattr(estimate, "quote_vat_rate", None) or settings_row.vat_rate or 0.20
    )
    validity_days = int(settings_row.quote_validity_days or 30)
    if estimate.quote_issued_at:
        issue_date = estimate.quote_issued_at.date()
    else:
        issue_date = date.today()
    if estimate.quote_valid_until:
        valid_until = estimate.quote_valid_until.date()
    else:
        valid_until = issue_date + timedelta(days=validity_days)

    subtotal = round_money(read.sell_price)
    scope_lines = [
        {
            "label": item.label,
            "description": item.description,
            "amount": round_money(item.line_sell),
        }
        for item in read.items
    ]
    line_sum = round_money(sum(float(line["amount"]) for line in scope_lines))
    reconciled = abs(line_sum - subtotal) < 0.005 or not scope_lines
    if scope_lines and not reconciled:
        # Final safety net: adjust last displayed line so customer PDF cannot drift
        drift = round_money(subtotal - sum(float(l["amount"]) for l in scope_lines[:-1]))
        scope_lines[-1]["amount"] = drift
        line_sum = subtotal
        reconciled = True

    vat_amount = round_money(subtotal * vat_rate)
    terms = quotation_terms(settings_row)

    return QuotationRead(
        estimate=read,
        company_name=settings.company_name,
        company_phone=settings.company_phone,
        company_email=settings.company_email,
        company_address=settings.company_address,
        vat_rate=vat_rate,
        vat_amount=vat_amount,
        total_inc_vat=round_money(subtotal + vat_amount),
        validity_days=validity_days,
        issue_date=issue_date.isoformat(),
        valid_until=valid_until.isoformat(),
        payment_terms=settings_row.payment_terms
        or "50% deposit on acceptance; balance due on completion.",
        assumptions=list(terms["assumptions"]),  # type: ignore[arg-type]
        exclusions=list(terms["exclusions"]),  # type: ignore[arg-type]
        guarantee_wording=str(terms["guarantee_wording"]),
        survey_fee_credit_wording=str(terms["survey_fee_credit_wording"]),
        acceptance_instructions=str(terms["acceptance_instructions"]),
        scope_lines=scope_lines,
        lines_reconciled=reconciled,
        line_amount_sum=line_sum,
        revision_no=read.revision_no or 1,
    )


def lock_quotation_snapshot(db: Session, estimate: Estimate) -> Estimate:
    """Persist issue date / validity / VAT when marking quoted."""
    settings_row = get_settings(db)
    if not estimate.quote_issued_at:
        estimate.quote_issued_at = datetime.utcnow()
    validity_days = int(settings_row.quote_validity_days or 30)
    if not estimate.quote_valid_until:
        estimate.quote_valid_until = estimate.quote_issued_at + timedelta(
            days=validity_days
        )
    if estimate.quote_vat_rate is None:
        estimate.quote_vat_rate = float(settings_row.vat_rate or 0.20)
    db.commit()
    db.refresh(estimate)
    return estimate


def _safe_filename(quote: QuotationRead) -> str:
    customer = re.sub(r"[^A-Za-z0-9]+", "-", quote.estimate.customer_name).strip("-")
    customer = customer[:40] or "Customer"
    return f"{quote.estimate.reference}-{customer}-Quotation.pdf"


def _load_logo() -> Image | None:
    try:
        data = urlopen(LOGO_URL, timeout=5).read()
        img = Image(BytesIO(data))
        img.drawHeight = 16 * mm
        img.drawWidth = 55 * mm
        return img
    except Exception:
        return None


def render_quotation_pdf(quote: QuotationRead) -> tuple[BytesIO, str]:
    buffer = BytesIO()
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "ADTitle",
        parent=styles["Heading1"],
        textColor=colors.HexColor("#0C1644"),
        fontSize=18,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )
    heading = ParagraphStyle(
        "ADHeading",
        parent=styles["Heading2"],
        textColor=colors.HexColor("#0C1644"),
        fontSize=12,
        spaceBefore=8,
        spaceAfter=6,
        fontName="Helvetica-Bold",
    )
    body = ParagraphStyle(
        "ADBody",
        parent=styles["Normal"],
        textColor=colors.HexColor("#0C0D0E"),
        fontSize=9.5,
        leading=13,
    )
    muted = ParagraphStyle(
        "ADMuted",
        parent=body,
        textColor=colors.HexColor("#706F6F"),
        fontSize=8.5,
        leading=11,
    )
    accent = ParagraphStyle(
        "ADAccent",
        parent=body,
        textColor=colors.HexColor("#FF5F14"),
        fontSize=9,
        fontName="Helvetica-Bold",
    )

    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#2C93F5"))
        canvas.setLineWidth(2)
        canvas.line(18 * mm, A4[1] - 12 * mm, A4[0] - 18 * mm, A4[1] - 12 * mm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#706F6F"))
        canvas.drawString(
            18 * mm,
            10 * mm,
            f"{quote.company_name} · {quote.estimate.reference}",
        )
        canvas.drawRightString(
            A4[0] - 18 * mm,
            10 * mm,
            f"Page {doc.page}",
        )
        canvas.restoreState()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    story: list = []
    logo = _load_logo()
    if logo:
        story.append(logo)
        story.append(Spacer(1, 4))
    story.extend(
        [
            Paragraph(quote.company_name, title),
            Paragraph(
                "Damp Proofing & Structural Waterproofing Specialists", muted
            ),
            Paragraph(
                f"{quote.company_address}<br/>"
                f"{quote.company_phone} · {quote.company_email}",
                muted,
            ),
            Spacer(1, 8),
            Paragraph(
                f"Quotation {quote.estimate.reference}"
                + (
                    f" (Revision {quote.revision_no})"
                    if quote.revision_no and quote.revision_no > 1
                    else ""
                ),
                heading,
            ),
            Paragraph(
                f"<b>Issue date:</b> {quote.issue_date} &nbsp;&nbsp; "
                f"<b>Valid until:</b> {quote.valid_until}",
                body,
            ),
            Spacer(1, 6),
            Paragraph(
                f"<b>Customer:</b> {quote.estimate.customer_name}<br/>"
                f"<b>Site:</b> {quote.estimate.site_address} {quote.estimate.postcode}<br/>"
                f"<b>Surveyor:</b> {quote.estimate.surveyor or '—'}",
                body,
            ),
            Paragraph("Scope of works", heading),
        ]
    )

    table_data = [["Description", "Amount (ex VAT)"]]
    for line in quote.scope_lines:
        table_data.append(
            [
                Paragraph(
                    f"<b>{line['label']}</b><br/>{line.get('description') or ''}",
                    body,
                ),
                f"£{float(line['amount']):,.2f}",
            ]
        )
    if not quote.scope_lines:
        table_data.append(
            ["Works as surveyed and specified", f"£{quote.estimate.sell_price:,.2f}"]
        )

    table = Table(table_data, colWidths=[125 * mm, 35 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0C1644")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E0E0E0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 10))

    totals = Table(
        [
            ["Subtotal (ex VAT)", f"£{quote.estimate.sell_price:,.2f}"],
            [f"VAT ({quote.vat_rate * 100:.0f}%)", f"£{quote.vat_amount:,.2f}"],
            ["Total (inc VAT)", f"£{quote.total_inc_vat:,.2f}"],
        ],
        colWidths=[125 * mm, 35 * mm],
    )
    totals.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#0C1644")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(totals)
    if quote.lines_reconciled:
        story.append(
            Paragraph(
                f"Line amounts sum to subtotal (£{quote.line_amount_sum:,.2f}).",
                muted,
            )
        )

    story.extend(
        [
            Spacer(1, 10),
            Paragraph(f"<b>Payment terms:</b> {quote.payment_terms}", muted),
            Paragraph(
                f"This quotation is valid until <b>{quote.valid_until}</b> "
                f"({quote.validity_days} days from issue).",
                muted,
            ),
            Spacer(1, 8),
            KeepTogether(
                [
                    Paragraph("Assumptions", heading),
                    *[Paragraph(f"• {item}", muted) for item in quote.assumptions],
                ]
            ),
            KeepTogether(
                [
                    Paragraph("Exclusions", heading),
                    *[Paragraph(f"• {item}", muted) for item in quote.exclusions],
                ]
            ),
            KeepTogether(
                [
                    Paragraph("Guarantee", heading),
                    Paragraph(quote.guarantee_wording, muted),
                ]
            ),
            KeepTogether(
                [
                    Paragraph("Survey fee", heading),
                    Paragraph(quote.survey_fee_credit_wording, muted),
                ]
            ),
            KeepTogether(
                [
                    Paragraph("Acceptance", heading),
                    Paragraph(quote.acceptance_instructions, muted),
                ]
            ),
            Spacer(1, 8),
            Paragraph(
                "Internal cost, margin and rate data are intentionally omitted from this quotation.",
                accent,
            ),
        ]
    )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    return buffer, _safe_filename(quote)
