import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActionMenu from "../components/ActionMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import { InlineLoading, LoadingButton, RateTableSkeleton, Refreshable, Spinner } from "../components/Loading";
import { useLoadMode } from "../hooks/useAsyncLoad";
import SideDrawer from "../components/SideDrawer";
import {
  createRate,
  formatMoney,
  importRates,
  listRateCategories,
  listRateVersions,
  RateItem,
  RateSort,
  RateVersion,
  searchRates,
  updateRate,
} from "../api";
import { getStoredUser } from "../auth";
import { formatUkDate, formatUkDateTime } from "../locale";

const FALLBACK_CATEGORIES = [
  "materials",
  "labour",
  "travel",
  "waste_skip",
  "preliminaries",
  "sump_package",
  "injection_replaster",
  "membrane_waterproofing",
  "timber_remediation",
  "ventilation_installation",
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

type RateDrawer =
  | { mode: "add" }
  | { mode: "edit"; rate: RateItem }
  | { mode: "history"; rate: RateItem };

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
  const [drawer, setDrawer] = useState<RateDrawer | null>(null);
  const [historyRows, setHistoryRows] = useState<RateVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { loading, refreshing, begin, end } = useLoadMode();
  const [saving, setSaving] = useState(false);
  const [pendingRateConfirm, setPendingRateConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone?: "primary" | "danger";
    run: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const categoryOptions = useMemo(() => {
    const merged = new Set([...FALLBACK_CATEGORIES, ...categories]);
    return Array.from(merged).sort();
  }, [categories]);

  async function importRatesCsv(file: File) {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        throw new Error("CSV needs a header row and at least one rate.");
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idx = (name: string) => headers.indexOf(name);
      const required = ["code", "name", "category", "cost_per_unit"] as const;
      for (const key of required) {
        if (idx(key) < 0) {
          throw new Error(`CSV missing required column: ${key}`);
        }
      }
      const rows: Array<Record<string, string>> = [];
      for (const line of lines.slice(1)) {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const code = cols[idx("code")];
        const name = cols[idx("name")];
        const category = cols[idx("category")];
        const cost = cols[idx("cost_per_unit")];
        if (!code || !name || !category || !cost) continue;
        rows.push({
          code,
          name,
          category,
          cost_per_unit: cost,
          unit: idx("unit") >= 0 ? cols[idx("unit")] || "each" : "each",
          waste_percent:
            idx("waste_percent") >= 0 ? cols[idx("waste_percent")] || "0" : "0",
          notes: idx("notes") >= 0 ? cols[idx("notes")] || "" : "",
          active: "true",
        });
      }
      if (!rows.length) {
        throw new Error("No valid rate rows found in the CSV.");
      }
      const result = await importRates(rows);
      await refresh();
      setMessage(
        `Import complete: ${result.created} created, ${result.updated} updated` +
          (result.skipped ? `, ${result.skipped} skipped` : "") +
          ".",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed.");
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    const [result, cats] = await Promise.all([
      searchRates({
        q: searchQ || undefined,
        category: filterCategory || undefined,
        include_inactive: showInactive,
        sort,
        page,
        page_size: pageSize,
      }),
      listRateCategories(),
    ]);
    setRates(result.items);
    setTotal(result.total);
    setPage(result.page);
    setPageSize(result.page_size);
    setTotalPages(result.total_pages);
    setHasNext(result.has_next);
    setHasPrev(result.has_prev);
    setCategories(cats);
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
    const generation = begin();
    void refresh()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load rates");
        }
      })
      .finally(() => {
        if (!cancelled) end(generation);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQ, filterCategory, showInactive, sort, page, pageSize, begin, end]);

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
      setDrawer(null);
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
        change_reason: String(form.get("change_reason") || "").trim() || undefined,
        effective_date: String(form.get("effective_date") || "").trim() || undefined,
      });
      setDrawer(null);
      setMessage(`Updated ${rate.code}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update rate");
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(rate: RateItem) {
    setDrawer({ mode: "history", rate });
    setHistoryLoading(true);
    setHistoryRows([]);
    setError(null);
    try {
      const rows = await listRateVersions(rate.id);
      setHistoryRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load rate history");
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeDrawer() {
    setDrawer(null);
    setHistoryRows([]);
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

  function requestToggleActive(rate: RateItem) {
    if (!canManageRates) return;
    if (rate.active) {
      setPendingRateConfirm({
        title: "Deactivate rate?",
        message: `${rate.code} will no longer be available for new estimates. Existing quotations keep their locked rate snapshot.`,
        confirmLabel: "Deactivate rate",
        tone: "danger",
        run: () => toggleActive(rate),
      });
      return;
    }
    void toggleActive(rate);
  }

  async function runPendingRateConfirm() {
    if (!pendingRateConfirm) return;
    setConfirmBusy(true);
    try {
      await pendingRateConfirm.run();
      setPendingRateConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  if (!canManageRates) {
    return (
      <section className="stack rates-page">
        <div className="page-header rates-page-header">
          <div className="rates-page-heading">
            <h1 className="page-title">Rates</h1>
            <p className="page-lead">
              Only users with rate administration permission can manage the rate
              library.
              {canManageSettings ? (
                <>
                  {" "}
                  Company and commercial rules are in{" "}
                  <Link to="/settings">Settings</Link>.
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="error-banner">You do not have permission to view this page.</div>
      </section>
    );
  }

  return (
    <section className="stack rates-page">
      <div className="page-header rates-page-header">
        <div className="rates-page-heading">
          <h1 className="page-title">Rates</h1>
          <p className="page-lead">
            Maintain materials, labour, packages, travel, waste, and
            preliminaries costs. Changes are versioned with reason and effective
            date.
            {canManageSettings ? (
              <>
                {" "}
                Company profile and commercial rules live in{" "}
                <Link to="/settings">Settings</Link>.
              </>
            ) : null}
          </p>
        </div>
        <div className="rates-page-actions">
          <label className={`btn btn-secondary${saving ? " is-loading" : ""}`} style={{ cursor: saving ? "wait" : "pointer" }}>
            {saving ? (
              <>
                <Spinner size="sm" className="btn-spinner" label="Importing" />
                Importing…
              </>
            ) : (
              "Import CSV"
            )}
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              disabled={saving}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void importRatesCsv(file);
              }}
            />
          </label>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setDrawer({ mode: "add" })}
          >
            Add rate
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      <>
          <div className="panel stack rate-table-panel">
            <div className="rate-table-header">
              <div>
                <h2 className="panel-title rate-library-title">Rate library</h2>
                <p className="muted rate-table-lead">
                  {loading
                    ? "Loading rate library…"
                    : `${total} rate${total === 1 ? "" : "s"} across ${
                        categoryOptions.length
                      } categor${categoryOptions.length === 1 ? "y" : "ies"}. CSV import upserts by code.`}
                </p>
              </div>
              <div className="rate-table-header-actions">
                {hasFilters ? (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rate-table-toolbar row row-align-end">
              <div className="field rate-search-field">
                <label htmlFor="rate-search-q">Search</label>
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

            {loading ? (
              <RateTableSkeleton count={8} />
            ) : (
            <Refreshable
              refreshing={refreshing}
              label="Updating rates…"
              className="rate-table-wrap"
            >
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
                    <tr
                      key={rate.id}
                      className={!rate.active ? "is-inactive" : undefined}
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
                            rate.active ? "is-success" : "is-closed"
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
                            onClick={() => setDrawer({ mode: "edit", rate })}
                          >
                            Edit
                          </button>
                          <ActionMenu
                            compact
                            label="More"
                            items={[
                              {
                                id: "history",
                                label: "Cost history",
                                onClick: () => {
                                  void openHistory(rate);
                                },
                              },
                              {
                                id: "toggle",
                                label: rate.active ? "Deactivate" : "Activate",
                                tone: rate.active ? "danger" : "default",
                                onClick: () => requestToggleActive(rate),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rates.length ? (
                <div className="empty-state estimates-table-empty rate-table-empty">
                  <strong>
                    {hasFilters ? "No rates match these filters" : "No rates yet"}
                  </strong>
                  <p>
                    {hasFilters
                      ? "Try clearing filters or broadening your search."
                      : "Add the first rate to build the commercial library."}
                  </p>
                  <div className="step-actions" style={{ justifyContent: "center" }}>
                    {hasFilters ? (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={resetFilters}
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => setDrawer({ mode: "add" })}
                      >
                        Add rate
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </Refreshable>
            )}

            {!loading ? (
            <div className="rate-results-bar" aria-label="Rate table footer">
              <p className="muted rate-results-summary">
                {total === 0
                  ? "No rates match the current filters."
                  : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
              </p>
              <div className="rate-results-controls">
                <div className="field rate-page-size-field">
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
                {totalPages > 1 ? (
                  <div className="pagination" aria-label="Rate pagination">
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      disabled={!hasPrev || refreshing}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </button>
                    <span className="pagination-status">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      disabled={!hasNext || refreshing}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            ) : null}
          </div>
        </>

      <SideDrawer
        open={Boolean(drawer)}
        title={
          drawer?.mode === "add"
            ? "Add rate"
            : drawer?.mode === "edit"
              ? `Edit ${drawer.rate.code}`
              : drawer?.mode === "history"
                ? `Cost history — ${drawer.rate.code}`
                : ""
        }
        subtitle={
          drawer?.mode === "edit"
            ? drawer.rate.name
            : drawer?.mode === "history"
              ? drawer.rate.name
              : "New rate for the library"
        }
        onClose={closeDrawer}
        wide={drawer?.mode === "history"}
      >
        {drawer?.mode === "add" ? (
          <form className="rate-drawer-form stack" onSubmit={onCreateRate}>
            <div className="field">
              <label htmlFor="drawer-code">Code</label>
              <input id="drawer-code" name="code" required placeholder="MAT-EXAMPLE" />
            </div>
            <div className="field">
              <label htmlFor="drawer-name">Name</label>
              <input id="drawer-name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="drawer-category">Category</label>
              <input
                id="drawer-category"
                name="category"
                list="rate-categories-drawer"
                required
                placeholder="materials"
              />
              <datalist id="rate-categories-drawer">
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="drawer-unit">Unit</label>
                <input id="drawer-unit" name="unit" defaultValue="each" />
              </div>
              <div className="field">
                <label htmlFor="drawer-cost">Cost per unit (£)</label>
                <input
                  id="drawer-cost"
                  name="cost_per_unit"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="drawer-waste">Waste %</label>
              <input
                id="drawer-waste"
                name="waste_percent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                defaultValue={0}
              />
            </div>
            <div className="field">
              <label htmlFor="drawer-notes">Notes</label>
              <input id="drawer-notes" name="notes" />
            </div>
            <div className="side-drawer-actions">
              <button className="btn btn-ghost" type="button" onClick={closeDrawer}>
                Cancel
              </button>
              <LoadingButton
                className="btn btn-primary"
                type="submit"
                loading={saving}
                loadingText="Adding…"
              >
                Add rate
              </LoadingButton>
            </div>
          </form>
        ) : null}

        {drawer?.mode === "edit" ? (
          <form
            key={drawer.rate.id}
            className="rate-drawer-form stack"
            onSubmit={(event) => void onSaveRate(event, drawer.rate)}
          >
            <div className="field">
              <label htmlFor="edit-name">Name</label>
              <input
                id="edit-name"
                name="name"
                defaultValue={drawer.rate.name}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="edit-category">Category</label>
              <input
                id="edit-category"
                name="category"
                defaultValue={drawer.rate.category}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="edit-unit">Unit</label>
              <input id="edit-unit" name="unit" defaultValue={drawer.rate.unit} />
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="edit-cost">Cost (£)</label>
                <input
                  id="edit-cost"
                  name="cost_per_unit"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={drawer.rate.cost_per_unit}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-waste">Waste %</label>
                <input
                  id="edit-waste"
                  name="waste_percent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  defaultValue={drawer.rate.waste_percent}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="edit-notes">Notes</label>
              <input id="edit-notes" name="notes" defaultValue={drawer.rate.notes} />
            </div>
            <div className="field">
              <label htmlFor="edit-reason">Change reason (if cost changes)</label>
              <input
                id="edit-reason"
                name="change_reason"
                placeholder="e.g. Supplier price increase Apr 2026"
              />
            </div>
            <div className="field">
              <label htmlFor="edit-effective">Effective date</label>
              <input
                id="edit-effective"
                name="effective_date"
                type="date"
                defaultValue={drawer.rate.effective_date || ""}
              />
            </div>
            <label className="check-line">
              <input
                type="checkbox"
                name="active"
                defaultChecked={Boolean(drawer.rate.active)}
              />
              Active
            </label>
            <div className="side-drawer-actions">
              <button className="btn btn-ghost" type="button" onClick={closeDrawer}>
                Cancel
              </button>
              <LoadingButton
                className="btn btn-primary"
                type="submit"
                loading={saving}
                loadingText="Saving…"
              >
                Save changes
              </LoadingButton>
            </div>
          </form>
        ) : null}

        {drawer?.mode === "history" ? (
          <div className="stack">
            {historyLoading ? (
              <InlineLoading label="Loading cost history…" />
            ) : historyRows.length === 0 ? (
              <p className="muted">No cost versions recorded yet for this rate.</p>
            ) : (
              <div className="rate-table-wrap">
                <table className="rate-table">
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">Effective</th>
                      <th scope="col" className="is-num">
                        Previous
                      </th>
                      <th scope="col" className="is-num">
                        New
                      </th>
                      <th scope="col">Reason</th>
                      <th scope="col">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row) => (
                      <tr key={row.id}>
                        <td>{formatUkDateTime(row.created_at)}</td>
                        <td>{formatUkDate(row.effective_date)}</td>
                        <td className="is-num money">{formatMoney(row.previous_cost)}</td>
                        <td className="is-num money">{formatMoney(row.new_cost)}</td>
                        <td>{row.reason || "—"}</td>
                        <td>{row.changed_by_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="side-drawer-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setDrawer({ mode: "edit", rate: drawer.rate })}
              >
                Edit rate
              </button>
              <button className="btn btn-primary" type="button" onClick={closeDrawer}>
                Close history
              </button>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <ConfirmDialog
        open={Boolean(pendingRateConfirm)}
        title={pendingRateConfirm?.title || ""}
        message={pendingRateConfirm?.message || ""}
        confirmLabel={pendingRateConfirm?.confirmLabel || "Confirm"}
        tone={pendingRateConfirm?.tone || "primary"}
        busy={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setPendingRateConfirm(null);
        }}
        onConfirm={() => void runPendingRateConfirm()}
      />
    </section>
  );
}
