import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { PanelSkeleton } from "../components/Loading";
import {
  createRate,
  formatMoney,
  getPricingSettings,
  listRateCategories,
  PricingSettings,
  RateItem,
  RateSort,
  searchRates,
  updatePricingSettings,
  updateRate,
} from "../api";
import { getStoredUser } from "../auth";

const WORK_TYPE_LABELS: Record<string, string> = {
  dpc_replastering: "Chemical DPC & replastering",
  cavity_drain: "Cavity drain membrane",
  sump_pump: "Sump & pump",
  timber_treatment: "Timber treatment",
  ventilation: "Condensation & ventilation",
};

const FALLBACK_CATEGORIES = [
  "materials",
  "labour",
  "travel",
  "waste_skip",
  "preliminaries",
  "sump_package",
  "dpc_replastering",
  "cavity_drain",
  "timber_treatment",
  "ventilation",
];

const SORT_OPTIONS: Array<{ value: RateSort; label: string }> = [
  { value: "category_asc", label: "Category A–Z" },
  { value: "code_asc", label: "Code A–Z" },
  { value: "code_desc", label: "Code Z–A" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "cost_asc", label: "Lowest cost" },
  { value: "cost_desc", label: "Highest cost" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatCategory(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function RatesPage() {
  const user = getStoredUser();
  const canManageRates = Boolean(user?.permissions?.includes("manage_rates"));
  const canManageSettings = Boolean(
    user?.permissions?.includes("manage_settings"),
  );

  const [rates, setRates] = useState<RateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sort, setSort] = useState<RateSort>("category_asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(() => {
    const merged = new Set([...FALLBACK_CATEGORIES, ...categories]);
    return Array.from(merged).sort();
  }, [categories]);

  async function refresh() {
    const [result, cats, pricing] = await Promise.all([
      searchRates({
        q: searchQ || undefined,
        category: filterCategory || undefined,
        include_inactive: showInactive,
        sort,
        page,
        page_size: pageSize,
      }),
      listRateCategories(),
      getPricingSettings(),
    ]);
    setRates(result.items);
    setTotal(result.total);
    setPage(result.page);
    setPageSize(result.page_size);
    setTotalPages(result.total_pages);
    setHasNext(result.has_next);
    setHasPrev(result.has_prev);
    setCategories(cats);
    setSettings(pricing);
  }

  useEffect(() => {
    if ((draftQ || "") === (searchQ || "")) return;
    const timer = window.setTimeout(() => {
      setSearchQ(draftQ.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftQ, searchQ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void refresh()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load rates");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQ, filterCategory, showInactive, sort, page, pageSize]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);
  const hasFilters = Boolean(searchQ || filterCategory || showInactive);

  function resetFilters() {
    setDraftQ("");
    setSearchQ("");
    setFilterCategory("");
    setShowInactive(false);
    setSort("category_asc");
    setPage(1);
  }

  async function onCreateRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageRates) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await createRate({
        code: String(form.get("code") || ""),
        name: String(form.get("name") || ""),
        category: String(form.get("category") || ""),
        unit: String(form.get("unit") || "each"),
        cost_per_unit: Number(form.get("cost_per_unit") || 0),
        waste_percent: Number(form.get("waste_percent") || 0),
        notes: String(form.get("notes") || ""),
      });
      event.currentTarget.reset();
      setMessage("Rate created.");
      setShowAddForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create rate");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveRate(event: FormEvent<HTMLFormElement>, rate: RateItem) {
    event.preventDefault();
    if (!canManageRates) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await updateRate(rate.id, {
        name: String(form.get("name") || rate.name),
        category: String(form.get("category") || rate.category),
        unit: String(form.get("unit") || rate.unit),
        cost_per_unit: Number(form.get("cost_per_unit") || 0),
        waste_percent: Number(form.get("waste_percent") || 0),
        notes: String(form.get("notes") || ""),
        active: form.get("active") === "on",
      });
      setEditingId(null);
      setMessage(`Updated ${rate.code}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update rate");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rate: RateItem) {
    if (!canManageRates) return;
    setError(null);
    setMessage(null);
    try {
      await updateRate(rate.id, { active: !rate.active });
      setMessage(
        rate.active ? `Deactivated ${rate.code}.` : `Reactivated ${rate.code}.`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update rate");
    }
  }

  async function onSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageSettings || !settings) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const margins: Record<string, number> = {};
    for (const key of Object.keys(WORK_TYPE_LABELS)) {
      margins[key] = Number(form.get(`margin_${key}`) || 0);
    }
    try {
      const updated = await updatePricingSettings({
        minimum_job_value: Number(form.get("minimum_job_value") || 0),
        vat_rate: Number(form.get("vat_rate") || 0) / 100,
        quote_validity_days: Number(form.get("quote_validity_days") || 30),
        payment_terms: String(form.get("payment_terms") || ""),
        min_permitted_margin_percent: Number(
          form.get("min_permitted_margin_percent") || 20,
        ),
        survey_fee_default: Number(form.get("survey_fee_default") || 195),
        margins_by_work_type: margins,
      });
      setSettings(updated);
      setMessage("Commercial settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!canManageRates && !canManageSettings) {
    return (
      <section className="stack">
        <div className="page-header">
          <h1 className="page-title">Rates &amp; commercial settings</h1>
          <p className="page-lead">
            Only owner and admin users can manage rates and pricing settings.
          </p>
        </div>
        <div className="error-banner">You do not have permission to view this page.</div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="stack" aria-busy="true" aria-live="polite">
        <div className="page-header">
          <h1 className="page-title">Rates &amp; commercial settings</h1>
          <p className="page-lead">Loading commercial rates and settings…</p>
        </div>
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={8} />
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="page-header">
        <h1 className="page-title">Rates &amp; commercial settings</h1>
        <p className="page-lead">
          Maintain cost rates, target margins, and minimum job policy. Values are
          assumed UK commercial placeholders until Advanced Damp replaces them.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      {canManageSettings && settings ? (
        <form className="panel stack" onSubmit={onSaveSettings}>
          <h2 className="panel-title">Commercial settings</h2>
          <div className="row">
            <div className="field">
              <label htmlFor="minimum_job_value">Minimum job value (£)</label>
              <input
                id="minimum_job_value"
                name="minimum_job_value"
                type="number"
                min={0}
                step="1"
                defaultValue={settings.minimum_job_value}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="min_permitted_margin_percent">
                Min permitted margin (%)
              </label>
              <input
                id="min_permitted_margin_percent"
                name="min_permitted_margin_percent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                defaultValue={settings.min_permitted_margin_percent ?? 20}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="vat_rate">VAT rate (%)</label>
              <input
                id="vat_rate"
                name="vat_rate"
                type="number"
                min={0}
                max={100}
                step="0.1"
                defaultValue={(settings.vat_rate * 100).toFixed(1)}
                required
              />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="quote_validity_days">Quote validity (days)</label>
              <input
                id="quote_validity_days"
                name="quote_validity_days"
                type="number"
                min={1}
                defaultValue={settings.quote_validity_days}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="survey_fee_default">Default survey fee (£)</label>
              <input
                id="survey_fee_default"
                name="survey_fee_default"
                type="number"
                min={0}
                step="1"
                defaultValue={settings.survey_fee_default ?? 195}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="payment_terms">Payment terms</label>
            <textarea
              id="payment_terms"
              name="payment_terms"
              rows={2}
              defaultValue={settings.payment_terms}
            />
          </div>
          <h3 className="panel-title">Target margins by work type (%)</h3>
          <div className="row">
            {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={`margin_${key}`}>{label}</label>
                <input
                  id={`margin_${key}`}
                  name={`margin_${key}`}
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  defaultValue={settings.margins_by_work_type[key] ?? 30}
                  required
                />
              </div>
            ))}
          </div>
          <div className="step-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      ) : null}

      {canManageRates ? (
        <>
          <div className="panel stack rate-table-panel">
            <div className="rate-table-header">
              <div>
                <h2 className="panel-title" style={{ margin: 0 }}>
                  Rate table
                </h2>
                <p className="muted rate-table-lead">
                  {total} rate{total === 1 ? "" : "s"} across{" "}
                  {categoryOptions.length} categories
                </p>
              </div>
              <div className="rate-table-header-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setShowAddForm((open) => !open)}
                >
                  {showAddForm ? "Hide add form" : "Add rate"}
                </button>
                {hasFilters ? (
                  <button className="btn btn-secondary" type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            {showAddForm ? (
              <form className="rate-add-form stack" onSubmit={onCreateRate}>
                <h3 className="rate-add-title">New rate</h3>
                <div className="row">
                  <div className="field">
                    <label htmlFor="code">Code</label>
                    <input id="code" name="code" required placeholder="MAT-EXAMPLE" />
                  </div>
                  <div className="field">
                    <label htmlFor="name">Name</label>
                    <input id="name" name="name" required />
                  </div>
                  <div className="field">
                    <label htmlFor="category">Category</label>
                    <input
                      id="category"
                      name="category"
                      list="rate-categories"
                      required
                      placeholder="materials"
                    />
                    <datalist id="rate-categories">
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label htmlFor="unit">Unit</label>
                    <input id="unit" name="unit" defaultValue="each" />
                  </div>
                  <div className="field">
                    <label htmlFor="cost_per_unit">Cost per unit (£)</label>
                    <input
                      id="cost_per_unit"
                      name="cost_per_unit"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="waste_percent">Waste %</label>
                    <input
                      id="waste_percent"
                      name="waste_percent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      defaultValue={0}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="notes">Notes</label>
                  <input id="notes" name="notes" />
                </div>
                <div className="step-actions">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    Add rate
                  </button>
                </div>
              </form>
            ) : null}

            <div className="rate-table-toolbar row row-align-end">
              <div className="field rate-search-field">
                <label htmlFor="rate-search-q">Search rates</label>
                <input
                  id="rate-search-q"
                  type="search"
                  placeholder="Code, name, category, unit, notes…"
                  value={draftQ}
                  onChange={(event) => setDraftQ(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="filter_category">Category</label>
                <select
                  id="filter_category"
                  value={filterCategory}
                  onChange={(event) => {
                    setFilterCategory(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategory(cat)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rate-sort">Sort by</label>
                <select
                  id="rate-sort"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as RateSort);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rate-page-size">Per page</label>
                <select
                  id="rate-page-size"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <label className="check-line rate-inactive-toggle">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => {
                    setShowInactive(event.target.checked);
                    setPage(1);
                  }}
                />
                Show inactive
              </label>
            </div>

            <div className="rate-results-bar">
              <p className="muted rate-results-summary">
                {total === 0
                  ? "No rates match the current filters."
                  : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
              </p>
              {totalPages > 1 ? (
                <div className="pagination" aria-label="Rate pagination">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={!hasPrev}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </button>
                  <span className="pagination-status">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={!hasNext}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rate-table-wrap">
              <table className="rate-table">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Unit</th>
                    <th scope="col" className="is-num">
                      Cost
                    </th>
                    <th scope="col" className="is-num">
                      Waste
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col" className="is-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <Fragment key={rate.id}>
                      <tr
                        className={`${!rate.active ? "is-inactive" : ""}${
                          editingId === rate.id ? " is-editing" : ""
                        }`}
                      >
                        <td>
                          <code className="rate-code">{rate.code}</code>
                        </td>
                        <td>
                          <div className="rate-name">{rate.name}</div>
                          {rate.notes ? (
                            <div className="rate-notes muted">{rate.notes}</div>
                          ) : null}
                        </td>
                        <td>
                          <span className="rate-category-pill">
                            {formatCategory(rate.category)}
                          </span>
                        </td>
                        <td>{rate.unit}</td>
                        <td className="is-num money">{formatMoney(rate.cost_per_unit)}</td>
                        <td className="is-num">
                          {rate.waste_percent > 0 ? `${rate.waste_percent}%` : "—"}
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              rate.active ? "is-ready" : "is-warning"
                            }`}
                          >
                            {rate.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="is-actions">
                          <div className="rate-row-actions">
                            <button
                              className="btn btn-secondary btn-compact"
                              type="button"
                              onClick={() =>
                                setEditingId((current) =>
                                  current === rate.id ? null : rate.id,
                                )
                              }
                            >
                              {editingId === rate.id ? "Close" : "Edit"}
                            </button>
                            <button
                              className="btn btn-secondary btn-compact"
                              type="button"
                              onClick={() => void toggleActive(rate)}
                            >
                              {rate.active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingId === rate.id ? (
                        <tr className="rate-edit-row">
                          <td colSpan={8}>
                            <form
                              className="rate-edit-form stack"
                              onSubmit={(event) => void onSaveRate(event, rate)}
                            >
                              <strong>Edit {rate.code}</strong>
                              <div className="row">
                                <div className="field">
                                  <label htmlFor={`name-${rate.id}`}>Name</label>
                                  <input
                                    id={`name-${rate.id}`}
                                    name="name"
                                    defaultValue={rate.name}
                                    required
                                  />
                                </div>
                                <div className="field">
                                  <label htmlFor={`category-${rate.id}`}>Category</label>
                                  <input
                                    id={`category-${rate.id}`}
                                    name="category"
                                    defaultValue={rate.category}
                                    required
                                  />
                                </div>
                                <div className="field">
                                  <label htmlFor={`unit-${rate.id}`}>Unit</label>
                                  <input
                                    id={`unit-${rate.id}`}
                                    name="unit"
                                    defaultValue={rate.unit}
                                  />
                                </div>
                              </div>
                              <div className="row">
                                <div className="field">
                                  <label htmlFor={`cost-${rate.id}`}>Cost (£)</label>
                                  <input
                                    id={`cost-${rate.id}`}
                                    name="cost_per_unit"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    defaultValue={rate.cost_per_unit}
                                    required
                                  />
                                </div>
                                <div className="field">
                                  <label htmlFor={`waste-${rate.id}`}>Waste %</label>
                                  <input
                                    id={`waste-${rate.id}`}
                                    name="waste_percent"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.1"
                                    defaultValue={rate.waste_percent}
                                  />
                                </div>
                                <div className="field">
                                  <label htmlFor={`notes-${rate.id}`}>Notes</label>
                                  <input
                                    id={`notes-${rate.id}`}
                                    name="notes"
                                    defaultValue={rate.notes}
                                  />
                                </div>
                              </div>
                              <label className="check-line">
                                <input
                                  type="checkbox"
                                  name="active"
                                  defaultChecked={Boolean(rate.active)}
                                />
                                Active
                              </label>
                              <div className="step-actions">
                                <button
                                  className="btn btn-secondary"
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn btn-primary"
                                  type="submit"
                                  disabled={saving}
                                >
                                  Save changes
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              {!rates.length ? (
                <div className="rate-table-empty muted">
                  {hasFilters
                    ? "No rates match your search. Try clearing filters."
                    : "No rates in the table yet."}
                </div>
              ) : null}
            </div>

            {totalPages > 1 ? (
              <div className="pagination pagination-footer" aria-label="Rate pagination footer">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <span className="pagination-status">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
