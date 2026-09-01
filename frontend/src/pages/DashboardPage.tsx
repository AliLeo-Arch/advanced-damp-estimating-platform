import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EstimateListSkeleton, Spinner } from "../components/Loading";
import {
  Estimate,
  EstimateSearchFilters,
  EstimateSort,
  estimatesListCsvUrl,
  formatMoney,
  getHealth,
  searchEstimates,
} from "../api";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "priced", label: "Priced" },
  { value: "review_required", label: "Review required" },
  { value: "approved", label: "Approved" },
  { value: "ready_to_quote", label: "Ready to quote" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
  { value: "closed", label: "Closed" },
] as const;

const SORT_OPTIONS: Array<{ value: EstimateSort; label: string }> = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "created_at_asc", label: "Oldest first" },
  { value: "sell_price_desc", label: "Highest value" },
  { value: "sell_price_asc", label: "Lowest value" },
  { value: "reference_asc", label: "Reference A–Z" },
  { value: "reference_desc", label: "Reference Z–A" },
  { value: "customer_asc", label: "Customer A–Z" },
  { value: "customer_desc", label: "Customer Z–A" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const LOCKED_STATUSES = new Set([
  "quoted",
  "accepted",
  "declined",
  "expired",
  "closed",
]);

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusTone(status: string) {
  switch (status) {
    case "ready_to_quote":
      return "is-ready";
    case "quoted":
    case "accepted":
      return "is-success";
    case "review_required":
      return "is-warning";
    case "priced":
      return "is-priced";
    default:
      return "";
  }
}

function actionLabel(status: string) {
  return LOCKED_STATUSES.has(status) ? "Open" : "Edit";
}

function parseFilters(params: URLSearchParams): EstimateSearchFilters {
  const sellMin = params.get("sell_min");
  const sellMax = params.get("sell_max");
  const page = Number(params.get("page") || "1");
  const pageSize = Number(params.get("page_size") || "10");
  return {
    q: params.get("q") || undefined,
    status: params.getAll("status").filter(Boolean),
    surveyor: params.get("surveyor") || undefined,
    survey_from: params.get("survey_from") || undefined,
    survey_to: params.get("survey_to") || undefined,
    sell_min: sellMin ? Number(sellMin) : undefined,
    sell_max: sellMax ? Number(sellMax) : undefined,
    sort: (params.get("sort") as EstimateSort | null) || "created_at_desc",
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    page_size: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 10,
  };
}

function countActiveFilters(filters: EstimateSearchFilters) {
  let count = 0;
  if (filters.q) count += 1;
  if (filters.status?.length) count += 1;
  if (filters.surveyor) count += 1;
  if (filters.survey_from || filters.survey_to) count += 1;
  if (filters.sell_min != null || filters.sell_max != null) count += 1;
  if (filters.sort && filters.sort !== "created_at_desc") count += 1;
  return count;
}

function nextSort(current: EstimateSort | undefined, asc: EstimateSort, desc: EstimateSort) {
  return current === asc ? desc : asc;
}

function sortIndicator(current: EstimateSort | undefined, asc: EstimateSort, desc: EstimateSort) {
  if (current === asc) return " ↑";
  if (current === desc) return " ↓";
  return "";
}

function siteLine(estimate: Estimate) {
  const address = estimate.site_address?.trim() || "No site address";
  return estimate.postcode ? `${address} · ${estimate.postcode}` : address;
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [draftQ, setDraftQ] = useState(filters.q || "");
  const [showAdvanced, setShowAdvanced] = useState(
    () => countActiveFilters(filters) > (filters.q ? 1 : 0),
  );
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page || 1);
  const [pageSize, setPageSize] = useState(filters.page_size || 10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [healthDetail, setHealthDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeFilterCount = countActiveFilters(filters);
  const exportUrl = estimatesListCsvUrl(filters);
  const currentSort = filters.sort || "created_at_desc";

  useEffect(() => {
    setDraftQ(filters.q || "");
  }, [filters.q]);

  useEffect(() => {
    if ((draftQ || "") === (filters.q || "")) return;
    const timer = window.setTimeout(() => {
      updateParams({ q: draftQ.trim() || undefined }, true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draftQ, filters.q]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [health, result] = await Promise.all([
          getHealth(),
          searchEstimates(filters),
        ]);
        if (cancelled) return;
        setApiOk(health.status === "ok" && health.database_ok !== false);
        setHealthDetail(
          health.version
            ? `${health.app} · v${health.version}`
            : health.app ?? null,
        );
        setEstimates(result.items);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.page_size);
        setTotalPages(result.total_pages);
        setHasNext(result.has_next);
        setHasPrev(result.has_prev);
      } catch (err) {
        if (cancelled) return;
        setApiOk(false);
        setError(
          err instanceof Error
            ? err.message
            : "Could not reach the estimating API. Is the backend running?",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function updateParams(
    patch: Partial<Record<string, string | number | string[] | undefined>>,
    resetPage = false,
  ) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (resetPage) next.set("page", "1");

        for (const [key, value] of Object.entries(patch)) {
          if (
            value === undefined ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            next.delete(key);
            continue;
          }
          if (Array.isArray(value)) {
            next.delete(key);
            for (const item of value) next.append(key, item);
            continue;
          }
          next.set(key, String(value));
        }
        return next;
      },
      { replace: true },
    );
  }

  function onFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateParams(
      {
        q: draftQ.trim() || undefined,
        surveyor: String(form.get("surveyor") || "").trim() || undefined,
        survey_from: String(form.get("survey_from") || "") || undefined,
        survey_to: String(form.get("survey_to") || "") || undefined,
        sell_min: String(form.get("sell_min") || "")
          ? Number(form.get("sell_min"))
          : undefined,
        sell_max: String(form.get("sell_max") || "")
          ? Number(form.get("sell_max"))
          : undefined,
        sort: String(form.get("sort") || "created_at_desc"),
        page_size: Number(form.get("page_size") || pageSize),
        status: filters.status,
      },
      true,
    );
  }

  function clearFilters() {
    setDraftQ("");
    setSearchParams({}, { replace: true });
  }

  function toggleStatus(value: string) {
    const current = new Set(filters.status || []);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    updateParams({ status: Array.from(current) }, true);
  }

  function setColumnSort(asc: EstimateSort, desc: EstimateSort) {
    updateParams({ sort: nextSort(currentSort, asc, desc) }, true);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <section className="stack">
      <div className="page-header page-header-compact">
        <h1 className="page-title">Estimates</h1>
        <p className="page-lead">
          Search, filter, and open saved estimates or create a new one from site
          survey details.
        </p>
      </div>

      <div className="toolbar dashboard-toolbar">
        <div className="dashboard-toolbar-actions">
          <Link className="btn btn-primary" to="/estimates/new">
            New estimate
          </Link>
          {!loading && total > 0 ? (
            <a
              className="btn btn-secondary"
              href={exportUrl}
              target="_blank"
              rel="noreferrer"
            >
              Export results (CSV)
            </a>
          ) : null}
        </div>
        <div className="api-status">
          <span
            className={`api-dot ${apiOk === true ? "is-ok" : apiOk === false ? "is-bad" : "is-pending"}`}
            aria-hidden
          />
          <span className="api-status-text">
            {loading ? (
              <>
                <Spinner
                  size="sm"
                  className="api-status-spinner"
                  label="Checking system"
                />
                Checking system…
              </>
            ) : (
              <>
                System {apiOk ? "connected" : "offline"}
                {healthDetail && apiOk ? ` · ${healthDetail}` : ""}
              </>
            )}
          </span>
        </div>
      </div>

      <form className="panel estimate-search-panel stack" onSubmit={onFilterSubmit}>
        <div className="estimate-search-header">
          <div>
            <h2 className="panel-title" style={{ margin: 0 }}>
              Search &amp; filter
            </h2>
            <p className="muted estimate-search-lead">
              Find estimates by customer, reference, site, surveyor, status, or
              value.
            </p>
          </div>
          <div className="estimate-search-header-actions">
            {activeFilterCount > 0 ? (
              <span className="filter-count-badge">{activeFilterCount} active</span>
            ) : null}
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setShowAdvanced((open) => !open)}
            >
              {showAdvanced ? "Hide advanced" : "Advanced filters"}
            </button>
            {activeFilterCount > 0 ? (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={clearFilters}
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        <div className="estimate-search-quick row">
          <div className="field estimate-search-field">
            <label htmlFor="estimate-search-q">Search</label>
            <input
              id="estimate-search-q"
              type="search"
              placeholder="Reference, customer, site, postcode, surveyor…"
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="estimate-sort">Sort by</label>
            <select
              id="estimate-sort"
              name="sort"
              value={currentSort}
              onChange={(event) =>
                updateParams({ sort: event.target.value as EstimateSort }, true)
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="estimate-page-size">Per page</label>
            <select
              id="estimate-page-size"
              name="page_size"
              value={String(pageSize)}
              onChange={(event) =>
                updateParams({ page_size: Number(event.target.value) }, true)
              }
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="status-filter-row">
          <span className="status-filter-label">Status</span>
          <div
            className="status-filter-chips"
            role="group"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => {
              const active = filters.status?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`status-filter-chip${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleStatus(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {showAdvanced ? (
          <div className="estimate-search-advanced row row-align-end">
            <div className="field">
              <label htmlFor="estimate-surveyor">Surveyor</label>
              <input
                id="estimate-surveyor"
                name="surveyor"
                defaultValue={filters.surveyor || ""}
                placeholder="e.g. James Whitaker"
              />
            </div>
            <div className="field">
              <label htmlFor="estimate-survey-from">Survey from</label>
              <input
                id="estimate-survey-from"
                name="survey_from"
                type="date"
                defaultValue={filters.survey_from || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="estimate-survey-to">Survey to</label>
              <input
                id="estimate-survey-to"
                name="survey_to"
                type="date"
                defaultValue={filters.survey_to || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="estimate-sell-min">Min sell (£)</label>
              <input
                id="estimate-sell-min"
                name="sell_min"
                type="number"
                min={0}
                step="0.01"
                defaultValue={filters.sell_min ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="estimate-sell-max">Max sell (£)</label>
              <input
                id="estimate-sell-max"
                name="sell_max"
                type="number"
                min={0}
                step="0.01"
                defaultValue={filters.sell_max ?? ""}
              />
            </div>
            <div className="field field-action">
              <button className="btn btn-primary" type="submit">
                Apply filters
              </button>
            </div>
          </div>
        ) : null}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="panel estimates-table-panel stack">
        <div className="estimate-results-bar">
          <p className="muted estimate-results-summary">
            {loading
              ? "Loading estimates…"
              : total === 0
                ? "No estimates match the current filters."
                : `Showing ${rangeStart}–${rangeEnd} of ${total} estimate${total === 1 ? "" : "s"}`}
          </p>
          {!loading && totalPages > 1 ? (
            <div className="pagination" aria-label="Estimate pagination">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={!hasPrev}
                onClick={() => updateParams({ page: page - 1 })}
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
                onClick={() => updateParams({ page: page + 1 })}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <EstimateListSkeleton count={pageSize > 5 ? 5 : pageSize} />
        ) : estimates.length === 0 ? (
          <div className="empty-state estimates-table-empty">
            <strong>
              {activeFilterCount > 0 ? "No matching estimates" : "No estimates yet"}
            </strong>
            {activeFilterCount > 0
              ? "Try clearing filters or broadening your search terms."
              : "Create the first draft from customer and site details."}
            {activeFilterCount === 0 ? (
              <div className="step-actions" style={{ justifyContent: "center" }}>
                <Link className="btn btn-primary" to="/estimates/new">
                  New estimate
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="estimates-table-wrap">
            <table className="estimates-table">
              <thead>
                <tr>
                  <th scope="col">
                    <button
                      type="button"
                      className="table-sort-btn"
                      onClick={() =>
                        setColumnSort("reference_asc", "reference_desc")
                      }
                    >
                      Reference
                      {sortIndicator(
                        currentSort,
                        "reference_asc",
                        "reference_desc",
                      )}
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className="table-sort-btn"
                      onClick={() =>
                        setColumnSort("customer_asc", "customer_desc")
                      }
                    >
                      Customer
                      {sortIndicator(
                        currentSort,
                        "customer_asc",
                        "customer_desc",
                      )}
                    </button>
                  </th>
                  <th scope="col">Site</th>
                  <th scope="col">Surveyor</th>
                  <th scope="col">Survey</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="is-num">
                    <button
                      type="button"
                      className="table-sort-btn"
                      onClick={() =>
                        setColumnSort("sell_price_asc", "sell_price_desc")
                      }
                    >
                      Sell
                      {sortIndicator(
                        currentSort,
                        "sell_price_asc",
                        "sell_price_desc",
                      )}
                    </button>
                  </th>
                  <th scope="col" className="is-num">
                    Margin
                  </th>
                  <th scope="col" className="is-actions">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((estimate) => (
                  <tr key={estimate.id}>
                    <td data-label="Reference">
                      <Link
                        className="estimate-ref-link"
                        to={`/estimates/${estimate.id}`}
                      >
                        {estimate.reference}
                      </Link>
                      {estimate.revision_no && estimate.revision_no > 1 ? (
                        <span className="estimate-rev muted">
                          {" "}
                          r{estimate.revision_no}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Customer">
                      <div className="estimate-customer-cell">
                        {estimate.customer_name}
                      </div>
                      {estimate.company_name ? (
                        <div className="muted estimate-company-cell">
                          {estimate.company_name}
                        </div>
                      ) : null}
                    </td>
                    <td data-label="Site">
                      <div className="estimate-site-cell">{siteLine(estimate)}</div>
                    </td>
                    <td data-label="Surveyor">
                      {estimate.surveyor || (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td data-label="Survey">
                      {estimate.survey_date || (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`status-pill ${statusTone(estimate.status)}`}
                      >
                        {formatStatus(estimate.status)}
                      </span>
                    </td>
                    <td data-label="Sell" className="is-num money">
                      {formatMoney(estimate.sell_price)}
                    </td>
                    <td data-label="Margin" className="is-num">
                      {estimate.margin_percent > 0 ? (
                        <span
                          className={
                            estimate.below_target_margin
                              ? "money is-danger"
                              : "money is-success"
                          }
                        >
                          {estimate.margin_percent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td data-label="Action" className="is-actions">
                      <Link
                        className="btn btn-secondary btn-compact"
                        to={`/estimates/${estimate.id}`}
                      >
                        {actionLabel(estimate.status)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 ? (
          <div
            className="pagination pagination-footer"
            aria-label="Estimate pagination footer"
          >
            <button
              className="btn btn-secondary"
              type="button"
              disabled={!hasPrev}
              onClick={() => updateParams({ page: page - 1 })}
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
              onClick={() => updateParams({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
