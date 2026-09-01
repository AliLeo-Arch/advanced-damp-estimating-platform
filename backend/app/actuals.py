"""Quoted vs actual cost comparison."""

from __future__ import annotations

from dataclasses import dataclass

from app.models import Estimate, EstimateActuals
from app.pricing_engine import margin_from_sell, round_money


@dataclass
class CostLine:
    label: str
    estimated: float
    actual: float
    variance: float


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
    actual_margin_percent: float
    margin_percent_variance: float


def build_comparison(estimate: Estimate, actuals: EstimateActuals) -> ActualsComparison:
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

    act_materials = round_money(actuals.materials_actual or 0)
    act_labour = round_money(actuals.labour_actual or 0)
    act_waste = round_money(actuals.waste_actual or 0)
    act_travel = round_money(actuals.travel_actual or 0)
    act_prelims = round_money(actuals.prelims_actual or 0)
    act_other = round_money(actuals.other_actual or 0)
    act_total = round_money(
        act_materials + act_labour + act_waste + act_travel + act_prelims + act_other
    )
    act_revenue = round_money(
        actuals.revenue_actual if actuals.revenue_actual is not None else est_revenue
    )
    act_margin_value, act_margin_percent = margin_from_sell(act_total, act_revenue)

    def line(label: str, est: float, act: float) -> CostLine:
        return CostLine(
            label=label,
            estimated=est,
            actual=act,
            variance=round_money(act - est),
        )

    return ActualsComparison(
        materials=line("Materials", est_materials, act_materials),
        labour=line("Labour", est_labour, act_labour),
        waste=line("Waste / skip", est_waste, act_waste),
        travel=line("Travel", est_travel, act_travel),
        prelims=line("Preliminaries", est_prelims, act_prelims),
        other=line("Other", est_other, act_other),
        total_cost=line("Total cost", est_total, act_total),
        revenue=line("Revenue (sell)", est_revenue, act_revenue),
        margin_value=line("Margin £", est_margin_value, act_margin_value),
        margin_percent=line(
            "Margin %",
            est_margin_percent,
            act_margin_percent,
        ),
        estimated_margin_percent=est_margin_percent,
        actual_margin_percent=act_margin_percent,
        margin_percent_variance=round(act_margin_percent - est_margin_percent, 2),
    )


def comparison_to_dict(comparison: ActualsComparison) -> dict:
    def row(line: CostLine) -> dict:
        return {
            "label": line.label,
            "estimated": line.estimated,
            "actual": line.actual,
            "variance": line.variance,
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
    }
