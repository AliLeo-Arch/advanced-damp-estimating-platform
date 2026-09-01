import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EditorSkeleton } from "../components/Loading";
import {
  approveEstimate,
  createEstimate,
  Estimate,
  EstimatePayload,
  formatMoney,
  getEstimate,
  getJobActuals,
  getPricingSettings,
  getQuotation,
  getSurvey,
  JobActuals,
  listRates,
  listWorkTypes,
  PricingSettings,
  Quotation,
  RateItem,
  reviseEstimate,
  transitionEstimate,
  updateEstimate,
  updateJobActuals,
  quotationPdfUrl,
  estimateCsvUrl,
  estimateXlsxUrl,
  WorkType,
} from "../api";
import { getStoredUser } from "../auth";

type Step =
  | "customer"
  | "scope"
  | "measurements"
  | "pricing"
  | "quotation"
  | "actuals";

type DraftItem = {
  key: string;
  work_type: string;
  measurements: Record<string, unknown>;
};

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "customer", label: "Customer & site" },
  { id: "scope", label: "Work scope" },
  { id: "measurements", label: "Measurements" },
  { id: "pricing", label: "Price review" },
  { id: "quotation", label: "Quotation" },
  { id: "actuals", label: "Job actuals" },
];

const ACTUALS_STATUSES = new Set(["quoted", "accepted", "closed"]);

const QUOTATION_STATUSES = new Set([
  "priced",
  "ready_to_quote",
  "quoted",
  "approved",
]);

function formatStatusLabel(status: string) {
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

function stepOrder(stepId: Step) {
  return STEPS.findIndex((item) => item.id === stepId);
}

const defaultMeasurements = (workType: string): Record<string, unknown> => {
  switch (workType) {
    case "dpc_replastering":
      return { walls: 1, wall_length_lm: 12, replaster_height_m: 1.2 };
    case "cavity_drain":
      return {
        wall_area_m2: 20,
        floor_area_m2: 10,
        include_battens: true,
        include_boarding: true,
        drainage_channel_lm: 0,
      };
    case "sump_pump":
      return { package: "PKG-SUMP-STD", addons: [] };
    case "timber_treatment":
      return { treatment_area_m2: 20, joist_repairs: 0, floor_renewal_m2: 0 };
    case "ventilation":
      return {
        items: [{ code: "MAT-EXTRACTOR-100", quantity: 1, install: true }],
      };
    default:
      return {};
  }
};

function emptyCustomer() {
  return {
    customer_name: "",
    company_name: "",
    email: "",
    telephone: "",
    site_address: "",
    postcode: "",
    surveyor: "",
    survey_date: "",
    notes: "",
  };
}

export default function EstimateEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const surveyIdParam = searchParams.get("survey_id");
  const isEdit = Boolean(id);
  const estimateId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("customer");
  const [customer, setCustomer] = useState(emptyCustomer());
  const [linkIds, setLinkIds] = useState<{
    customer_id: number | null;
    site_id: number | null;
    survey_id: number | null;
  }>({ customer_id: null, site_id: null, survey_id: null });
  const [linkedSurveyRef, setLinkedSurveyRef] = useState<string | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [travelBand, setTravelBand] = useState("TRV-LOCAL");
  const [wasteCode, setWasteCode] = useState("WS-ALLOW-SMALL");
  const [prelimCodes, setPrelimCodes] = useState<string[]>(["PRE-STD"]);
  const [overrideSell, setOverrideSell] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [jobActuals, setJobActuals] = useState<JobActuals | null>(null);
  const [actualsForm, setActualsForm] = useState({
    materials_actual: "",
    labour_actual: "",
    waste_actual: "",
    travel_actual: "",
    prelims_actual: "",
    other_actual: "",
    revenue_actual: "",
    notes: "",
  });
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTypes = useMemo(
    () => new Set(items.map((item) => item.work_type)),
    [items],
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const [types, rateRows, pricing] = await Promise.all([
          listWorkTypes(),
          listRates(),
          getPricingSettings(),
        ]);
        if (cancelled) return;
        setWorkTypes(types);
        setRates(rateRows);
        setSettings(pricing);

        if (isEdit && estimateId && !Number.isNaN(estimateId)) {
          const row = await getEstimate(estimateId);
          if (cancelled) return;
          setEstimate(row);
          setLinkIds({
            customer_id: row.customer_id ?? null,
            site_id: row.site_id ?? null,
            survey_id: row.survey_id ?? null,
          });
          if (row.survey_id) {
            try {
              const survey = await getSurvey(row.survey_id);
              if (!cancelled) setLinkedSurveyRef(survey.reference);
            } catch {
              setLinkedSurveyRef(`Survey #${row.survey_id}`);
            }
          }
          setCustomer({
            customer_name: row.customer_name,
            company_name: row.company_name || "",
            email: row.email || "",
            telephone: row.telephone || "",
            site_address: row.site_address,
            postcode: row.postcode,
            surveyor: row.surveyor,
            survey_date: row.survey_date || "",
            notes: row.notes,
          });
          setTravelBand(row.travel_band_code || "TRV-LOCAL");
          setWasteCode(row.waste_code || "WS-ALLOW-SMALL");
          setPrelimCodes(row.prelim_codes?.length ? row.prelim_codes : ["PRE-STD"]);
          setOverrideSell(
            row.override_sell_price != null ? String(row.override_sell_price) : "",
          );
          setOverrideReason(row.override_reason || "");
          setItems(
            row.items.map((item, index) => ({
              key: `${item.work_type}-${item.id || index}`,
              work_type: item.work_type,
              measurements: item.measurements || defaultMeasurements(item.work_type),
            })),
          );
          if (row.items.length) setStep("scope");
        } else if (surveyIdParam) {
          const surveyId = Number(surveyIdParam);
          if (!Number.isNaN(surveyId)) {
            const survey = await getSurvey(surveyId);
            if (cancelled) return;
            setLinkIds({
              customer_id: survey.customer_id,
              site_id: survey.site_id,
              survey_id: survey.id,
            });
            setLinkedSurveyRef(survey.reference);
            setCustomer({
              customer_name: survey.customer_name,
              company_name: survey.company_name || "",
              email: survey.email || "",
              telephone: survey.telephone || "",
              site_address: survey.site_address,
              postcode: survey.postcode,
              surveyor: survey.surveyor_name || "",
              survey_date: survey.survey_date || "",
              notes: [survey.diagnosis_summary, survey.recommended_works, survey.notes]
                .filter(Boolean)
                .join("\n\n"),
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load editor");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [estimateId, isEdit, surveyIdParam]);

  useEffect(() => {
    if (!estimateId || !estimate || !ACTUALS_STATUSES.has(estimate.status)) {
      setJobActuals(null);
      return;
    }
    let cancelled = false;
    void getJobActuals(estimateId)
      .then((row) => {
        if (cancelled) return;
        setJobActuals(row);
        setActualsForm({
          materials_actual: String(row.materials_actual || ""),
          labour_actual: String(row.labour_actual || ""),
          waste_actual: String(row.waste_actual || ""),
          travel_actual: String(row.travel_actual || ""),
          prelims_actual: String(row.prelims_actual || ""),
          other_actual: String(row.other_actual || ""),
          revenue_actual:
            row.revenue_actual != null ? String(row.revenue_actual) : "",
          notes: row.notes || "",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load actuals");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [estimateId, estimate?.status]);

  function canAccessStep(target: Step) {
    if (target === "customer") return true;
    if (!estimate) return false;
    const hasItems = items.length > 0 || estimate.items.length > 0;
    if (target === "scope") return true;
    if (target === "measurements") return hasItems;
    if (target === "pricing") return hasItems;
    if (target === "quotation") return QUOTATION_STATUSES.has(estimate.status);
    if (target === "actuals") return ACTUALS_STATUSES.has(estimate.status);
    return false;
  }

  async function goToStep(target: Step) {
    if (target === step || !canAccessStep(target)) return;
    if (target === "quotation" && estimate) {
      setSaving(true);
      setError(null);
      try {
        const quote = await getQuotation(estimate.id);
        setQuotation(quote);
        setStep("quotation");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load quotation",
        );
      } finally {
        setSaving(false);
      }
      return;
    }
    setStep(target);
  }

  function toggleWorkType(code: string) {
    setItems((current) => {
      if (current.some((item) => item.work_type === code)) {
        return current.filter((item) => item.work_type !== code);
      }
      return [
        ...current,
        {
          key: `${code}-${Date.now()}`,
          work_type: code,
          measurements: defaultMeasurements(code),
        },
      ];
    });
  }

  function updateMeasurement(key: string, field: string, value: unknown) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, measurements: { ...item.measurements, [field]: value } }
          : item,
      ),
    );
  }

  function buildPayload(extra?: Partial<EstimatePayload>): EstimatePayload {
    return {
      ...customer,
      customer_id: linkIds.customer_id,
      site_id: linkIds.site_id,
      survey_id: linkIds.survey_id,
      travel_band_code: travelBand,
      waste_code: wasteCode,
      prelim_codes: prelimCodes,
      items: items.map((item, index) => ({
        work_type: item.work_type,
        measurements: item.measurements,
        sort_order: index,
      })),
      override_sell_price:
        overrideSell.trim() === "" ? null : Number(overrideSell),
      override_reason: overrideSell.trim() === "" ? "" : overrideReason,
      clear_override: overrideSell.trim() === "",
      ...extra,
    };
  }

  async function saveAndPrice(nextStep?: Step, status?: string) {
    setSaving(true);
    setError(null);
    try {
      if (overrideSell.trim() !== "" && overrideReason.trim() === "") {
        setError("Enter an override reason when setting an override sell price.");
        setSaving(false);
        return null;
      }
      let currentId = estimateId;
      if (!currentId) {
        const created = await createEstimate({
          ...customer,
          customer_id: linkIds.customer_id,
          site_id: linkIds.site_id,
          survey_id: linkIds.survey_id,
        });
        currentId = created.id;
        setLinkIds({
          customer_id: created.customer_id ?? linkIds.customer_id,
          site_id: created.site_id ?? linkIds.site_id,
          survey_id: created.survey_id ?? linkIds.survey_id,
        });
        navigate(`/estimates/${created.id}`, { replace: true });
      }
      const updated = await updateEstimate(
        currentId,
        buildPayload(status ? { status } : undefined),
      );
      setEstimate(updated);
      setOverrideSell(
        updated.override_sell_price != null
          ? String(updated.override_sell_price)
          : "",
      );
      setOverrideReason(updated.override_reason || "");
      if (nextStep === "quotation") {
        if (updated.status === "review_required") {
          setStep("pricing");
          setError(
            "Manager approval is required before generating a quotation (override or below-target margin).",
          );
          return updated;
        }
        const quote = await getQuotation(currentId);
        setQuotation(quote);
      }
      if (nextStep) setStep(nextStep);
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save estimate";
      setError(message);
      if (estimateId) {
        try {
          const row = await getEstimate(estimateId);
          setEstimate(row);
          if (row.status === "review_required") setStep("pricing");
        } catch {
          /* keep previous estimate state */
        }
      }
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function onApprove() {
    if (!estimate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await approveEstimate(
        estimate.id,
        "Approved for quotation",
      );
      setEstimate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve estimate");
    } finally {
      setSaving(false);
    }
  }

  async function onMarkQuoted() {
    if (!estimate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await transitionEstimate(estimate.id, "quoted");
      setEstimate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark as quoted");
    } finally {
      setSaving(false);
    }
  }

  async function onCreateRevision() {
    if (!estimate) return;
    setSaving(true);
    setError(null);
    try {
      const revision = await reviseEstimate(estimate.id);
      navigate(`/estimates/${revision.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create revision");
    } finally {
      setSaving(false);
    }
  }

  async function onMarkAccepted() {
    if (!estimate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await transitionEstimate(estimate.id, "accepted");
      setEstimate(updated);
      setStep("actuals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark as accepted");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveActuals(event: FormEvent) {
    event.preventDefault();
    if (!estimateId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateJobActuals(estimateId, {
        materials_actual: Number(actualsForm.materials_actual || 0),
        labour_actual: Number(actualsForm.labour_actual || 0),
        waste_actual: Number(actualsForm.waste_actual || 0),
        travel_actual: Number(actualsForm.travel_actual || 0),
        prelims_actual: Number(actualsForm.prelims_actual || 0),
        other_actual: Number(actualsForm.other_actual || 0),
        revenue_actual:
          actualsForm.revenue_actual.trim() === ""
            ? null
            : Number(actualsForm.revenue_actual),
        notes: actualsForm.notes,
      });
      setJobActuals(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save actual costs");
    } finally {
      setSaving(false);
    }
  }

  async function onCustomerSubmit(event: FormEvent) {
    event.preventDefault();
    await saveAndPrice("scope");
  }

  function travelRates() {
    return rates.filter((r) => r.category === "travel");
  }
  function wasteRates() {
    return rates.filter((r) => r.category === "waste_skip");
  }
  function prelimRates() {
    return rates.filter((r) => r.category === "preliminaries");
  }
  function sumpPackages() {
    return rates.filter((r) => r.category === "sump_package");
  }
  function ventMaterials() {
    return rates.filter(
      (r) =>
        r.category === "materials" &&
        (r.code.includes("EXTRACTOR") || r.code.includes("PIV")),
    );
  }

  if (loading) return <EditorSkeleton />;

  const user = getStoredUser();
  const canApprove = Boolean(user?.permissions?.includes("approve_override"));
  const canManageActuals = Boolean(user?.permissions?.includes("manage_actuals"));
  const showActuals = Boolean(estimate && ACTUALS_STATUSES.has(estimate.status));
  const locked = Boolean(
    estimate &&
      ["quoted", "accepted", "declined", "expired", "closed"].includes(
        estimate.status,
      ),
  );

  return (
    <section className="stack">
      <div className="page-header page-header-compact">
        <h1 className="page-title">
          {estimate ? `Estimate ${estimate.reference}` : "New estimate"}
        </h1>
        {estimate ? (
          <p className="page-subtitle">
            {estimate.customer_name}
            {estimate.postcode ? ` · ${estimate.postcode}` : ""}
          </p>
        ) : null}
        <p className="page-lead">
          Move from survey details to a margin-controlled quotation.
        </p>
      </div>

      {estimate ? (
        <div className="estimate-command-bar">
          <div className="estimate-command-meta">
            <span className={`status-pill ${statusTone(estimate.status)}`}>
              {formatStatusLabel(estimate.status)}
              {estimate.revision_no && estimate.revision_no > 1
                ? ` · rev ${estimate.revision_no}`
                : ""}
            </span>
            {estimate.sell_price > 0 ? (
              <span className="estimate-meta-chip">
                <span className="estimate-meta-chip-label">Sell</span>
                {formatMoney(estimate.sell_price)}
              </span>
            ) : null}
            {estimate.margin_percent > 0 ? (
              <span className="estimate-meta-chip">
                <span className="estimate-meta-chip-label">Margin</span>
                {estimate.margin_percent.toFixed(1)}%
              </span>
            ) : null}
          </div>
          <div className="estimate-command-actions">
            {estimate.status === "review_required" && canApprove ? (
              <div className="action-group" role="group" aria-label="Approval">
                <span className="action-group-label">Approval</span>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={saving}
                  onClick={() => void onApprove()}
                >
                  Approve for quotation
                </button>
              </div>
            ) : null}
            {(estimate.status === "ready_to_quote" ||
              estimate.status === "quoted") ? (
              <div className="action-group" role="group" aria-label="Quotation">
                <span className="action-group-label">Quotation</span>
                {estimate.status === "ready_to_quote" ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={saving}
                    onClick={() => void onMarkQuoted()}
                  >
                    Mark as quoted
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={saving}
                    onClick={() => void onMarkAccepted()}
                  >
                    Mark as accepted
                  </button>
                )}
              </div>
            ) : null}
            {showActuals ? (
              <div className="action-group" role="group" aria-label="Post-job">
                <span className="action-group-label">Post-job</span>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => void goToStep("actuals")}
                >
                  Job actuals
                </button>
              </div>
            ) : null}
            {locked ||
            estimate.status === "ready_to_quote" ||
            estimate.status === "approved" ? (
              <div className="action-group" role="group" aria-label="Revision">
                <span className="action-group-label">Revision</span>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={saving}
                  onClick={() => void onCreateRevision()}
                >
                  Create revision
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {locked ? (
        <div className="info-banner">
          This estimate is locked ({estimate?.status.replaceAll("_", " ")}).
          Create a revision to make commercial changes.
        </div>
      ) : null}

      {linkedSurveyRef ? (
        <div className="info-banner">
          Linked to survey <strong>{linkedSurveyRef}</strong>
          {linkIds.customer_id ? ` · customer #${linkIds.customer_id}` : ""}
          {linkIds.site_id ? ` · site #${linkIds.site_id}` : ""}.
        </div>
      ) : null}

      <ul className="workflow-stepper" aria-label="Estimating workflow">
        {STEPS.filter(
          (item) => item.id !== "actuals" || showActuals,
        ).map((item, index) => {
          const accessible = canAccessStep(item.id);
          const active = step === item.id;
          const complete = stepOrder(item.id) < stepOrder(step);
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`workflow-step${active ? " is-active" : ""}${complete ? " is-complete" : ""}`}
                disabled={!accessible || saving}
                aria-current={active ? "step" : undefined}
                onClick={() => void goToStep(item.id)}
              >
                <span className="workflow-step-index">Step {index + 1}</span>
                <span className="workflow-step-label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {error ? <div className="error-banner">{error}</div> : null}

      {step === "customer" ? (
        <form className="panel stack" onSubmit={onCustomerSubmit}>
          <h2 className="panel-title">Customer &amp; site</h2>
          <div className="row">
            <div className="field">
              <label htmlFor="customer_name">Customer name</label>
              <input
                id="customer_name"
                required
                value={customer.customer_name}
                onChange={(e) =>
                  setCustomer({ ...customer, customer_name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="surveyor">Surveyor</label>
              <input
                id="surveyor"
                value={customer.surveyor}
                onChange={(e) =>
                  setCustomer({ ...customer, surveyor: e.target.value })
                }
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="site_address">Site address</label>
            <input
              id="site_address"
              value={customer.site_address}
              onChange={(e) =>
                setCustomer({ ...customer, site_address: e.target.value })
              }
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="postcode">Postcode</label>
              <input
                id="postcode"
                value={customer.postcode}
                onChange={(e) =>
                  setCustomer({ ...customer, postcode: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="survey_date">Survey date</label>
              <input
                id="survey_date"
                type="date"
                value={customer.survey_date}
                onChange={(e) =>
                  setCustomer({ ...customer, survey_date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Survey notes</label>
            <textarea
              id="notes"
              rows={3}
              value={customer.notes}
              onChange={(e) =>
                setCustomer({ ...customer, notes: e.target.value })
              }
            />
          </div>
          <div className="step-actions">
            <Link className="btn btn-secondary" to="/">
              Cancel
            </Link>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Continue to work scope"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "scope" ? (
        <div className="panel stack">
          <h2 className="panel-title">Work scope</h2>
          <p className="muted">
            Select one or more treatment types identified on site.
          </p>
          <div className="scope-grid">
            {workTypes.map((type) => {
              const active = selectedTypes.has(type.code);
              return (
                <button
                  key={type.code}
                  type="button"
                  className={`scope-card ${active ? "is-selected" : ""}`}
                  onClick={() => toggleWorkType(type.code)}
                >
                  <strong>{type.label}</strong>
                  <span>{active ? "Selected" : "Add to estimate"}</span>
                </button>
              );
            })}
          </div>
          <div className="step-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setStep("customer")}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!items.length || saving}
              onClick={() => setStep("measurements")}
            >
              Continue to measurements
            </button>
          </div>
        </div>
      ) : null}

      {step === "measurements" ? (
        <div className="stack">
          {items.map((item) => (
            <div className="panel stack" key={item.key}>
              <h2 className="panel-title">
                {workTypes.find((w) => w.code === item.work_type)?.label ||
                  item.work_type}
              </h2>
              {item.work_type === "dpc_replastering" ? (
                <div className="row">
                  <div className="field">
                    <label>Walls</label>
                    <input
                      type="number"
                      min={1}
                      value={Number(item.measurements.walls || 1)}
                      onChange={(e) =>
                        updateMeasurement(item.key, "walls", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Wall length (lm)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={Number(item.measurements.wall_length_lm || 0)}
                      onChange={(e) =>
                        updateMeasurement(
                          item.key,
                          "wall_length_lm",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Replaster height (m)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={Number(item.measurements.replaster_height_m || 0)}
                      onChange={(e) =>
                        updateMeasurement(
                          item.key,
                          "replaster_height_m",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}

              {item.work_type === "cavity_drain" ? (
                <>
                  <div className="row">
                    <div className="field">
                      <label>Wall area (m²)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={Number(item.measurements.wall_area_m2 || 0)}
                        onChange={(e) =>
                          updateMeasurement(
                            item.key,
                            "wall_area_m2",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Floor area (m²)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={Number(item.measurements.floor_area_m2 || 0)}
                        onChange={(e) =>
                          updateMeasurement(
                            item.key,
                            "floor_area_m2",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Drainage channel (lm)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={Number(item.measurements.drainage_channel_lm || 0)}
                        onChange={(e) =>
                          updateMeasurement(
                            item.key,
                            "drainage_channel_lm",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="row">
                    <label className="check-line">
                      <input
                        type="checkbox"
                        checked={Boolean(item.measurements.include_battens)}
                        onChange={(e) =>
                          updateMeasurement(
                            item.key,
                            "include_battens",
                            e.target.checked,
                          )
                        }
                      />
                      Include battens
                    </label>
                    <label className="check-line">
                      <input
                        type="checkbox"
                        checked={Boolean(item.measurements.include_boarding)}
                        onChange={(e) =>
                          updateMeasurement(
                            item.key,
                            "include_boarding",
                            e.target.checked,
                          )
                        }
                      />
                      Include boarding
                    </label>
                  </div>
                </>
              ) : null}

              {item.work_type === "sump_pump" ? (
                <>
                  <div className="field">
                    <label>Package</label>
                    <select
                      value={String(item.measurements.package || "PKG-SUMP-STD")}
                      onChange={(e) =>
                        updateMeasurement(item.key, "package", e.target.value)
                      }
                    >
                      {sumpPackages()
                        .filter((p) => !p.code.includes("BATTERY") && !p.code.includes("ALARM"))
                        .map((pkg) => (
                          <option key={pkg.code} value={pkg.code}>
                            {pkg.name} ({formatMoney(pkg.cost_per_unit)})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="row">
                    {sumpPackages()
                      .filter(
                        (p) =>
                          p.code.includes("BATTERY") || p.code.includes("ALARM"),
                      )
                      .map((addon) => {
                        const addons = (item.measurements.addons as string[]) || [];
                        const checked = addons.includes(addon.code);
                        return (
                          <label className="check-line" key={addon.code}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...addons, addon.code]
                                  : addons.filter((code) => code !== addon.code);
                                updateMeasurement(item.key, "addons", next);
                              }}
                            />
                            {addon.name}
                          </label>
                        );
                      })}
                  </div>
                </>
              ) : null}

              {item.work_type === "timber_treatment" ? (
                <div className="row">
                  <div className="field">
                    <label>Treatment area (m²)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={Number(item.measurements.treatment_area_m2 || 0)}
                      onChange={(e) =>
                        updateMeasurement(
                          item.key,
                          "treatment_area_m2",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Joist repairs</label>
                    <input
                      type="number"
                      min={0}
                      value={Number(item.measurements.joist_repairs || 0)}
                      onChange={(e) =>
                        updateMeasurement(
                          item.key,
                          "joist_repairs",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Floor renewal (m²)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={Number(item.measurements.floor_renewal_m2 || 0)}
                      onChange={(e) =>
                        updateMeasurement(
                          item.key,
                          "floor_renewal_m2",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}

              {item.work_type === "ventilation" ? (
                <div className="stack">
                  {((item.measurements.items as Array<Record<string, unknown>>) || []).map(
                    (ventItem, index) => (
                      <div className="row" key={`${item.key}-vent-${index}`}>
                        <div className="field">
                          <label>Equipment</label>
                          <select
                            value={String(ventItem.code || "")}
                            onChange={(e) => {
                              const next = [
                                ...((item.measurements.items as Array<
                                  Record<string, unknown>
                                >) || []),
                              ];
                              next[index] = { ...ventItem, code: e.target.value };
                              updateMeasurement(item.key, "items", next);
                            }}
                          >
                            {ventMaterials().map((mat) => (
                              <option key={mat.code} value={mat.code}>
                                {mat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label>Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={Number(ventItem.quantity || 1)}
                            onChange={(e) => {
                              const next = [
                                ...((item.measurements.items as Array<
                                  Record<string, unknown>
                                >) || []),
                              ];
                              next[index] = {
                                ...ventItem,
                                quantity: Number(e.target.value),
                              };
                              updateMeasurement(item.key, "items", next);
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ))}

          <div className="panel stack">
            <h2 className="panel-title">Job allowances</h2>
            <div className="row">
              <div className="field">
                <label>Travel band</label>
                <select
                  value={travelBand}
                  onChange={(e) => setTravelBand(e.target.value)}
                >
                  {travelRates().map((rate) => (
                    <option key={rate.code} value={rate.code}>
                      {rate.name} ({formatMoney(rate.cost_per_unit)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Waste / skip</label>
                <select
                  value={wasteCode}
                  onChange={(e) => setWasteCode(e.target.value)}
                >
                  {wasteRates().map((rate) => (
                    <option key={rate.code} value={rate.code}>
                      {rate.name} ({formatMoney(rate.cost_per_unit)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              {prelimRates().map((rate) => {
                const checked = prelimCodes.includes(rate.code);
                return (
                  <label className="check-line" key={rate.code}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setPrelimCodes((current) =>
                          e.target.checked
                            ? [...current, rate.code]
                            : current.filter((code) => code !== rate.code),
                        );
                      }}
                    />
                    {rate.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="step-actions step-actions-sticky">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setStep("scope")}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving}
              onClick={() => void saveAndPrice("pricing")}
            >
              {saving ? "Calculating…" : "Calculate price"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "pricing" && estimate ? (
        <div className="stack">
          <div className="panel stack">
            <div className="toolbar">
              <h2 className="panel-title" style={{ margin: 0 }}>
                Internal price review
              </h2>
              <span className="internal-tag">Internal only</span>
            </div>
            <div className="price-grid">
              <div>
                <span className="muted">Materials</span>
                <div className="money">{formatMoney(estimate.materials_cost)}</div>
              </div>
              <div>
                <span className="muted">Labour</span>
                <div className="money">{formatMoney(estimate.labour_cost)}</div>
              </div>
              <div>
                <span className="muted">Waste</span>
                <div className="money">{formatMoney(estimate.waste_cost)}</div>
              </div>
              <div>
                <span className="muted">Travel</span>
                <div className="money">{formatMoney(estimate.travel_cost)}</div>
              </div>
              <div>
                <span className="muted">Preliminaries</span>
                <div className="money">{formatMoney(estimate.prelim_cost)}</div>
              </div>
              <div>
                <span className="muted">Total cost</span>
                <div className="money">{formatMoney(estimate.total_cost)}</div>
              </div>
            </div>
            <div className="price-grid">
              <div>
                <span className="muted">Target margin</span>
                <div className="money">{estimate.target_margin_percent.toFixed(2)}%</div>
              </div>
              <div>
                <span className="muted">Calculated sell</span>
                <div className="money">
                  {formatMoney(estimate.calculated_sell_price)}
                </div>
              </div>
              <div>
                <span className="muted">Final sell</span>
                <div className="money">{formatMoney(estimate.sell_price)}</div>
              </div>
              <div>
                <span className="muted">Margin value</span>
                <div className="money">{formatMoney(estimate.margin_value)}</div>
              </div>
              <div>
                <span className="muted">Actual margin</span>
                <div
                  className={`money ${estimate.below_target_margin ? "is-danger" : "is-success"}`}
                >
                  {estimate.margin_percent.toFixed(2)}%
                </div>
              </div>
            </div>
            {estimate.min_job_applied ? (
              <div className="info-banner">
                Minimum job value of{" "}
                {formatMoney(settings?.minimum_job_value || 750)} applied.
              </div>
            ) : null}
            {estimate.below_target_margin ? (
              <div className="error-banner">Margin is below target.</div>
            ) : null}
            {Array.isArray(estimate.breakdown?.validation_warnings) &&
            (estimate.breakdown.validation_warnings as string[]).length ? (
              <div className="info-banner">
                {(estimate.breakdown.validation_warnings as string[]).map(
                  (warning) => (
                    <div key={warning}>{warning}</div>
                  ),
                )}
              </div>
            ) : null}
            <p className="muted">
              Work-type sells include allocated waste, travel and prelims, and
              always sum to the job sell price.
            </p>
            <div className="row row-align-end">
              <div className="field">
                <label htmlFor="override_sell">Override sell price (£)</label>
                <input
                  id="override_sell"
                  type="number"
                  min={0}
                  step="0.01"
                  value={overrideSell}
                  onChange={(e) => setOverrideSell(e.target.value)}
                  placeholder="Leave blank for calculated price"
                />
              </div>
              <div className="field">
                <label htmlFor="override_reason">Override reason</label>
                <input
                  id="override_reason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Required when overriding"
                  disabled={overrideSell.trim() === ""}
                />
              </div>
              <button
                className="btn btn-secondary field-action"
                type="button"
                disabled={saving}
                onClick={() => void saveAndPrice("pricing")}
              >
                Recalculate margin
              </button>
            </div>
            <div className="stack">
              {estimate.items.map((item) => (
                <div key={item.id} className="line-summary">
                  <strong>{item.label}</strong>
                  <p className="muted">{item.description}</p>
                  <div className="row">
                    <span>Cost {formatMoney(item.line_cost)}</span>
                    <span>Sell {formatMoney(item.line_sell)}</span>
                    <span>Target {item.target_margin_percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="step-actions step-actions-sticky">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setStep("measurements")}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving}
              onClick={() =>
                void saveAndPrice("quotation", "ready_to_quote")
              }
            >
              {saving ? "Preparing…" : "Generate quotation"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "quotation" && quotation ? (
        <div className="stack">
          <div className="panel stack quote-preview">
            <div className="quote-panel-header">
              <div>
                <h2 className="panel-title" style={{ margin: 0 }}>
                  Customer quotation
                </h2>
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  Review scope and export in your preferred format.
                </p>
              </div>
              <div className="export-cluster">
                <span className="export-cluster-label">Export</span>
                <div className="btn-segment" role="group" aria-label="Export quotation">
                  <a
                    className="btn btn-primary"
                    href={quotationPdfUrl(quotation.estimate.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>
                  <a
                    className="btn btn-secondary"
                    href={estimateCsvUrl(quotation.estimate.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    CSV
                  </a>
                  <a
                    className="btn btn-secondary"
                    href={estimateXlsxUrl(quotation.estimate.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Excel
                  </a>
                </div>
              </div>
            </div>
            <div className="quote-panel-intro muted">
              <span>
                {quotation.company_name} · {quotation.company_address}
              </span>
              <span>
                {quotation.company_phone} · {quotation.company_email}
              </span>
            </div>
            <p>
              <strong>{quotation.estimate.reference}</strong>
              <br />
              {quotation.estimate.customer_name}
              <br />
              {quotation.estimate.site_address} {quotation.estimate.postcode}
            </p>
            <p className="muted">
              Issue date: {quotation.issue_date || "—"}
              {" · "}
              Valid until: {quotation.valid_until || "—"}
            </p>
            <div className="quote-line-grid">
              {quotation.scope_lines.map((line, index) => (
                <div key={`${line.label}-${index}`} className="quote-line-row">
                  <div>
                    <strong>{line.label}</strong>
                    <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                      {line.description}
                    </p>
                  </div>
                  <span className="money">{formatMoney(line.amount)}</span>
                </div>
              ))}
            </div>
            <div className="quote-totals">
              <div>Subtotal (ex VAT): {formatMoney(quotation.estimate.sell_price)}</div>
              <div>
                VAT ({(quotation.vat_rate * 100).toFixed(0)}%):{" "}
                {formatMoney(quotation.vat_amount)}
              </div>
              <div className="money">
                Total (inc VAT): {formatMoney(quotation.total_inc_vat)}
              </div>
            </div>
            {quotation.lines_reconciled ? (
              <p className="muted">
                Line amounts reconcile to subtotal (
                {formatMoney(quotation.line_amount_sum || 0)}).
              </p>
            ) : (
              <div className="error-banner">
                Line amounts do not reconcile to subtotal — regenerate pricing.
              </div>
            )}
            <p className="muted">{quotation.payment_terms}</p>
            <p className="muted">
              Valid for {quotation.validity_days} days
              {quotation.valid_until ? ` (until ${quotation.valid_until})` : ""}.
            </p>
            {quotation.guarantee_wording ? (
              <div>
                <strong>Guarantee</strong>
                <p className="muted">{quotation.guarantee_wording}</p>
              </div>
            ) : null}
            {quotation.survey_fee_credit_wording ? (
              <div>
                <strong>Survey fee</strong>
                <p className="muted">{quotation.survey_fee_credit_wording}</p>
              </div>
            ) : null}
            {quotation.acceptance_instructions ? (
              <div>
                <strong>Acceptance</strong>
                <p className="muted">{quotation.acceptance_instructions}</p>
              </div>
            ) : null}
            <div>
              <strong>Assumptions</strong>
              <ul className="muted">
                {quotation.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Exclusions</strong>
              <ul className="muted">
                {quotation.exclusions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="step-actions step-actions-split step-actions-sticky">
            <div className="step-actions-group">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setStep("pricing")}
              >
                Back to price review
              </button>
              <Link className="btn btn-secondary" to="/">
                Done
              </Link>
            </div>
            {estimate?.status === "ready_to_quote" ? (
              <div className="step-actions-group">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={saving}
                  onClick={() => void onMarkQuoted()}
                >
                  Mark as quoted
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "actuals" && estimate && showActuals ? (
        <div className="stack">
          <div className="panel stack">
            <div className="toolbar">
              <h2 className="panel-title" style={{ margin: 0 }}>
                Quoted vs actual
              </h2>
              <span className="internal-tag">Post-job costing</span>
            </div>
            <p className="muted">
              Compare estimated job costs against actual materials, labour, and
              allowances. Revenue defaults to the quoted sell unless overridden.
            </p>
            {canManageActuals ? (
              <form className="stack" onSubmit={onSaveActuals}>
                <div className="row">
                  <div className="field">
                    <label htmlFor="materials_actual">Materials (£)</label>
                    <input
                      id="materials_actual"
                      type="number"
                      min={0}
                      step="0.01"
                      value={actualsForm.materials_actual}
                      onChange={(e) =>
                        setActualsForm({
                          ...actualsForm,
                          materials_actual: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="labour_actual">Labour (£)</label>
                    <input
                      id="labour_actual"
                      type="number"
                      min={0}
                      step="0.01"
                      value={actualsForm.labour_actual}
                      onChange={(e) =>
                        setActualsForm({
                          ...actualsForm,
                          labour_actual: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="waste_actual">Waste / skip (£)</label>
                    <input
                      id="waste_actual"
                      type="number"
                      min={0}
                      step="0.01"
                      value={actualsForm.waste_actual}
                      onChange={(e) =>
                        setActualsForm({
                          ...actualsForm,
                          waste_actual: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label htmlFor="travel_actual">Travel (£)</label>
                    <input
                      id="travel_actual"
                      type="number"
                      min={0}
                      step="0.01"
                      value={actualsForm.travel_actual}
                      onChange={(e) =>
                        setActualsForm({
                          ...actualsForm,
                          travel_actual: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="prelims_actual">Preliminaries (£)</label>
                    <input
                      id="prelims_actual"
                      type="number"
                      min={0}
                      step="0.01"
                      value={actualsForm.prelims_actual}
                      onChange={(e) =>
                        setActualsForm({
                          ...actualsForm,
                          prelims_actual: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="other_actual">Other (£)</label>
                    <input
                      id="other_actual"
                      type="number"
                      min={0}
                      step="0.01"
                      value={actualsForm.other_actual}
                      onChange={(e) =>
                        setActualsForm({
                          ...actualsForm,
                          other_actual: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="revenue_actual">
                    Revenue / sell (£) — leave blank to use quoted sell
                  </label>
                  <input
                    id="revenue_actual"
                    type="number"
                    min={0}
                    step="0.01"
                    value={actualsForm.revenue_actual}
                    onChange={(e) =>
                      setActualsForm({
                        ...actualsForm,
                        revenue_actual: e.target.value,
                      })
                    }
                    placeholder={String(estimate.sell_price)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="actuals_notes">Notes</label>
                  <textarea
                    id="actuals_notes"
                    rows={2}
                    value={actualsForm.notes}
                    onChange={(e) =>
                      setActualsForm({ ...actualsForm, notes: e.target.value })
                    }
                  />
                </div>
                <div className="step-actions">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save actual costs"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-banner">
                You can view variance here. Only accounts/owner/admin can enter
                actual costs.
              </div>
            )}
          </div>

          {jobActuals ? (
            <div className="panel stack">
              <h2 className="panel-title">Variance summary</h2>
              <div className="variance-table-wrap">
                <table className="variance-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Estimated</th>
                      <th>Actual</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        jobActuals.comparison.materials,
                        jobActuals.comparison.labour,
                        jobActuals.comparison.waste,
                        jobActuals.comparison.travel,
                        jobActuals.comparison.prelims,
                        jobActuals.comparison.other,
                        jobActuals.comparison.total_cost,
                        jobActuals.comparison.revenue,
                        jobActuals.comparison.margin_value,
                      ] as const
                    ).map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td className="money">{formatMoney(row.estimated)}</td>
                        <td className="money">{formatMoney(row.actual)}</td>
                        <td
                          className={`money ${
                            row.variance > 0
                              ? "is-danger"
                              : row.variance < 0
                                ? "is-success"
                                : ""
                          }`}
                        >
                          {formatMoney(row.variance)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>Margin %</td>
                      <td>
                        {jobActuals.comparison.estimated_margin_percent.toFixed(2)}%
                      </td>
                      <td>
                        {jobActuals.comparison.actual_margin_percent.toFixed(2)}%
                      </td>
                      <td
                        className={
                          jobActuals.comparison.margin_percent_variance < 0
                            ? "is-danger"
                            : "is-success"
                        }
                      >
                        {jobActuals.comparison.margin_percent_variance.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="step-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setStep("quotation")}
            >
              Back to quotation
            </button>
            <Link className="btn btn-secondary" to="/">
              Done
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
