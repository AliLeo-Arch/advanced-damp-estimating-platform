import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PanelSkeleton } from "../components/Loading";
import StatusPill from "../components/StatusPill";
import {
  ActualsSummary,
  formatMoney,
  getActualsSummary,
  getOpsSummary,
  OpsSummary,
} from "../api";
import { formatEstimateStatus } from "../estimateStatus";
import { getStoredUser } from "../auth";

export default function ReportsPage() {
  const user = getStoredUser();
  const canViewActuals = Boolean(
    user?.permissions?.includes("manage_actuals"),
  );

  const [ops, setOps] = useState<OpsSummary | null>(null);
  const [actuals, setActuals] = useState<ActualsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [opsSummary, actualsSummary] = await Promise.all([
          getOpsSummary(),
          canViewActuals
            ? getActualsSummary(50).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setOps(opsSummary);
        setActuals(actualsSummary);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load reports.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canViewActuals]);

  return (
    <section className="stack">
      <div className="page-header page-header-compact">
        <h1 className="page-title">Reports</h1>
        <p className="page-lead">
          Pipeline and job-cost overview for commercial follow-up.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <PanelSkeleton rows={6} />
      ) : (
        <>
          {ops ? (
            <div className="panel stack">
              <div className="toolbar">
                <h2 className="panel-title" style={{ margin: 0 }}>
                  Estimate pipeline
                </h2>
                <Link className="btn btn-secondary btn-compact" to="/">
                  Open estimates
                </Link>
              </div>
              <div className="ops-count-grid" aria-label="Pipeline counts">
                <Link className="ops-count-card" to="/">
                  <span className="ops-count-label">Total</span>
                  <strong className="ops-count-value">{ops.total}</strong>
                </Link>
                <Link
                  className="ops-count-card"
                  to="/?status=draft&status=priced&status=review_required&status=ready_to_quote"
                >
                  <span className="ops-count-label">Active pipeline</span>
                  <strong className="ops-count-value">
                    {ops.active_pipeline}
                  </strong>
                </Link>
                <Link className="ops-count-card" to="/?status=review_required">
                  <span className="ops-count-label">Review</span>
                  <strong className="ops-count-value">
                    {ops.review_required}
                  </strong>
                </Link>
                <Link className="ops-count-card" to="/?status=ready_to_quote">
                  <span className="ops-count-label">Ready to quote</span>
                  <strong className="ops-count-value">
                    {ops.ready_to_quote}
                  </strong>
                </Link>
                <Link className="ops-count-card" to="/?status=quoted">
                  <span className="ops-count-label">Quoted</span>
                  <strong className="ops-count-value">{ops.quoted}</strong>
                </Link>
                <Link className="ops-count-card" to="/?status=accepted">
                  <span className="ops-count-label">Accepted</span>
                  <strong className="ops-count-value">{ops.accepted}</strong>
                </Link>
              </div>
              {Object.keys(ops.by_status).length ? (
                <ul className="meta-list">
                  {Object.entries(ops.by_status)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <li key={status}>
                        <span>{formatEstimateStatus(status)}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {canViewActuals && actuals && actuals.count > 0 ? (
            <div className="panel stack">
              <h2 className="panel-title">Job costing snapshot</h2>
              <p className="muted" style={{ margin: 0 }}>
                Based on {actuals.count} completed actuals records.
              </p>
              <ul className="meta-list">
                <li>
                  <span>Jobs with complete actuals</span>
                  <strong>{actuals.count}</strong>
                </li>
                <li>
                  <span>Total cost variance</span>
                  <strong>{formatMoney(actuals.total_cost_variance)}</strong>
                </li>
                <li>
                  <span>Avg estimated margin</span>
                  <strong>
                    {actuals.average_estimated_margin_percent.toFixed(1)}%
                  </strong>
                </li>
                <li>
                  <span>Avg actual margin</span>
                  <strong>
                    {actuals.average_actual_margin_percent.toFixed(1)}%
                  </strong>
                </li>
              </ul>
              <StatusPill
                label={
                  actuals.total_cost_variance > 0
                    ? "Costs above estimate"
                    : actuals.total_cost_variance < 0
                      ? "Costs under estimate"
                      : "On estimate"
                }
                tone={
                  actuals.total_cost_variance > 0
                    ? "is-danger"
                    : actuals.total_cost_variance < 0
                      ? "is-success"
                      : "is-draft"
                }
              />
              <div className="variance-table-wrap">
                <table className="variance-table">
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="is-num">
                        Est. cost
                      </th>
                      <th scope="col" className="is-num">
                        Act. cost
                      </th>
                      <th scope="col" className="is-num">
                        Variance
                      </th>
                      <th scope="col" className="is-num">
                        Act. margin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actuals.items.map((row) => (
                      <tr key={row.estimate_id}>
                        <td>
                          <Link to={`/estimates/${row.estimate_id}?step=actuals`}>
                            {row.reference}
                          </Link>
                        </td>
                        <td>{row.customer_name}</td>
                        <td>{formatEstimateStatus(row.status)}</td>
                        <td className="money">{formatMoney(row.estimated_cost)}</td>
                        <td className="money">{formatMoney(row.actual_cost)}</td>
                        <td
                          className={`money ${
                            row.cost_variance > 0
                              ? "is-danger"
                              : row.cost_variance < 0
                                ? "is-success"
                                : ""
                          }`}
                        >
                          {formatMoney(row.cost_variance)}
                        </td>
                        <td className="money">
                          {row.actual_margin_percent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : canViewActuals ? (
            <div className="panel empty-state">
              <strong>No completed job costing data yet</strong>
              <p className="muted">
                Mark actuals complete on accepted jobs to build this report.
              </p>
            </div>
          ) : (
            <div className="panel muted">
              Job costing reports are available to users with actuals access.
            </div>
          )}
        </>
      )}
    </section>
  );
}
