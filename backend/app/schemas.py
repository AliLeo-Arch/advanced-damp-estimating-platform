from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str = ""
    environment: str = ""
    database_ok: bool = False


class RateItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    category: str
    unit: str
    cost_per_unit: float
    waste_percent: float
    notes: str
    active: int


class RateListResponse(BaseModel):
    items: list[RateItemRead]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PricingSettingsRead(BaseModel):
    minimum_job_value: float
    vat_rate: float
    quote_validity_days: int
    payment_terms: str
    margins_by_work_type: dict[str, float]
    min_permitted_margin_percent: float = 20.0
    survey_fee_default: float = 195.0


class EstimateItemInput(BaseModel):
    work_type: str
    measurements: dict[str, Any] = Field(default_factory=dict)
    sort_order: int = 0


class EstimateItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_type: str
    label: str
    sort_order: int
    measurements: dict[str, Any] = Field(default_factory=dict)
    description: str
    line_cost: float
    line_sell: float
    target_margin_percent: float


class EstimateCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=200)
    company_name: str = ""
    email: str = ""
    telephone: str = ""
    site_address: str = ""
    postcode: str = ""
    surveyor: str = ""
    survey_date: str = ""
    notes: str = ""
    customer_id: int | None = None
    site_id: int | None = None
    survey_id: int | None = None


class EstimateUpdate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=200)
    company_name: str = ""
    email: str = ""
    telephone: str = ""
    site_address: str = ""
    postcode: str = ""
    surveyor: str = ""
    survey_date: str = ""
    notes: str = ""
    status: str | None = None
    customer_id: int | None = None
    site_id: int | None = None
    survey_id: int | None = None
    travel_band_code: str = "TRV-LOCAL"
    waste_code: str = "WS-ALLOW-SMALL"
    prelim_codes: list[str] = Field(default_factory=lambda: ["PRE-STD"])
    items: list[EstimateItemInput] = Field(default_factory=list)
    override_sell_price: float | None = None
    override_reason: str = ""
    clear_override: bool = False


class EstimateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    revision_no: int = 1
    parent_estimate_id: int | None = None
    customer_id: int | None = None
    site_id: int | None = None
    survey_id: int | None = None
    customer_name: str
    company_name: str = ""
    email: str = ""
    telephone: str = ""
    site_address: str
    postcode: str
    surveyor: str
    survey_date: str = ""
    status: str
    notes: str
    travel_band_code: str = "TRV-LOCAL"
    waste_code: str = "WS-ALLOW-SMALL"
    prelim_codes: list[str] = Field(default_factory=list)
    materials_cost: float = 0.0
    labour_cost: float = 0.0
    waste_cost: float = 0.0
    travel_cost: float = 0.0
    prelim_cost: float = 0.0
    total_cost: float
    target_margin_percent: float = 0.0
    calculated_sell_price: float = 0.0
    sell_price: float
    override_sell_price: float | None = None
    override_reason: str = ""
    margin_value: float
    margin_percent: float
    min_job_applied: bool = False
    below_target_margin: bool = False
    approved_by_user_id: int | None = None
    approved_at: str | None = None
    approval_notes: str = ""
    breakdown: dict[str, Any] = Field(default_factory=dict)
    items: list[EstimateItemRead] = Field(default_factory=list)


class EstimateListResponse(BaseModel):
    items: list[EstimateRead]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class EstimateTransitionRequest(BaseModel):
    status: str
    notes: str = ""


class EstimateApproveRequest(BaseModel):
    notes: str = ""


class ActualsUpdate(BaseModel):
    materials_actual: float = Field(default=0.0, ge=0)
    labour_actual: float = Field(default=0.0, ge=0)
    waste_actual: float = Field(default=0.0, ge=0)
    travel_actual: float = Field(default=0.0, ge=0)
    prelims_actual: float = Field(default=0.0, ge=0)
    other_actual: float = Field(default=0.0, ge=0)
    revenue_actual: float | None = Field(default=None, ge=0)
    notes: str = ""


class ActualsRead(BaseModel):
    estimate_id: int
    materials_actual: float
    labour_actual: float
    waste_actual: float
    travel_actual: float
    prelims_actual: float
    other_actual: float
    revenue_actual: float | None
    notes: str
    comparison: dict[str, Any]


class QuotationRead(BaseModel):
    estimate: EstimateRead
    company_name: str
    company_phone: str
    company_email: str
    company_address: str
    vat_rate: float
    vat_amount: float
    total_inc_vat: float
    validity_days: int
    issue_date: str = ""
    valid_until: str = ""
    payment_terms: str
    assumptions: list[str]
    exclusions: list[str]
    guarantee_wording: str = ""
    survey_fee_credit_wording: str = ""
    acceptance_instructions: str = ""
    scope_lines: list[dict[str, Any]]
    lines_reconciled: bool = True
    line_amount_sum: float = 0.0
    revision_no: int = 1
