"""Deterministic pricing engine for Advanced Damp POC work types."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any


def round_money(value: float) -> float:
    return round(float(value) + 1e-9, 2)


def sell_from_margin(cost: float, margin_percent: float) -> float:
    if cost <= 0:
        return 0.0
    margin = max(0.0, min(float(margin_percent), 95.0)) / 100.0
    return round_money(cost / (1.0 - margin))


def margin_from_sell(cost: float, sell: float) -> tuple[float, float]:
    if sell <= 0:
        return 0.0, 0.0
    value = round_money(sell - cost)
    percent = round((value / sell) * 100.0, 2)
    return value, percent


@dataclass
class LineComponent:
    code: str
    name: str
    quantity: float
    unit: str
    unit_cost: float
    total: float
    kind: str  # materials | labour | other


@dataclass
class WorkLineResult:
    work_type: str
    label: str
    description: str
    materials_cost: float = 0.0
    labour_cost: float = 0.0
    line_cost: float = 0.0
    target_margin_percent: float = 0.0
    line_sell: float = 0.0
    components: list[LineComponent] = field(default_factory=list)
    measurements: dict[str, Any] = field(default_factory=dict)


@dataclass
class PricingResult:
    materials_cost: float
    labour_cost: float
    waste_cost: float
    travel_cost: float
    prelim_cost: float
    total_cost: float
    target_margin_percent: float
    calculated_sell_price: float
    sell_price: float
    margin_value: float
    margin_percent: float
    min_job_applied: bool
    below_target_margin: bool
    lines: list[WorkLineResult]
    breakdown: dict[str, Any]


def _rate_map(rates: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {r["code"]: r for r in rates if r.get("active", True)}


def _with_waste(qty: float, waste_percent: float) -> float:
    return qty * (1.0 + max(0.0, waste_percent) / 100.0)


def _add_material(
    components: list[LineComponent],
    rates: dict[str, dict[str, Any]],
    code: str,
    qty: float,
) -> float:
    rate = rates.get(code)
    if not rate or qty <= 0:
        return 0.0
    qty_w = _with_waste(qty, float(rate.get("waste_percent") or 0))
    total = round_money(qty_w * float(rate["cost_per_unit"]))
    components.append(
        LineComponent(
            code=code,
            name=rate["name"],
            quantity=round(qty_w, 3),
            unit=rate.get("unit") or "each",
            unit_cost=float(rate["cost_per_unit"]),
            total=total,
            kind="materials",
        )
    )
    return total


def _add_labour(
    components: list[LineComponent],
    rates: dict[str, dict[str, Any]],
    code: str,
    qty: float,
) -> float:
    rate = rates.get(code)
    if not rate or qty <= 0:
        return 0.0
    total = round_money(qty * float(rate["cost_per_unit"]))
    components.append(
        LineComponent(
            code=code,
            name=rate["name"],
            quantity=round(qty, 3),
            unit=rate.get("unit") or "each",
            unit_cost=float(rate["cost_per_unit"]),
            total=total,
            kind="labour",
        )
    )
    return total


def price_dpc(
    measurements: dict[str, Any],
    rates: dict[str, dict[str, Any]],
    margin: float,
) -> WorkLineResult:
    length = float(measurements.get("wall_length_lm") or 0)
    height = float(measurements.get("replaster_height_m") or 0)
    walls = max(1, int(measurements.get("walls") or 1))
    dpc_lm = length * walls
    replaster_m2 = dpc_lm * height
    components: list[LineComponent] = []

    materials = 0.0
    materials += _add_material(components, rates, "MAT-DPC-CREAM", dpc_lm * 0.3)
    materials += _add_material(components, rates, "MAT-DPC-PLUGS", dpc_lm * 6)
    materials += _add_material(components, rates, "MAT-RENOV-PLASTER", replaster_m2 / 2.5)
    materials += _add_material(components, rates, "MAT-SBR-PRIMER", replaster_m2 * 0.2)

    labour = 0.0
    labour += _add_labour(components, rates, "LAB-DPC-LM", dpc_lm)
    labour += _add_labour(components, rates, "LAB-REPLASTER-M2", replaster_m2)

    cost = round_money(materials + labour)
    return WorkLineResult(
        work_type="dpc_replastering",
        label="Chemical DPC Injection & Replastering",
        description=(
            f"Chemical DPC injection to {dpc_lm:.1f} lm and renovating plaster "
            f"to {height:.2f} m ({replaster_m2:.1f} m²)."
        ),
        materials_cost=round_money(materials),
        labour_cost=round_money(labour),
        line_cost=cost,
        target_margin_percent=margin,
        line_sell=sell_from_margin(cost, margin),
        components=components,
        measurements={
            **measurements,
            "dpc_lm": dpc_lm,
            "replaster_m2": round(replaster_m2, 2),
        },
    )


def price_cavity_drain(
    measurements: dict[str, Any],
    rates: dict[str, dict[str, Any]],
    margin: float,
) -> WorkLineResult:
    wall = float(measurements.get("wall_area_m2") or 0)
    floor = float(measurements.get("floor_area_m2") or 0)
    channel = float(measurements.get("drainage_channel_lm") or 0)
    include_battens = bool(measurements.get("include_battens", True))
    include_boarding = bool(measurements.get("include_boarding", True))
    components: list[LineComponent] = []

    materials = 0.0
    materials += _add_material(components, rates, "MAT-CDM-WALL-8", wall)
    materials += _add_material(components, rates, "MAT-CDM-FLOOR-20", floor)
    materials += _add_material(components, rates, "MAT-CDM-FIXINGS", wall * 11)
    if include_battens:
        materials += _add_material(components, rates, "MAT-BATTEN-25", wall * 2.5)
    if include_boarding:
        materials += _add_material(components, rates, "MAT-BOARD-12.5", wall)
    materials += _add_material(components, rates, "MAT-DRAIN-CHANNEL", channel)

    labour = 0.0
    labour += _add_labour(components, rates, "LAB-MEMBRANE-M2", wall + floor)
    if include_boarding:
        labour += _add_labour(components, rates, "LAB-BOARD-M2", wall)

    cost = round_money(materials + labour)
    return WorkLineResult(
        work_type="cavity_drain",
        label="Cavity Drain Membrane Systems",
        description=(
            f"Cavity drain membrane to {wall:.1f} m² walls and {floor:.1f} m² floor"
            + (f", including {channel:.1f} lm drainage channel." if channel else ".")
        ),
        materials_cost=round_money(materials),
        labour_cost=round_money(labour),
        line_cost=cost,
        target_margin_percent=margin,
        line_sell=sell_from_margin(cost, margin),
        components=components,
        measurements=measurements,
    )


def price_sump(
    measurements: dict[str, Any],
    rates: dict[str, dict[str, Any]],
    margin: float,
) -> WorkLineResult:
    package_code = measurements.get("package") or "PKG-SUMP-STD"
    addons = list(measurements.get("addons") or [])
    components: list[LineComponent] = []
    materials = 0.0
    labour = 0.0

    package = rates.get(package_code)
    if package:
        materials += round_money(float(package["cost_per_unit"]))
        components.append(
            LineComponent(
                code=package_code,
                name=package["name"],
                quantity=1,
                unit="package",
                unit_cost=float(package["cost_per_unit"]),
                total=round_money(float(package["cost_per_unit"])),
                kind="materials",
            )
        )
        meta = package.get("meta") or {}
        if isinstance(meta, str):
            meta = json.loads(meta or "{}")
        labour_code = meta.get("labour_code")
        if labour_code:
            labour += _add_labour(components, rates, labour_code, 1)
        labour += round_money(float(meta.get("labour_extra_cost") or 0))

    for addon_code in addons:
        addon = rates.get(addon_code)
        if not addon:
            continue
        materials += round_money(float(addon["cost_per_unit"]))
        components.append(
            LineComponent(
                code=addon_code,
                name=addon["name"],
                quantity=1,
                unit="package",
                unit_cost=float(addon["cost_per_unit"]),
                total=round_money(float(addon["cost_per_unit"])),
                kind="materials",
            )
        )
        meta = addon.get("meta") or {}
        if isinstance(meta, str):
            meta = json.loads(meta or "{}")
        labour += round_money(float(meta.get("labour_extra_cost") or 0))
        if meta.get("labour_extra_cost"):
            components.append(
                LineComponent(
                    code=f"{addon_code}-LAB",
                    name=f"{addon['name']} labour",
                    quantity=1,
                    unit="package",
                    unit_cost=float(meta.get("labour_extra_cost") or 0),
                    total=round_money(float(meta.get("labour_extra_cost") or 0)),
                    kind="labour",
                )
            )

    cost = round_money(materials + labour)
    return WorkLineResult(
        work_type="sump_pump",
        label="Sump & Pump Installations",
        description=package["name"] if package else "Sump & pump package",
        materials_cost=round_money(materials),
        labour_cost=round_money(labour),
        line_cost=cost,
        target_margin_percent=margin,
        line_sell=sell_from_margin(cost, margin),
        components=components,
        measurements=measurements,
    )


def price_timber(
    measurements: dict[str, Any],
    rates: dict[str, dict[str, Any]],
    margin: float,
) -> WorkLineResult:
    area = float(measurements.get("treatment_area_m2") or 0)
    joists = float(measurements.get("joist_repairs") or 0)
    floor = float(measurements.get("floor_renewal_m2") or 0)
    components: list[LineComponent] = []

    materials = 0.0
    materials += _add_material(components, rates, "MAT-TIMBER-FLUID", area * 0.25)
    materials += _add_material(components, rates, "MAT-JOIST-C24", joists * 2.4)
    materials += _add_material(components, rates, "MAT-FLOORBOARD", floor)

    labour = 0.0
    labour += _add_labour(components, rates, "LAB-TIMBER-M2", area)
    labour += _add_labour(components, rates, "LAB-JOIST-EA", joists)

    cost = round_money(materials + labour)
    return WorkLineResult(
        work_type="timber_treatment",
        label="Timber Treatment",
        description=(
            f"Timber treatment to {area:.1f} m²"
            + (f", {int(joists)} joist repair(s)" if joists else "")
            + (f", {floor:.1f} m² floor renewal" if floor else "")
            + "."
        ),
        materials_cost=round_money(materials),
        labour_cost=round_money(labour),
        line_cost=cost,
        target_margin_percent=margin,
        line_sell=sell_from_margin(cost, margin),
        components=components,
        measurements=measurements,
    )


def price_ventilation(
    measurements: dict[str, Any],
    rates: dict[str, dict[str, Any]],
    margin: float,
) -> WorkLineResult:
    items = list(measurements.get("items") or [])
    components: list[LineComponent] = []
    materials = 0.0
    labour = 0.0
    names: list[str] = []

    for item in items:
        code = item.get("code")
        qty = float(item.get("quantity") or 0)
        if not code or qty <= 0:
            continue
        materials += _add_material(components, rates, code, qty)
        materials += _add_material(components, rates, "MAT-VENT-DUCT", qty)
        if item.get("install", True):
            labour += _add_labour(components, rates, "LAB-VENT-INSTALL", qty)
        rate = rates.get(code)
        if rate:
            names.append(f"{int(qty)} × {rate['name']}")

    cost = round_money(materials + labour)
    return WorkLineResult(
        work_type="ventilation",
        label="Condensation & Ventilation",
        description=", ".join(names) if names else "Ventilation works",
        materials_cost=round_money(materials),
        labour_cost=round_money(labour),
        line_cost=cost,
        target_margin_percent=margin,
        line_sell=sell_from_margin(cost, margin),
        components=components,
        measurements=measurements,
    )


PRICERS = {
    "dpc_replastering": price_dpc,
    "cavity_drain": price_cavity_drain,
    "sump_pump": price_sump,
    "timber_treatment": price_timber,
    "ventilation": price_ventilation,
}


def _allocate_job_costs(
    lines: list[WorkLineResult],
    job_cost: float,
) -> list[float]:
    """Distribute waste/travel/prelim across lines by direct line cost weight."""
    if not lines:
        return []
    direct_total = sum(line.line_cost for line in lines)
    if job_cost <= 0:
        return [0.0 for _ in lines]
    if direct_total <= 0:
        share = round_money(job_cost / len(lines))
        shares = [share for _ in lines]
        shares[-1] = round_money(job_cost - sum(shares[:-1]))
        return shares

    shares: list[float] = []
    allocated = 0.0
    for index, line in enumerate(lines):
        if index == len(lines) - 1:
            shares.append(round_money(job_cost - allocated))
        else:
            share = round_money(job_cost * (line.line_cost / direct_total))
            shares.append(share)
            allocated = round_money(allocated + share)
    return shares


def reconcile_line_sells(
    lines: list[WorkLineResult],
    target_sell: float,
) -> None:
    """Force line sells to sum exactly to the job sell (penny-perfect)."""
    if not lines:
        return
    target = round_money(target_sell)
    current = round_money(sum(line.line_sell for line in lines))
    if current <= 0:
        # Put entire sell on the first work line when lines have no sell yet
        for line in lines:
            line.line_sell = 0.0
        lines[0].line_sell = target
        return
    if abs(current - target) < 0.005:
        # Absorb any 1p drift on the last line
        drift = round_money(target - sum(line.line_sell for line in lines[:-1]))
        lines[-1].line_sell = drift
        return

    factor = target / current
    running = 0.0
    for index, line in enumerate(lines):
        if index == len(lines) - 1:
            line.line_sell = round_money(target - running)
        else:
            adjusted = round_money(line.line_sell * factor)
            line.line_sell = adjusted
            running = round_money(running + adjusted)


def validate_work_items(work_items: list[dict[str, Any]]) -> list[str]:
    """Return soft validation warnings for measurement / scope gaps."""
    warnings: list[str] = []
    if not work_items:
        warnings.append("No work types selected.")
        return warnings

    for item in work_items:
        work_type = item.get("work_type")
        measurements = item.get("measurements") or {}
        if isinstance(measurements, str):
            measurements = json.loads(measurements or "{}")
        if work_type not in PRICERS:
            warnings.append(f"Unknown work type skipped: {work_type}")
            continue
        if work_type == "dpc_replastering":
            if float(measurements.get("wall_length_lm") or 0) <= 0:
                warnings.append("DPC: wall length should be greater than zero.")
            if float(measurements.get("replaster_height_m") or 0) <= 0:
                warnings.append("DPC: replaster height should be greater than zero.")
        elif work_type == "cavity_drain":
            if (
                float(measurements.get("wall_area_m2") or 0) <= 0
                and float(measurements.get("floor_area_m2") or 0) <= 0
            ):
                warnings.append("Cavity drain: enter wall and/or floor area.")
        elif work_type == "sump_pump":
            if not measurements.get("package"):
                warnings.append("Sump & pump: select a package.")
        elif work_type == "timber_treatment":
            if float(measurements.get("treatment_area_m2") or 0) <= 0:
                warnings.append("Timber: treatment area should be greater than zero.")
        elif work_type == "ventilation":
            items = list(measurements.get("items") or [])
            if not any(float(i.get("quantity") or 0) > 0 for i in items):
                warnings.append("Ventilation: add at least one unit with quantity.")
    return warnings


def calculate_estimate(
    *,
    work_items: list[dict[str, Any]],
    rates: list[dict[str, Any]],
    margins_by_type: dict[str, float],
    travel_band_code: str,
    waste_code: str,
    prelim_codes: list[str],
    minimum_job_value: float,
    override_sell_price: float | None = None,
) -> PricingResult:
    """
    Production pricing with job-level allowance allocation (Option A).

    Policy (assumed until Advanced Damp confirms):
    1. Price each work type on direct materials + labour.
    2. Allocate waste / travel / prelims across lines by direct cost weight.
    3. Apply each line's target margin to (direct + allocated job cost).
    4. Job sell = sum of line sells, then apply minimum job / override.
    5. Reconcile line sells so they always sum exactly to final sell.
    """
    rate_lookup = _rate_map(rates)
    for rate in rate_lookup.values():
        if "meta" not in rate and rate.get("meta_json"):
            rate["meta"] = json.loads(rate["meta_json"] or "{}")

    validation_warnings = validate_work_items(work_items)
    lines: list[WorkLineResult] = []

    for item in work_items:
        work_type = item["work_type"]
        pricer = PRICERS.get(work_type)
        if not pricer:
            continue
        margin = float(margins_by_type.get(work_type, 30.0))
        measurements = item.get("measurements") or {}
        if isinstance(measurements, str):
            measurements = json.loads(measurements or "{}")
        lines.append(pricer(measurements, rate_lookup, margin))

    materials_cost = round_money(sum(line.materials_cost for line in lines))
    labour_cost = round_money(sum(line.labour_cost for line in lines))

    waste_rate = rate_lookup.get(waste_code)
    waste_cost = round_money(float(waste_rate["cost_per_unit"])) if waste_rate else 0.0

    travel_rate = rate_lookup.get(travel_band_code)
    travel_cost = round_money(float(travel_rate["cost_per_unit"])) if travel_rate else 0.0

    prelim_cost = 0.0
    prelim_details = []
    for code in prelim_codes:
        rate = rate_lookup.get(code)
        if not rate:
            continue
        amount = round_money(float(rate["cost_per_unit"]))
        prelim_cost = round_money(prelim_cost + amount)
        prelim_details.append({"code": code, "name": rate["name"], "amount": amount})

    job_cost = round_money(waste_cost + travel_cost + prelim_cost)
    total_cost = round_money(materials_cost + labour_cost + job_cost)

    allocated_shares = _allocate_job_costs(lines, job_cost)
    allocated_by_index: list[float] = []
    fully_loaded_by_index: list[float] = []
    for line, share in zip(lines, allocated_shares):
        fully_loaded = round_money(line.line_cost + share)
        line.line_sell = sell_from_margin(fully_loaded, line.target_margin_percent)
        allocated_by_index.append(share)
        fully_loaded_by_index.append(fully_loaded)

    if lines:
        direct_total = sum(line.line_cost for line in lines)
        if direct_total > 0:
            weighted = sum(
                line.line_cost * line.target_margin_percent for line in lines
            )
            target_margin = round(weighted / direct_total, 2)
        else:
            target_margin = round(
                sum(line.target_margin_percent for line in lines) / len(lines),
                2,
            )
        calculated_sell = round_money(sum(line.line_sell for line in lines))
    else:
        target_margin = 30.0
        calculated_sell = sell_from_margin(total_cost, target_margin)

    sell = calculated_sell
    min_job_applied = False
    if sell < minimum_job_value and total_cost > 0:
        sell = round_money(minimum_job_value)
        min_job_applied = True

    if override_sell_price is not None and override_sell_price > 0:
        sell = round_money(override_sell_price)

    reconcile_line_sells(lines, sell)

    margin_value, margin_percent = margin_from_sell(total_cost, sell)
    below_target = margin_percent + 0.01 < target_margin

    used_rate_codes = sorted(
        {
            component.code
            for line in lines
            for component in line.components
        }
        | ({waste_code} if waste_rate else set())
        | ({travel_band_code} if travel_rate else set())
        | {d["code"] for d in prelim_details}
    )
    rate_snapshot = {
        code: {
            "name": rate_lookup[code]["name"],
            "cost_per_unit": float(rate_lookup[code]["cost_per_unit"]),
            "unit": rate_lookup[code].get("unit") or "",
            "category": rate_lookup[code].get("category") or "",
        }
        for code in used_rate_codes
        if code in rate_lookup
    }

    line_sell_sum = round_money(sum(line.line_sell for line in lines))
    breakdown = {
        "policy": "allocate_job_costs_by_direct_cost_weight",
        "materials_cost": materials_cost,
        "labour_cost": labour_cost,
        "job_level_cost": job_cost,
        "waste": {"code": waste_code, "amount": waste_cost},
        "travel": {"code": travel_band_code, "amount": travel_cost},
        "preliminaries": prelim_details,
        "validation_warnings": validation_warnings,
        "reconciliation": {
            "line_sell_sum": line_sell_sum,
            "job_sell": sell,
            "balanced": abs(line_sell_sum - sell) < 0.005,
        },
        "rate_snapshot": rate_snapshot,
        "lines": [
            {
                "work_type": line.work_type,
                "label": line.label,
                "description": line.description,
                "line_cost": line.line_cost,
                "allocated_job_cost": allocated_by_index[index],
                "fully_loaded_cost": fully_loaded_by_index[index],
                "line_sell": line.line_sell,
                "target_margin_percent": line.target_margin_percent,
                "components": [c.__dict__ for c in line.components],
            }
            for index, line in enumerate(lines)
        ],
    }

    return PricingResult(
        materials_cost=materials_cost,
        labour_cost=labour_cost,
        waste_cost=waste_cost,
        travel_cost=travel_cost,
        prelim_cost=prelim_cost,
        total_cost=total_cost,
        target_margin_percent=target_margin,
        calculated_sell_price=calculated_sell,
        sell_price=sell,
        margin_value=margin_value,
        margin_percent=margin_percent,
        min_job_applied=min_job_applied,
        below_target_margin=below_target,
        lines=lines,
        breakdown=breakdown,
    )
