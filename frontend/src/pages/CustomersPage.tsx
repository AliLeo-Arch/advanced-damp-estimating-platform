import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  EstimateListSkeleton,
  InlineLoading,
  LoadingButton,
} from "../components/Loading";
import {
  createCustomer,
  createSite,
  createSurvey,
  Customer,
  listCustomers,
  listSites,
  listSurveys,
  Site,
  Survey,
} from "../api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function refreshCustomers() {
    const rows = await listCustomers();
    setCustomers(rows);
  }

  useEffect(() => {
    let cancelled = false;
    setCustomersLoading(true);
    void refreshCustomers()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load customers");
        }
      })
      .finally(() => {
        if (!cancelled) setCustomersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSites([]);
      setSelectedSiteId(null);
      return;
    }
    let cancelled = false;
    setSitesLoading(true);
    void listSites(selectedId)
      .then((rows) => {
        if (cancelled) return;
        setSites(rows);
        setSelectedSiteId(rows[0]?.id ?? null);
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
  }, [selectedId]);

  useEffect(() => {
    if (!selectedSiteId) {
      setSurveys([]);
      return;
    }
    let cancelled = false;
    setSurveysLoading(true);
    void listSurveys(selectedSiteId)
      .then((rows) => {
        if (!cancelled) setSurveys(rows);
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
  }, [selectedSiteId]);

  async function onCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const customer = await createCustomer({
        name: String(form.get("name") || "").trim(),
        customer_type: String(form.get("customer_type") || "homeowner"),
        telephone: String(form.get("telephone") || "").trim(),
        email: String(form.get("email") || "").trim(),
      });
      event.currentTarget.reset();
      await refreshCustomers();
      setSelectedId(customer.id);
      setMessage(`Customer ${customer.name} created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create customer");
    } finally {
      setSaving(false);
    }
  }

  async function onCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const site = await createSite(selectedId, {
        label: String(form.get("label") || "Main property"),
        address_line1: String(form.get("address_line1") || "").trim(),
        town: String(form.get("town") || "").trim(),
        postcode: String(form.get("postcode") || "").trim(),
      });
      event.currentTarget.reset();
      const rows = await listSites(selectedId);
      setSites(rows);
      setSelectedSiteId(site.id);
      setMessage(`Site ${site.address_line1} created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create site");
    }
  }

  async function onCreateSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSiteId) return;
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const survey = await createSurvey(selectedSiteId, {
        survey_date: String(form.get("survey_date") || ""),
        diagnosis_summary: String(form.get("diagnosis_summary") || "").trim(),
        recommended_works: String(form.get("recommended_works") || "").trim(),
      });
      event.currentTarget.reset();
      setSurveys(await listSurveys(selectedSiteId));
      setMessage(`Survey ${survey.reference} created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create survey");
    }
  }

  return (
    <section className="stack">
      <div className="page-header">
        <h1 className="page-title">Customers &amp; surveys</h1>
        <p className="page-lead">
          Production foundation: customer → site → survey records before estimating.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      <div className="panel stack">
        <h2 className="panel-title">New customer</h2>
        <form className="row" onSubmit={onCreateCustomer}>
          <div className="field">
            <label>Name</label>
            <input name="name" required placeholder="Mrs Helen Carter" />
          </div>
          <div className="field">
            <label>Type</label>
            <select name="customer_type" defaultValue="homeowner">
              <option value="homeowner">Homeowner</option>
              <option value="landlord">Landlord</option>
              <option value="commercial">Commercial</option>
              <option value="agent">Agent / HA</option>
            </select>
          </div>
          <div className="field">
            <label>Telephone</label>
            <input name="telephone" />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" />
          </div>
          <LoadingButton className="btn btn-primary field-action" type="submit" loading={saving} loadingText="Adding…">
            Add customer
          </LoadingButton>
        </form>
      </div>

      <div className="panel stack">
        <h2 className="panel-title">Customers</h2>
        {customersLoading ? (
          <EstimateListSkeleton count={4} />
        ) : customers.length === 0 ? (
          <p className="muted">No customers yet.</p>
        ) : (
          <ul className="estimate-list">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  className={`estimate-item estimate-item-link ${selectedId === customer.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(customer.id)}
                  style={{ width: "100%", textAlign: "left" }}
                >
                  <div>
                    <div className="estimate-customer">{customer.name}</div>
                    <div className="muted">
                      {customer.customer_type}
                      {customer.telephone ? ` · ${customer.telephone}` : ""}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId ? (
        <div className="panel stack">
          <h2 className="panel-title">Sites</h2>
          <form className="row" onSubmit={onCreateSite}>
            <div className="field">
              <label>Label</label>
              <input name="label" defaultValue="Main property" />
            </div>
            <div className="field">
              <label>Address</label>
              <input name="address_line1" required placeholder="18 Maple Avenue" />
            </div>
            <div className="field">
              <label>Town</label>
              <input name="town" placeholder="Bromley" />
            </div>
            <div className="field">
              <label>Postcode</label>
              <input name="postcode" placeholder="BR1 2NP" />
            </div>
            <button className="btn btn-secondary field-action" type="submit">
              Add site
            </button>
          </form>
          {sitesLoading ? (
            <InlineLoading label="Loading sites…" />
          ) : (
          <ul className="estimate-list">
            {sites.map((site) => (
              <li key={site.id}>
                <button
                  type="button"
                  className={`estimate-item estimate-item-link ${selectedSiteId === site.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedSiteId(site.id)}
                  style={{ width: "100%", textAlign: "left" }}
                >
                  <div>
                    <div className="estimate-ref">{site.label}</div>
                    <div className="muted">
                      {site.address_line1}
                      {site.town ? `, ${site.town}` : ""}
                      {site.postcode ? ` · ${site.postcode}` : ""}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          )}
        </div>
      ) : null}

      {selectedSiteId ? (
        <div className="panel stack">
          <h2 className="panel-title">Surveys</h2>
          <form className="stack" onSubmit={onCreateSurvey}>
            <div className="row">
              <div className="field">
                <label>Survey date</label>
                <input name="survey_date" type="date" />
              </div>
            </div>
            <div className="field">
              <label>Diagnosis summary</label>
              <textarea
                name="diagnosis_summary"
                rows={2}
                placeholder="Rising damp to front reception wall"
              />
            </div>
            <div className="field">
              <label>Recommended works</label>
              <textarea
                name="recommended_works"
                rows={2}
                placeholder="Chemical DPC and replastering to 1.2 m"
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Create survey
            </button>
          </form>
          {surveysLoading ? (
            <InlineLoading label="Loading surveys…" />
          ) : (
          <ul className="estimate-list">
            {surveys.map((survey) => (
              <li key={survey.id} className="estimate-item">
                <div>
                  <div className="estimate-ref">{survey.reference}</div>
                  <div className="muted">
                    {survey.surveyor_name || "Surveyor"} · fee{" "}
                    {new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    }).format(survey.survey_fee)}
                  </div>
                  <div>{survey.diagnosis_summary || "No diagnosis notes"}</div>
                </div>
                <Link
                  className="estimate-action"
                  to={`/estimates/new?survey_id=${survey.id}`}
                >
                  New estimate
                </Link>
              </li>
            ))}
          </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
