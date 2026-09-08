"""Quoted vs actual cost comparison."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.models import Estimate, EstimateActuals
from app.pricing_engine import margin_from_sell, round_money

COST_CATEGORY_FIELDS = (
    "materials_actual",
    "labour_actual",
    "waste_actual",
    "travel_actual",
    "prelims_actual",
    "other_actual",
)


@dataclass
class CostLine:
    label: str
    estimated: float
    actual: float | None
    variance: float | None
    entered: bool


@dataclass
class ActualsComparison:
    materials: CostLine
    labour: CostLine
    waste: CostLine
    travel: CostLine
    prelims: CostLine
    other: CostLine
    total_cost: CostLine
    revenue: CostLine
    margin_value: CostLine
    margin_percent: CostLine
    estimated_margin_percent: float
    actual_margin_percent: float | None
    margin_percent_variance: float | None
    status: str  # not_started | partial | complete
    categories_entered: int
    categories_total: int


@dataclass
class _ActualsView:
    materials_actual: float | None
    labour_actual: float | None
    waste_actual: float | None
    travel_actual: float | None
    prelims_actual: float | None
    other_actual: float | None
    revenue_actual: float | None
    notes: str


def _as_optional_money(value: float | None) -> float | None:
    if value is None:
        return None
    return round_money(float(value))


def _looks_legacy_empty(actuals: EstimateActuals) -> bool:
    values = [getattr(actuals, field) for field in COST_CATEGORY_FIELDS]
    if any(v is None for v in values):
        return False
    if actuals.revenue_actual is not None or (actuals.notes or "").strip():
        return False
    return all(float(v or 0) == 0.0 for v in values)


def normalize_actuals_values(actuals: EstimateActuals) -> _ActualsView:
    """
    Treat legacy empty rows (all cost fields stored as 0, no revenue/notes)
    as not started — missing data, not zero cost. Does not mutate the ORM row.
    """
    if _looks_legacy_empty(actuals):
        return _ActualsView(
            materials_actual=None,
            labour_actual=None,
            waste_actual=None,
            travel_actual=None,
            prelims_actual=None,
            other_actual=None,
            revenue_actual=None,
            notes="",
        )
    return _ActualsView(
        materials_actual=actuals.materials_actual,
        labour_actual=actuals.labour_actual,
        waste_actual=actuals.waste_actual,
        travel_actual=actuals.travel_actual,
        prelims_actual=actuals.prelims_actual,
        other_actual=actuals.other_actual,
        revenue_actual=actuals.revenue_actual,
        notes=actuals.notes or "",
    )


def actuals_entry_status(view: _ActualsView) -> tuple[str, int, int]:
    entered = sum(
        1 for field in COST_CATEGORY_FIELDS if getattr(view, field) is not None
    )
    total = len(COST_CATEGORY_FIELDS)
    if entered == 0:
        return "not_started", 0, total
    if entered >= total:
        return "complete", entered, total
    return "partial", entered, total


def build_comparison(estimate: Estimate, actuals: EstimateActuals) -> ActualsComparison:
    view = normalize_actuals_values(actuals)

    est_materials = round_money(estimate.materials_cost or 0)
    est_labour = round_money(estimate.labour_cost or 0)
    est_waste = round_money(estimate.waste_cost or 0)
    est_travel = round_money(estimate.travel_cost or 0)
    est_prelims = round_money(estimate.prelim_cost or 0)
    est_other = 0.0
    est_total = round_money(estimate.total_cost or 0)
    est_revenue = round_money(estimate.sell_price or 0)
    est_margin_value = round_money(estimate.margin_value or 0)
    est_margin_percent = round(estimate.margin_percent or 0, 2)

    status, categories_entered, categories_total = actuals_entry_status(view)

    act_materials = _as_optional_money(view.materials_actual)
    act_labour = _as_optional_money(view.labour_actual)
    act_waste = _as_optional_money(view.waste_actual)
    act_travel = _as_optional_money(view.travel_actual)
    act_prelims = _as_optional_money(view.prelims_actual)
    act_other = _as_optional_money(view.other_actual)

    def line(label: str, est: float, act: float | None) -> CostLine:
        entered = act is not None
        return CostLine(
            label=label,
            estimated=est,
            actual=act,
            variance=round_money(act - est) if entered else None,
            entered=entered,
        )

    materials = line("Materials", est_materials, act_materials)
    labour = line("Labour", est_labour, act_labour)
    waste = line("Waste", est_waste, act_waste)
    travel = line("Travel", est_travel, act_travel)
    prelims = line("Preliminaries", est_prelims, act_prelims)
    other = line("Other", est_other, act_other)

    entered_costs = [
        row.actual
        for row in (materials, labour, waste, travel, prelims, other)
        if row.entered and row.actual is not None
    ]

    if status == "not_started":
        act_total = None
        act_margin_value = None
        act_margin_percent = None
        margin_var = None
        total_entered = False
        margin_entered = False
        revenue = CostLine(
            label="Revenue (sell)",
            estimated=est_revenue,
            actual=None,
            variance=None,
            entered=False,
        )
    else:
        act_total = round_money(sum(entered_costs)) if entered_costs else None
        total_entered = act_total is not None
        if view.revenue_actual is not None:
            act_revenue = round_money(float(view.revenue_actual))
        else:
            act_revenue = est_revenue
        revenue = CostLine(
            label="Revenue (sell)",
            estimated=est_revenue,
            actual=act_revenue,
            variance=round_money(act_revenue - est_revenue),
            entered=True,
        )
        if status == "complete" and act_total is not None:
            act_margin_value, act_margin_percent = margin_from_sell(
                act_total, act_revenue
            )
            margin_var = round(act_margin_percent - est_margin_percent, 2)
            margin_entered = True
        else:
            act_margin_value = None
            act_margin_percent = None
            margin_var = None
            margin_entered = False

    total_cost = CostLine(
        label="Total cost",
        estimated=est_total,
        actual=act_total,
        variance=round_money(act_total - est_total)
        if total_entered and act_total is not None
        else None,
        entered=total_entered,
    )
    margin_value = CostLine(
        label="Margin £",
        estimated=est_margin_value,
        actual=act_margin_value,
        variance=round_money(act_margin_value - est_margin_value)
        if margin_entered and act_margin_value is not None
        else None,
        entered=margin_entered,
    )
    margin_percent = CostLine(
        label="Margin %",
        estimated=est_margin_percent,
        actual=act_margin_percent,
        variance=margin_var,
        entered=margin_entered,
    )

    return ActualsComparison(
        materials=materials,
        labour=labour,
        waste=waste,
        travel=travel,
        prelims=prelims,
        other=other,
        total_cost=total_cost,
        revenue=revenue,
        margin_value=margin_value,
        margin_percent=margin_percent,
        estimated_margin_percent=est_margin_percent,
        actual_margin_percent=act_margin_percent,
        margin_percent_variance=margin_var,
        status=status,
        categories_entered=categories_entered,
        categories_total=categories_total,
    )


def comparison_to_dict(comparison: ActualsComparison) -> dict[str, Any]:
    def row(line: CostLine) -> dict[str, Any]:
        return {
            "label": line.label,
            "estimated": line.estimated,
            "actual": line.actual,
            "variance": line.variance,
            "entered": line.entered,
        }

    return {
        "materials": row(comparison.materials),
        "labour": row(comparison.labour),
        "waste": row(comparison.waste),
        "travel": row(comparison.travel),
        "prelims": row(comparison.prelims),
        "other": row(comparison.other),
        "total_cost": row(comparison.total_cost),
        "revenue": row(comparison.revenue),
        "margin_value": row(comparison.margin_value),
        "margin_percent": row(comparison.margin_percent),
        "estimated_margin_percent": comparison.estimated_margin_percent,
        "actual_margin_percent": comparison.actual_margin_percent,
        "margin_percent_variance": comparison.margin_percent_variance,
        "status": comparison.status,
        "categories_entered": comparison.categories_entered,
        "categories_total": comparison.categories_total,
    }
