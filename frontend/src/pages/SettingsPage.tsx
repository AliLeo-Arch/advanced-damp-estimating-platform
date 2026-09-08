import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FormSkeleton, LoadingButton } from "../components/Loading";
import {
  getPricingSettings,
  PricingSettings,
  updatePricingSettings,
} from "../api";
import { getStoredUser } from "../auth";

const WORK_TYPE_LABELS: Record<string, string> = {
  injection_replaster: "Injection & replastering",
  membrane_waterproofing: "Membrane waterproofing",
  pump_package: "Pump / drainage package",
  timber_remediation: "Timber remedial treatment",
  ventilation_installation: "Ventilation equipment",
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
      <section className="stack settings-page">
        <div className="page-header settings-page-header">
          <div className="settings-page-heading">
            <h1 className="page-title">Settings</h1>
            <p className="page-lead">
              Only owner and admin users can manage company and commercial
              settings.
            </p>
          </div>
        </div>
        <div className="error-banner">
          You do not have permission to view this page.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className="stack settings-page"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="page-header settings-page-header">
          <div className="settings-page-heading">
            <h1 className="page-title">Settings</h1>
            <p className="page-lead">Company identity, quotation defaults, and commercial pricing rules.</p>
          </div>
        </div>
        <FormSkeleton sections={3} fields={6} />
      </section>
    );
  }

  return (
    <section className="stack settings-page">
      <div className="page-header settings-page-header">
        <div className="settings-page-heading">
          <h1 className="page-title">Settings</h1>
          <p className="page-lead">
            Company identity, quotation defaults, and commercial pricing rules.
            {canManageRates ? (
              <>
                {" "}
                Cost rates are managed in <Link to="/rates">Rates</Link>.
              </>
            ) : null}
          </p>
        </div>
        {settings ? (
          <div className="settings-page-actions">
            <LoadingButton
              className="btn btn-primary"
              type="submit"
              form="settings-form"
              loading={saving}
              loadingText="Saving…"
            >
              Save settings
            </LoadingButton>
          </div>
        ) : null}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      {settings ? (
        <form
          id="settings-form"
          className="settings-form stack"
          onSubmit={onSaveSettings}
        >
          <section className="panel settings-section">
            <header className="settings-section-header">
              <h2 className="panel-title settings-section-title">Company</h2>
              <p className="muted settings-section-lead">
                Shown on quotations, PDF letterhead, and the application footer.
              </p>
            </header>

            <div className="settings-grid settings-grid-company">
              <div className="field settings-span-2">
                <label htmlFor="company_display_name">Company name</label>
                <input
                  id="company_display_name"
                  name="company_display_name"
                  defaultValue={settings.company_display_name || ""}
                  required
                  autoComplete="organization"
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

              <div className="field">
                <label htmlFor="company_phone">Phone</label>
                <input
                  id="company_phone"
                  name="company_phone"
                  type="tel"
                  defaultValue={settings.company_phone || ""}
                  autoComplete="tel"
                />
              </div>
              <div className="field settings-span-2">
                <label htmlFor="company_email">Email</label>
                <input
                  id="company_email"
                  name="company_email"
                  type="email"
                  defaultValue={settings.company_email || ""}
                  autoComplete="email"
                />
              </div>

              <div className="field settings-span-3">
                <label htmlFor="company_address">Address</label>
                <input
                  id="company_address"
                  name="company_address"
                  defaultValue={settings.company_address || ""}
                  autoComplete="street-address"
                />
              </div>

              <div className="field">
                <label htmlFor="company_website">Website</label>
                <input
                  id="company_website"
                  name="company_website"
                  type="url"
                  placeholder="https://"
                  defaultValue={settings.company_website || ""}
                  autoComplete="url"
                />
              </div>
              <div className="field settings-span-2">
                <label htmlFor="company_tagline">Quotation tagline</label>
                <input
                  id="company_tagline"
                  name="company_tagline"
                  defaultValue={settings.company_tagline || ""}
                />
              </div>
            </div>
          </section>

          <section className="panel settings-section">
            <header className="settings-section-header">
              <h2 className="panel-title settings-section-title">
                Commercial rules
              </h2>
              <p className="muted settings-section-lead">
                Defaults applied when creating and issuing quotations.
              </p>
            </header>

            <div className="settings-grid settings-grid-commercial">
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
                <label htmlFor="survey_fee_default">
                  Default survey fee (£)
                </label>
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
              <div className="field settings-span-3">
                <label htmlFor="payment_terms">Payment terms</label>
                <textarea
                  id="payment_terms"
                  name="payment_terms"
                  rows={3}
                  defaultValue={settings.payment_terms}
                />
              </div>
            </div>
          </section>

          <section className="panel settings-section">
            <header className="settings-section-header">
              <h2 className="panel-title settings-section-title">
                Work types &amp; margins
              </h2>
              <p className="muted settings-section-lead">
                Target margin percent applied when pricing each work type.
              </p>
            </header>

            <div className="settings-grid settings-grid-margins">
              {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
                <div className="field" key={key}>
                  <label htmlFor={`margin_${key}`}>{label}</label>
                  <div className="settings-input-suffix">
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
                    <span className="settings-suffix" aria-hidden>
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="settings-save-bar">
            <p className="muted settings-save-hint">
              Changes apply to new estimates and quotations after saving.
            </p>
            <LoadingButton className="btn btn-primary" type="submit" loading={saving} loadingText="Saving…">
              Save settings
            </LoadingButton>
          </div>
        </form>
      ) : null}
    </section>
  );
}
