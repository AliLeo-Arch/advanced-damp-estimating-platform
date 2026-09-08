from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str = ""
    environment: str = ""
    database_ok: bool = False
    demo_helpers: bool = False


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
    effective_date: str = ""


class RateVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rate_item_id: int
    previous_cost: float
    new_cost: float
    effective_date: str
    reason: str
    changed_by_name: str
    created_at: str


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
    company_display_name: str = ""
    company_phone: str = ""
    company_email: str = ""
    company_address: str = ""
    company_website: str = ""
    company_tagline: str = ""
    quote_prefix: str = "EST"


class CompanyProfileRead(BaseModel):
    name: str
    phone: str
    email: str
    address: str
    website: str
    tagline: str
    quote_prefix: str
    app_name: str = ""


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
    quote_issued_at: str | None = None
    quote_valid_until: str | None = None
    accepted_at: str | None = None
    accepted_by_name: str = ""
    acceptance_method: str = ""
    acceptance_po_reference: str = ""
    acceptance_notes: str = ""
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
    accepted_by_name: str = ""
    acceptance_method: str = ""
    acceptance_po_reference: str = ""
    acceptance_notes: str = ""


class EstimateApproveRequest(BaseModel):
    notes: str = ""


class ActualsUpdate(BaseModel):
    materials_actual: float | None = Field(default=None, ge=0)
    labour_actual: float | None = Field(default=None, ge=0)
    waste_actual: float | None = Field(default=None, ge=0)
    travel_actual: float | None = Field(default=None, ge=0)
    prelims_actual: float | None = Field(default=None, ge=0)
    other_actual: float | None = Field(default=None, ge=0)
    revenue_actual: float | None = Field(default=None, ge=0)
    notes: str = ""


class ActualEntryCreate(BaseModel):
    category: str
    description: str = Field(default="", max_length=300)
    amount: float = Field(ge=0)
    occurred_on: str = Field(default="", max_length=20)
    supplier_ref: str = Field(default="", max_length=120)


class ActualEntryUpdate(BaseModel):
    description: str | None = Field(default=None, max_length=300)
    amount: float | None = Field(default=None, ge=0)
    occurred_on: str | None = Field(default=None, max_length=20)
    supplier_ref: str | None = Field(default=None, max_length=120)


class ActualEntryRead(BaseModel):
    id: int
    estimate_id: int
    category: str
    description: str
    amount: float
    occurred_on: str = ""
    supplier_ref: str = ""
    sort_order: int = 0


class ActualsRead(BaseModel):
    estimate_id: int
    materials_actual: float | None
    labour_actual: float | None
    waste_actual: float | None
    travel_actual: float | None
    prelims_actual: float | None
    other_actual: float | None
    revenue_actual: float | None
    notes: str
    status: str = "not_started"
    categories_entered: int = 0
    categories_total: int = 6
    entries: list[ActualEntryRead] = []
    entry_driven_categories: list[str] = []
    comparison: dict[str, Any]


class ActualsSummaryItem(BaseModel):
    estimate_id: int
    reference: str
    customer_name: str
    status: str
    estimated_cost: float
    actual_cost: float
    cost_variance: float
    estimated_revenue: float
    actual_revenue: float
    estimated_margin_percent: float
    actual_margin_percent: float
    margin_percent_variance: float


class ActualsSummaryResponse(BaseModel):
    items: list[ActualsSummaryItem]
    count: int
    total_estimated_cost: float
    total_actual_cost: float
    total_cost_variance: float
    average_estimated_margin_percent: float
    average_actual_margin_percent: float


class QuotationRead(BaseModel):
    estimate: EstimateRead
    company_name: str
    company_phone: str
    company_email: str
    company_address: str
    company_website: str = ""
    company_tagline: str = ""
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
