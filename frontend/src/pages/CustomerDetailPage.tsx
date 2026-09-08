import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  InlineLoading,
  LoadingButton,
  PanelSkeleton,
} from "../components/Loading";
import SideDrawer from "../components/SideDrawer";
import StatusPill from "../components/StatusPill";
import {
  createSite,
  createSurvey,
  Customer,
  Estimate,
  formatMoney,
  getCustomer,
  listEstimates,
  listSites,
  listSurveys,
  Site,
  Survey,
} from "../api";
import { estimateOpenActionLabel } from "../estimateStatus";
import { formatUkDate } from "../locale";

type DetailTab = "details" | "sites" | "surveys" | "estimates";

type DrawerMode =
  | { mode: "site" }
  | { mode: "survey"; siteId: number }
  | null;

function formatCustomerType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function siteSummary(site: Site) {
  return [site.address_line1, site.town, site.postcode].filter(Boolean).join(", ");
}

export default function CustomerDetailPage() {
  const { customerId: customerIdParam } = useParams();
  const customerId = Number(customerIdParam);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [surveysBySite, setSurveysBySite] = useState<Record<number, Survey[]>>({});
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [tab, setTab] = useState<DetailTab>("details");
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const allSurveys = useMemo(() => {
    const rows: Array<Survey & { site?: Site }> = [];
    for (const site of sites) {
      for (const survey of surveysBySite[site.id] || []) {
        rows.push({ ...survey, site });
      }
    }
    return rows.sort((a, b) =>
      String(b.survey_date || "").localeCompare(String(a.survey_date || "")),
    );
  }, [sites, surveysBySite]);

  useEffect(() => {
    if (!Number.isFinite(customerId) || customerId <= 0) {
      setError("Customer not found");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getCustomer(customerId)
      .then((row) => {
        if (!cancelled) setCustomer(row);
      })
      .catch((err) => {
        if (!cancelled) {
          setCustomer(null);
          setError(err instanceof Error ? err.message : "Could not load customer");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    setSitesLoading(true);
    void listSites(customer.id)
      .then((rows) => {
        if (!cancelled) setSites(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load sites");
        }
      })
      .finally(() => {
        if (!cancelled) setSitesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  useEffect(() => {
    if (!sites.length) {
      setSurveysBySite({});
      return;
    }
    let cancelled = false;
    setSurveysLoading(true);
    void Promise.all(
      sites.map(async (site) => {
        const rows = await listSurveys(site.id);
        return [site.id, rows] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setSurveysBySite(Object.fromEntries(entries));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load surveys");
        }
      })
      .finally(() => {
        if (!cancelled) setSurveysLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sites]);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    setEstimatesLoading(true);
    void listEstimates({
      q: customer.name,
      page: 1,
      page_size: 50,
      sort: "created_at_desc",
    })
      .then((response) => {
        if (cancelled) return;
        setEstimates(
          response.items.filter((estimate) => estimate.customer_id === customer.id),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load estimates");
        }
      })
      .finally(() => {
        if (!cancelled) setEstimatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  async function onCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const site = await createSite(customer.id, {
        label: String(form.get("label") || "Main property"),
        address_line1: String(form.get("address_line1") || "").trim(),
        town: String(form.get("town") || "").trim(),
        postcode: String(form.get("postcode") || "").trim(),
      });
      event.currentTarget.reset();
      setDrawer(null);
      setSites(await listSites(customer.id));
      setMessage(`Site ${site.address_line1} created.`);
      setTab("sites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create site");
    } finally {
      setSaving(false);
    }
  }

  async function onCreateSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!drawer || drawer.mode !== "survey") return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const siteId = drawer.siteId;
    try {
      const survey = await createSurvey(siteId, {
        survey_date: String(form.get("survey_date") || ""),
        diagnosis_summary: String(form.get("diagnosis_summary") || "").trim(),
        recommended_works: String(form.get("recommended_works") || "").trim(),
      });
      event.currentTarget.reset();
      setDrawer(null);
      const rows = await listSurveys(siteId);
      setSurveysBySite((current) => ({ ...current, [siteId]: rows }));
      setMessage(`Survey ${survey.reference} created.`);
      setTab("surveys");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create survey");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="stack" aria-busy="true" aria-live="polite">
        <div className="page-header">
          <h1 className="page-title">Customer</h1>
          <p className="page-lead">Loading customer…</p>
        </div>
        <PanelSkeleton rows={6} />
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="stack">
        <div className="page-header">
          <h1 className="page-title">Customer</h1>
          <p className="page-lead">
            <Link to="/customers">Back to customers</Link>
          </p>
        </div>
        <div className="error-banner">{error || "Customer not found"}</div>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="page-header customer-detail-header">
        <div>
          <p className="breadcrumb muted">
            <Link to="/customers">Customers</Link>
            <span aria-hidden="true"> / </span>
            <span>{customer.name}</span>
          </p>
          <h1 className="page-title">{customer.name}</h1>
          <p className="page-lead">
            {formatCustomerType(customer.customer_type)}
            {customer.company_name ? ` · ${customer.company_name}` : ""}
          </p>
        </div>
        <div className="customer-detail-header-actions">
          <Link className="btn btn-secondary" to="/customers">
            All customers
          </Link>
          <Link
            className="btn btn-primary"
            to={`/estimates/new?customer_id=${customer.id}`}
          >
            New estimate
          </Link>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      <div className="customer-tabs" role="tablist" aria-label="Customer sections">
        {(
          [
            ["details", "Details"],
            ["sites", `Sites (${sites.length})`],
            ["surveys", `Surveys (${allSurveys.length})`],
            ["estimates", `Estimates (${estimates.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`customer-tab${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="panel stack">
          <h2 className="panel-title">Customer details</h2>
          <dl className="customer-detail-grid">
            <div>
              <dt>Type</dt>
              <dd>{formatCustomerType(customer.customer_type)}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{customer.company_name || "—"}</dd>
            </div>
            <div>
              <dt>Telephone</dt>
              <dd>{customer.telephone || "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{customer.email || "—"}</dd>
            </div>
            <div className="is-wide">
              <dt>Notes</dt>
              <dd>{customer.notes || "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {tab === "sites" ? (
        <div className="panel stack">
          <div className="rate-table-header">
            <h2 className="panel-title" style={{ margin: 0 }}>
              Sites
            </h2>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setDrawer({ mode: "site" })}
            >
              Add site
            </button>
          </div>
          {sitesLoading ? (
            <InlineLoading label="Loading sites…" />
          ) : sites.length === 0 ? (
            <p className="muted">No sites yet. Add a property address for this customer.</p>
          ) : (
            <div className="rate-table-wrap">
              <table className="rate-table">
                <thead>
                  <tr>
                    <th scope="col">Label</th>
                    <th scope="col">Address</th>
                    <th scope="col" className="is-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id}>
                      <td>{site.label}</td>
                      <td>{siteSummary(site) || "—"}</td>
                      <td className="is-actions">
                        <button
                          className="btn btn-secondary btn-compact"
                          type="button"
                          onClick={() => setDrawer({ mode: "survey", siteId: site.id })}
                        >
                          Add survey
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "surveys" ? (
        <div className="panel stack">
          <div className="rate-table-header">
            <h2 className="panel-title" style={{ margin: 0 }}>
              Surveys
            </h2>
            {sites.length ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setDrawer({ mode: "survey", siteId: sites[0].id })}
              >
                Add survey
              </button>
            ) : null}
          </div>
          {surveysLoading ? (
            <InlineLoading label="Loading surveys…" />
          ) : allSurveys.length === 0 ? (
            <p className="muted">
              {sites.length
                ? "No surveys yet for this customer’s sites."
                : "Add a site before creating a survey."}
            </p>
          ) : (
            <div className="rate-table-wrap">
              <table className="rate-table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Site</th>
                    <th scope="col">Date</th>
                    <th scope="col">Diagnosis</th>
                    <th scope="col" className="is-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allSurveys.map((survey) => (
                    <tr key={survey.id}>
                      <td>
                        <code className="rate-code">{survey.reference}</code>
                      </td>
                      <td>{survey.site?.label || "—"}</td>
                      <td>{formatUkDate(survey.survey_date)}</td>
                      <td>{survey.diagnosis_summary || "—"}</td>
                      <td className="is-actions">
                        <Link
                          className="btn btn-secondary btn-compact"
                          to={`/estimates/new?survey_id=${survey.id}`}
                        >
                          New estimate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "estimates" ? (
        <div className="panel stack">
          <div className="rate-table-header">
            <h2 className="panel-title" style={{ margin: 0 }}>
              Estimates
            </h2>
            <Link
              className="btn btn-primary"
              to={`/estimates/new?customer_id=${customer.id}`}
            >
              New estimate
            </Link>
          </div>
          {estimatesLoading ? (
            <InlineLoading label="Loading estimates…" />
          ) : estimates.length === 0 ? (
            <p className="muted">No linked estimates for this customer yet.</p>
          ) : (
            <div className="rate-table-wrap">
              <table className="rate-table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Status</th>
                    <th scope="col">Site</th>
                    <th scope="col" className="is-num">
                      Sell
                    </th>
                    <th scope="col" className="is-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((estimate) => (
                    <tr key={estimate.id}>
                      <td>
                        <code className="rate-code">{estimate.reference}</code>
                      </td>
                      <td>
                        <StatusPill status={estimate.status} />
                      </td>
                      <td>
                        {[estimate.site_address, estimate.postcode]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="is-num money">
                        {formatMoney(estimate.sell_price)}
                      </td>
                      <td className="is-actions">
                        <Link
                          className="btn btn-secondary btn-compact"
                          to={`/estimates/${estimate.id}`}
                        >
                          {estimateOpenActionLabel(estimate.status)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <SideDrawer
        open={drawer?.mode === "site"}
        title="Add site"
        subtitle={customer.name}
        onClose={() => setDrawer(null)}
      >
        <form className="rate-drawer-form stack" onSubmit={onCreateSite}>
          <div className="field">
            <label htmlFor="site-label">Label</label>
            <input id="site-label" name="label" defaultValue="Main property" />
          </div>
          <div className="field">
            <label htmlFor="site-address">Address</label>
            <input
              id="site-address"
              name="address_line1"
              required
              placeholder="24 Cedar Road"
            />
          </div>
          <div className="field">
            <label htmlFor="site-town">Town</label>
            <input id="site-town" name="town" placeholder="Reading" />
          </div>
          <div className="field">
            <label htmlFor="site-postcode">Postcode</label>
            <input id="site-postcode" name="postcode" placeholder="RG1 4AB" />
          </div>
          <div className="side-drawer-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setDrawer(null)}
            >
              Cancel
            </button>
            <LoadingButton
              className="btn btn-primary"
              type="submit"
              loading={saving}
              loadingText="Adding…"
            >
              Add site
            </LoadingButton>
          </div>
        </form>
      </SideDrawer>

      <SideDrawer
        open={drawer?.mode === "survey"}
        title="Add survey"
        subtitle={
          drawer?.mode === "survey"
            ? sites.find((site) => site.id === drawer.siteId)?.label || customer.name
            : customer.name
        }
        onClose={() => setDrawer(null)}
      >
        <form className="rate-drawer-form stack" onSubmit={onCreateSurvey}>
          {sites.length > 1 && drawer?.mode === "survey" ? (
            <div className="field">
              <label htmlFor="survey-site">Site</label>
              <select
                id="survey-site"
                value={drawer.siteId}
                onChange={(event) =>
                  setDrawer({ mode: "survey", siteId: Number(event.target.value) })
                }
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.label} — {siteSummary(site)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="survey-date">Survey date</label>
            <input id="survey-date" name="survey_date" type="date" />
          </div>
          <div className="field">
            <label htmlFor="survey-diagnosis">Diagnosis summary</label>
            <textarea
              id="survey-diagnosis"
              name="diagnosis_summary"
              rows={3}
              placeholder="Rising damp to front reception wall"
            />
          </div>
          <div className="field">
            <label htmlFor="survey-works">Recommended works</label>
            <textarea
              id="survey-works"
              name="recommended_works"
              rows={3}
              placeholder="Injection treatment and replastering to 1.2 m"
            />
          </div>
          <div className="side-drawer-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setDrawer(null)}
            >
              Cancel
            </button>
            <LoadingButton
              className="btn btn-primary"
              type="submit"
              loading={saving}
              loadingText="Creating…"
            >
              Create survey
            </LoadingButton>
          </div>
        </form>
      </SideDrawer>
    </section>
  );
}
