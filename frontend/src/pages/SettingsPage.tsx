import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PanelSkeleton } from "../components/Loading";
import {
  getPricingSettings,
  PricingSettings,
  updatePricingSettings,
} from "../api";
import { getStoredUser } from "../auth";

const WORK_TYPE_LABELS: Record<string, string> = {
  injection_replaster: "Injection Treatment & Replastering",
  membrane_waterproofing: "Membrane Waterproofing System",
  pump_package: "Pump / Drainage Package",
  timber_remediation: "Timber Remedial Treatment",
  ventilation_installation: "Ventilation Equipment",
};

export default function SettingsPage() {
  const user = getStoredUser();
  const canManageSettings = Boolean(
    user?.permissions?.includes("manage_settings"),
  );
  const canManageRates = Boolean(user?.permissions?.includes("manage_rates"));

  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canManageSettings) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getPricingSettings()
      .then((pricing) => {
        if (!cancelled) setSettings(pricing);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load settings",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canManageSettings]);

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
        company_display_name: String(form.get("company_display_name") || ""),
        company_phone: String(form.get("company_phone") || ""),
        company_email: String(form.get("company_email") || ""),
        company_address: String(form.get("company_address") || ""),
        company_website: String(form.get("company_website") || ""),
        company_tagline: String(form.get("company_tagline") || ""),
        quote_prefix: String(form.get("quote_prefix") || "EST"),
      });
      setSettings(updated);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!canManageSettings) {
    return (
      <section className="stack">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-lead">
            Only owner and admin users can manage company and commercial
            settings.
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
          <h1 className="page-title">Settings</h1>
          <p className="page-lead">Loading company and commercial settings…</p>
        </div>
        <PanelSkeleton rows={8} />
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-lead">
          Company identity, quotation defaults, and commercial pricing rules.
          {canManageRates ? (
            <>
              {" "}
              Cost rates are managed separately in{" "}
              <Link to="/rates">Rates</Link>.
            </>
          ) : null}
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      {settings ? (
        <form className="panel stack" onSubmit={onSaveSettings}>
          <h2 className="panel-title">Company</h2>
          <p className="muted">
            Used on quotations, PDF letterhead, and the application footer.
          </p>
          <div className="row">
            <div className="field">
              <label htmlFor="company_display_name">Company name</label>
              <input
                id="company_display_name"
                name="company_display_name"
                defaultValue={settings.company_display_name || ""}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="quote_prefix">Quote prefix</label>
              <input
                id="quote_prefix"
                name="quote_prefix"
                defaultValue={settings.quote_prefix || "EST"}
                maxLength={20}
                required
              />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="company_phone">Phone</label>
              <input
                id="company_phone"
                name="company_phone"
                defaultValue={settings.company_phone || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="company_email">Email</label>
              <input
                id="company_email"
                name="company_email"
                type="email"
                defaultValue={settings.company_email || ""}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="company_address">Address</label>
            <input
              id="company_address"
              name="company_address"
              defaultValue={settings.company_address || ""}
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="company_website">Website</label>
              <input
                id="company_website"
                name="company_website"
                defaultValue={settings.company_website || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="company_tagline">Quotation tagline</label>
              <input
                id="company_tagline"
                name="company_tagline"
                defaultValue={settings.company_tagline || ""}
              />
            </div>
          </div>

          <h2 className="panel-title">Commercial rules</h2>
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

          <h2 className="panel-title">Work types &amp; margins</h2>
          <p className="muted">
            Target margin percent applied when pricing each work type.
          </p>
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
    </section>
  );
}
