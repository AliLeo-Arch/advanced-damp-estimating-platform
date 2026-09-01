import { getToken } from "./auth";
import { apiUrl } from "./config";

export type EstimateItem = {
  id: number;
  work_type: string;
  label: string;
  sort_order: number;
  measurements: Record<string, unknown>;
  description: string;
  line_cost: number;
  line_sell: number;
  target_margin_percent: number;
};

export type Estimate = {
  id: number;
  reference: string;
  revision_no?: number;
  parent_estimate_id?: number | null;
  customer_id?: number | null;
  site_id?: number | null;
  survey_id?: number | null;
  customer_name: string;
  company_name: string;
  email: string;
  telephone: string;
  site_address: string;
  postcode: string;
  surveyor: string;
  survey_date: string;
  status: string;
  notes: string;
  travel_band_code: string;
  waste_code: string;
  prelim_codes: string[];
  materials_cost: number;
  labour_cost: number;
  waste_cost: number;
  travel_cost: number;
  prelim_cost: number;
  total_cost: number;
  target_margin_percent: number;
  calculated_sell_price: number;
  sell_price: number;
  override_sell_price: number | null;
  override_reason?: string;
  margin_value: number;
  margin_percent: number;
  min_job_applied: boolean;
  below_target_margin: boolean;
  approved_by_user_id?: number | null;
  approved_at?: string | null;
  approval_notes?: string;
  breakdown: Record<string, unknown>;
  items: EstimateItem[];
};

export type EstimatePayload = {
  customer_name: string;
  company_name?: string;
  email?: string;
  telephone?: string;
  site_address?: string;
  postcode?: string;
  surveyor?: string;
  survey_date?: string;
  notes?: string;
  status?: string;
  customer_id?: number | null;
  site_id?: number | null;
  survey_id?: number | null;
  travel_band_code?: string;
  waste_code?: string;
  prelim_codes?: string[];
  items?: Array<{
    work_type: string;
    measurements: Record<string, unknown>;
    sort_order?: number;
  }>;
  override_sell_price?: number | null;
  override_reason?: string;
  clear_override?: boolean;
};

export type RateItem = {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  waste_percent: number;
  notes: string;
  active: number;
};

export type PricingSettings = {
  minimum_job_value: number;
  vat_rate: number;
  quote_validity_days: number;
  payment_terms: string;
  margins_by_work_type: Record<string, number>;
  min_permitted_margin_percent?: number;
  survey_fee_default?: number;
};

export type Quotation = {
  estimate: Estimate;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  vat_rate: number;
  vat_amount: number;
  total_inc_vat: number;
  validity_days: number;
  issue_date?: string;
  valid_until?: string;
  payment_terms: string;
  assumptions: string[];
  exclusions: string[];
  guarantee_wording?: string;
  survey_fee_credit_wording?: string;
  acceptance_instructions?: string;
  scope_lines: Array<{ label: string; description: string; amount: number }>;
  lines_reconciled?: boolean;
  line_amount_sum?: number;
  revision_no?: number;
};

export type WorkType = { code: string; label: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export type Customer = {
  id: number;
  customer_type: string;
  name: string;
  company_name: string;
  email: string;
  telephone: string;
  notes: string;
};

export type Site = {
  id: number;
  customer_id: number;
  label: string;
  address_line1: string;
  address_line2: string;
  town: string;
  postcode: string;
  property_type: string;
  access_notes: string;
};

export type Survey = {
  id: number;
  site_id: number;
  reference: string;
  survey_type: string;
  survey_date: string;
  surveyor_name: string;
  status: string;
  diagnosis_summary: string;
  recommended_works: string;
  survey_fee: number;
  fee_creditable: boolean;
  notes: string;
};

export type SurveyDetail = Survey & {
  customer_id: number;
  customer_name: string;
  company_name: string;
  email: string;
  telephone: string;
  site_label: string;
  site_address: string;
  postcode: string;
};

export function listCustomers() {
  return request<Customer[]>("/api/customers");
}

export function createCustomer(payload: {
  customer_type?: string;
  name: string;
  company_name?: string;
  email?: string;
  telephone?: string;
  notes?: string;
}) {
  return request<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listSites(customerId: number) {
  return request<Site[]>(`/api/customers/${customerId}/sites`);
}

export function createSite(
  customerId: number,
  payload: {
    label?: string;
    address_line1: string;
    address_line2?: string;
    town?: string;
    postcode?: string;
    property_type?: string;
    access_notes?: string;
  },
) {
  return request<Site>(`/api/customers/${customerId}/sites`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listSurveys(siteId: number) {
  return request<Survey[]>(`/api/sites/${siteId}/surveys`);
}

export function getSurvey(surveyId: number) {
  return request<SurveyDetail>(`/api/surveys/${surveyId}`);
}

export function createSurvey(
  siteId: number,
  payload: {
    survey_type?: string;
    survey_date?: string;
    surveyor_name?: string;
    diagnosis_summary?: string;
    recommended_works?: string;
    notes?: string;
  },
) {
  return request<Survey>(`/api/sites/${siteId}/surveys`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listEstimates(filters: EstimateSearchFilters = {}) {
  return searchEstimates(filters);
}

export type EstimateSort =
  | "created_at_desc"
  | "created_at_asc"
  | "sell_price_desc"
  | "sell_price_asc"
  | "reference_asc"
  | "reference_desc"
  | "customer_asc"
  | "customer_desc";

export type EstimateSearchFilters = {
  q?: string;
  status?: string[];
  surveyor?: string;
  survey_from?: string;
  survey_to?: string;
  sell_min?: number;
  sell_max?: number;
  sort?: EstimateSort;
  page?: number;
  page_size?: number;
};

export type EstimateListResponse = {
  items: Estimate[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

function appendEstimateSearchParams(
  params: URLSearchParams,
  filters: EstimateSearchFilters,
) {
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.status?.length) {
    for (const value of filters.status) {
      params.append("status", value);
    }
  }
  if (filters.surveyor?.trim()) params.set("surveyor", filters.surveyor.trim());
  if (filters.survey_from) params.set("survey_from", filters.survey_from);
  if (filters.survey_to) params.set("survey_to", filters.survey_to);
  if (filters.sell_min != null && !Number.isNaN(filters.sell_min)) {
    params.set("sell_min", String(filters.sell_min));
  }
  if (filters.sell_max != null && !Number.isNaN(filters.sell_max)) {
    params.set("sell_max", String(filters.sell_max));
  }
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.page_size != null) params.set("page_size", String(filters.page_size));
}

export function searchEstimates(filters: EstimateSearchFilters = {}) {
  const params = new URLSearchParams();
  appendEstimateSearchParams(params, filters);
  const qs = params.toString();
  return request<EstimateListResponse>(`/api/estimates/${qs ? `?${qs}` : ""}`);
}

export function getEstimate(id: number) {
  return request<Estimate>(`/api/estimates/${id}`);
}

export function createEstimate(payload: EstimatePayload) {
  return request<Estimate>("/api/estimates/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEstimate(id: number, payload: EstimatePayload) {
  return request<Estimate>(`/api/estimates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function approveEstimate(id: number, notes = "") {
  return request<Estimate>(`/api/estimates/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export function transitionEstimate(id: number, status: string, notes = "") {
  return request<Estimate>(`/api/estimates/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ status, notes }),
  });
}

export function reviseEstimate(id: number) {
  return request<Estimate>(`/api/estimates/${id}/revisions`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type ActualsComparisonRow = {
  label: string;
  estimated: number;
  actual: number;
  variance: number;
};

export type JobActuals = {
  estimate_id: number;
  materials_actual: number;
  labour_actual: number;
  waste_actual: number;
  travel_actual: number;
  prelims_actual: number;
  other_actual: number;
  revenue_actual: number | null;
  notes: string;
  comparison: {
    materials: ActualsComparisonRow;
    labour: ActualsComparisonRow;
    waste: ActualsComparisonRow;
    travel: ActualsComparisonRow;
    prelims: ActualsComparisonRow;
    other: ActualsComparisonRow;
    total_cost: ActualsComparisonRow;
    revenue: ActualsComparisonRow;
    margin_value: ActualsComparisonRow;
    margin_percent: ActualsComparisonRow;
    estimated_margin_percent: number;
    actual_margin_percent: number;
    margin_percent_variance: number;
  };
};

export function getJobActuals(estimateId: number) {
  return request<JobActuals>(`/api/estimates/${estimateId}/actuals`);
}

export function updateJobActuals(
  estimateId: number,
  payload: {
    materials_actual?: number;
    labour_actual?: number;
    waste_actual?: number;
    travel_actual?: number;
    prelims_actual?: number;
    other_actual?: number;
    revenue_actual?: number | null;
    notes?: string;
  },
) {
  return request<JobActuals>(`/api/estimates/${estimateId}/actuals`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listWorkTypes() {
  return request<WorkType[]>("/api/estimates/work-types");
}

export type RateSort =
  | "code_asc"
  | "code_desc"
  | "name_asc"
  | "name_desc"
  | "category_asc"
  | "category_desc"
  | "cost_asc"
  | "cost_desc";

export type RateSearchFilters = {
  q?: string;
  category?: string;
  include_inactive?: boolean;
  sort?: RateSort;
  page?: number;
  page_size?: number;
};

export type RateListResponse = {
  items: RateItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

function appendRateSearchParams(
  params: URLSearchParams,
  filters: RateSearchFilters,
) {
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.include_inactive) params.set("include_inactive", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.page_size != null) params.set("page_size", String(filters.page_size));
}

export function searchRates(filters: RateSearchFilters = {}) {
  const params = new URLSearchParams();
  appendRateSearchParams(params, filters);
  const qs = params.toString();
  return request<RateListResponse>(`/api/rates/${qs ? `?${qs}` : ""}`);
}

export async function listRates(category?: string, includeInactive = false) {
  const items: RateItem[] = [];
  const page_size = 200;
  let page = 1;

  while (true) {
    const result = await searchRates({
      category: category || undefined,
      include_inactive: includeInactive,
      page,
      page_size,
      sort: "category_asc",
    });
    items.push(...result.items);
    if (!result.has_next) break;
    page += 1;
  }

  return items;
}

export function listRateCategories() {
  return request<{ categories: string[] }>("/api/rates/categories").then(
    (res) => res.categories,
  );
}

export function createRate(payload: {
  code: string;
  name: string;
  category: string;
  unit?: string;
  cost_per_unit: number;
  waste_percent?: number;
  notes?: string;
  active?: boolean;
}) {
  return request<RateItem>("/api/rates/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRate(
  id: number,
  payload: {
    name?: string;
    category?: string;
    unit?: string;
    cost_per_unit?: number;
    waste_percent?: number;
    notes?: string;
    active?: boolean;
  },
) {
  return request<RateItem>(`/api/rates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getPricingSettings() {
  return request<PricingSettings>("/api/rates/settings");
}

export function updatePricingSettings(payload: {
  minimum_job_value?: number;
  vat_rate?: number;
  quote_validity_days?: number;
  payment_terms?: string;
  margins_by_work_type?: Record<string, number>;
  min_permitted_margin_percent?: number;
  survey_fee_default?: number;
}) {
  return request<PricingSettings>("/api/rates/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getQuotation(id: number) {
  return request<Quotation>(`/api/estimates/${id}/quotation`);
}

export function quotationPdfUrl(id: number) {
  const token = getToken();
  const q = token ? `?access_token=${encodeURIComponent(token)}` : "";
  return apiUrl(`/api/estimates/${id}/quotation.pdf${q}`);
}

function estimateDownloadUrl(id: number, suffix: string) {
  const token = getToken();
  const q = token ? `?access_token=${encodeURIComponent(token)}` : "";
  return apiUrl(`/api/estimates/${id}/${suffix}${q}`);
}

export function estimateCsvUrl(id: number) {
  return estimateDownloadUrl(id, "export.csv");
}

export function estimateXlsxUrl(id: number) {
  return estimateDownloadUrl(id, "export.xlsx");
}

export function estimatesListCsvUrl(filters: EstimateSearchFilters = {}) {
  const params = new URLSearchParams();
  appendEstimateSearchParams(params, filters);
  const token = getToken();
  if (token) params.set("access_token", token);
  const qs = params.toString();
  return apiUrl(`/api/estimates/export/list.csv${qs ? `?${qs}` : ""}`);
}

export type HealthResponse = {
  status: string;
  app: string;
  version?: string;
  environment?: string;
  database_ok?: boolean;
};

export type BackupRow = {
  filename: string;
  size_bytes: number;
  created_at: string;
};

export type SystemInfo = {
  app: string;
  environment: string;
  version: string;
  database_ok: boolean;
  backup_count: number;
};

export function getHealth() {
  return request<HealthResponse>("/health");
}

export function listBackups() {
  return request<{ backups: BackupRow[] }>("/api/admin/backups").then(
    (data) => data.backups,
  );
}

export function createBackup() {
  return request<BackupRow & { path: string }>("/api/admin/backups", {
    method: "POST",
  });
}

export function restoreBackup(filename: string) {
  return request<{
    restored_from: string;
    database: string;
    pre_restore_backup: string | null;
  }>("/api/admin/backups/restore", {
    method: "POST",
    body: JSON.stringify({ filename }),
  });
}

export function getSystemInfo() {
  return request<SystemInfo>("/api/admin/system");
}

export async function downloadBackup(filename: string) {
  const token = getToken();
  const response = await fetch(
    apiUrl(`/api/admin/backups/${encodeURIComponent(filename)}/download`),
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value || 0);
}
