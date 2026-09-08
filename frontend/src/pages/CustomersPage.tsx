import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EstimateListSkeleton, LoadingButton } from "../components/Loading";
import SideDrawer from "../components/SideDrawer";
import { createCustomer, Customer, listCustomers } from "../api";

function formatCustomerType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [draftQ, setDraftQ] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  async function refreshCustomers() {
    const rows = await listCustomers();
    setCustomers(rows);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void refreshCustomers()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load customers");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearchQ(draftQ.trim()), 200);
    return () => window.clearTimeout(handle);
  }, [draftQ]);

  const filtered = useMemo(() => {
    if (!searchQ) return customers;
    const needle = searchQ.toLowerCase();
    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.company_name,
        customer.email,
        customer.telephone,
        customer.customer_type,
        customer.notes,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [customers, searchQ]);

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
        company_name: String(form.get("company_name") || "").trim(),
        telephone: String(form.get("telephone") || "").trim(),
        email: String(form.get("email") || "").trim(),
        notes: String(form.get("notes") || "").trim(),
      });
      event.currentTarget.reset();
      setAddOpen(false);
      await refreshCustomers();
      setMessage(`Customer ${customer.name} created.`);
      navigate(`/customers/${customer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack">
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-lead">
          Search and open customer records. Sites, surveys, and estimates live on
          each customer’s detail page.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      <div className="panel stack customer-list-panel">
        <div className="rate-table-header">
          <div>
            <h2 className="panel-title" style={{ margin: 0 }}>
              Customer list
            </h2>
            <p className="muted rate-table-lead">
              {customers.length} customer{customers.length === 1 ? "" : "s"}
              {searchQ
                ? ` · ${filtered.length} match${filtered.length === 1 ? "" : "es"}`
                : ""}
            </p>
          </div>
          <div className="rate-table-header-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              Add customer
            </button>
          </div>
        </div>

        <div className="field rate-search-field">
          <label htmlFor="customer-search-q">Search customers</label>
          <input
            id="customer-search-q"
            type="search"
            placeholder="Name, company, email, telephone…"
            value={draftQ}
            onChange={(event) => setDraftQ(event.target.value)}
            autoComplete="off"
          />
        </div>

        {loading ? (
          <EstimateListSkeleton count={5} />
        ) : filtered.length === 0 ? (
          <div className="empty-state estimates-table-empty">
            <strong>
              {customers.length === 0
                ? "No customers yet"
                : "No customers match your search"}
            </strong>
            <p>
              {customers.length === 0
                ? "Add your first customer to create sites, surveys, and estimates."
                : "Try a different name, company, email, or telephone."}
            </p>
            <div className="step-actions" style={{ justifyContent: "center" }}>
              {customers.length === 0 ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setAddOpen(true)}
                >
                  Add customer
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setDraftQ("");
                    setSearchQ("");
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rate-table-wrap">
            <table className="rate-table customer-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Contact</th>
                  <th scope="col" className="is-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="rate-name">{customer.name}</div>
                      {customer.company_name ? (
                        <div className="muted rate-notes">{customer.company_name}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className="rate-category-pill">
                        {formatCustomerType(customer.customer_type)}
                      </span>
                    </td>
                    <td>
                      <div>{customer.telephone || "—"}</div>
                      <div className="muted">{customer.email || "—"}</div>
                    </td>
                    <td className="is-actions">
                      <Link
                        className="btn btn-secondary btn-compact"
                        to={`/customers/${customer.id}`}
                      >
                        View customer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SideDrawer
        open={addOpen}
        title="Add customer"
        subtitle="Creates a CRM record for sites, surveys, and estimates"
        onClose={() => setAddOpen(false)}
      >
        <form className="rate-drawer-form stack" onSubmit={onCreateCustomer}>
          <div className="field">
            <label htmlFor="add-customer-name">Name</label>
            <input
              id="add-customer-name"
              name="name"
              required
              placeholder="Ms Emma Thompson"
            />
          </div>
          <div className="field">
            <label htmlFor="add-customer-type">Type</label>
            <select
              id="add-customer-type"
              name="customer_type"
              defaultValue="homeowner"
            >
              <option value="homeowner">Homeowner</option>
              <option value="landlord">Landlord</option>
              <option value="commercial">Commercial</option>
              <option value="agent">Agent / HA</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="add-company-name">Company</label>
            <input id="add-company-name" name="company_name" />
          </div>
          <div className="field">
            <label htmlFor="add-telephone">Telephone</label>
            <input id="add-telephone" name="telephone" />
          </div>
          <div className="field">
            <label htmlFor="add-email">Email</label>
            <input id="add-email" name="email" type="email" />
          </div>
          <div className="field">
            <label htmlFor="add-notes">Notes</label>
            <textarea id="add-notes" name="notes" rows={3} />
          </div>
          <div className="side-drawer-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <LoadingButton
              className="btn btn-primary"
              type="submit"
              loading={saving}
              loadingText="Adding…"
            >
              Add customer
            </LoadingButton>
          </div>
        </form>
      </SideDrawer>
    </section>
  );
}
