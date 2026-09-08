import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import ActionMenu, { ActionMenuItem } from "../components/ActionMenu";
import ActualCostCategory, {
  ActualCostCategoryKey,
} from "../components/ActualCostCategory";
import { EditorSkeleton } from "../components/Loading";
import StatusPill from "../components/StatusPill";
import {
  approveEstimate,
  createActualCostEntry,
  createCustomer,
  createEstimate,
  createSite,
  createSurvey,
  Customer,
  deleteActualCostEntry,
  Estimate,
  EstimatePayload,
  formatMoney,
  getCustomer,
  getEstimate,
  getJobActuals,
  getPricingSettings,
  getQuotation,
  getSurvey,
  JobActuals,
  listCustomers,
  listRates,
  listSites,
  listSurveys,
  listWorkTypes,
  PricingSettings,
  Quotation,
  RateItem,
  reviseEstimate,
  Site,
  Survey,
  transitionEstimate,
  updateEstimate,
  updateJobActuals,
  listEstimateFamily,
  quotationPdfUrl,
  estimateCsvUrl,
  estimateXlsxUrl,
  WorkType,
} from "../api";
import { getStoredUser } from "../auth";
import { formatEstimateStatus, isEstimateLocked } from "../estimateStatus";
import { formatUkDate, formatUkDateTime, formatUkTime } from "../locale";
import { getFieldModeEnabled } from "../components/UserMenu";

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

/** Cost overruns are bad; revenue/margin increases are good. */
function varianceTone(label: string, variance: number | null) {
  if (variance == null || variance === 0) return "";
  const higherIsBetter =
    label.startsWith("Revenue") || label.startsWith("Margin");
  if (higherIsBetter) {
    return variance > 0 ? "is-success" : "is-danger";
  }
  return variance > 0 ? "is-danger" : "is-success";
}

function moneyOrBlank(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function actualFieldValue(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function applyJobActualsToForm(row: JobActuals) {
  return {
    materials_actual: actualFieldValue(row.materials_actual),
    labour_actual: actualFieldValue(row.labour_actual),
    waste_actual: actualFieldValue(row.waste_actual),
    travel_actual: actualFieldValue(row.travel_actual),
    prelims_actual: actualFieldValue(row.prelims_actual),
    other_actual: actualFieldValue(row.other_actual),
    revenue_actual: actualFieldValue(row.revenue_actual),
    notes: row.notes || "",
  };
}

function formatOptionalMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return formatMoney(value);
}

function actualsStatusLabel(status: string) {
  switch (status) {
    case "complete":
      return "Complete";
    case "partial":
      return "Partial";
    default:
      return "Not started";
  }
}

function stepOrder(stepId: Step) {
  return STEPS.findIndex((item) => item.id === stepId);
}

const defaultMeasurements = (workType: string): Record<string, unknown> => {
  switch (workType) {
    case "injection_replaster":
      return { walls: 1, wall_length_lm: 12, replaster_height_m: 1.2 };
    case "membrane_waterproofing":
      return {
        wall_area_m2: 20,
        floor_area_m2: 10,
        include_battens: true,
        include_boarding: true,
        drainage_channel_lm: 0,
      };
    case "pump_package":
      return { package: "PKG-SUMP-STD", addons: [] };
    case "timber_remediation":
      return { treatment_area_m2: 20, joist_repairs: 0, floor_renewal_m2: 0 };
    case "ventilation_installation":
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

function formatSiteAddress(site: Site) {
  return [site.address_line1, site.address_line2, site.town]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function customerLabel(row: Customer) {
  if (row.company_name.trim()) {
    return `${row.name} (${row.company_name})`;
  }
  return row.name;
}

function serializeEstimateDraft(input: {
  customer: ReturnType<typeof emptyCustomer>;
  linkIds: { customer_id: number | null; site_id: number | null; survey_id: number | null };
  items: DraftItem[];
  travelBand: string;
  wasteCode: string;
  prelimCodes: string[];
  overrideSell: string;
  overrideReason: string;
}) {
  return JSON.stringify({
    customer: input.customer,
    linkIds: input.linkIds,
    items: input.items.map((item) => ({
      work_type: item.work_type,
      measurements: item.measurements,
    })),
    travelBand: input.travelBand,
    wasteCode: input.wasteCode,
    prelimCodes: [...input.prelimCodes].sort(),
    overrideSell: input.overrideSell,
    overrideReason: input.overrideReason,
  });
}

type BreakdownLine = {
  work_type?: string;
  label?: string;
  line_cost?: number;
  allocated_job_cost?: number;
  fully_loaded_cost?: number;
  line_sell?: number;
  target_margin_percent?: number;
};

function getBreakdownLines(estimate: Estimate): BreakdownLine[] {
  const lines = estimate.breakdown?.lines;
  return Array.isArray(lines) ? (lines as BreakdownLine[]) : [];
}

export default function EstimateEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const surveyIdParam = searchParams.get("survey_id");
  const customerIdParam = searchParams.get("customer_id");
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
  const [crmCustomers, setCrmCustomers] = useState<Customer[]>([]);
  const [crmSites, setCrmSites] = useState<Site[]>([]);
  const [crmSurveys, setCrmSurveys] = useState<Survey[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    customer_type: "homeowner",
    telephone: "",
    email: "",
  });
  const [newSiteForm, setNewSiteForm] = useState({
    label: "Main property",
    address_line1: "",
    town: "",
    postcode: "",
  });
  const [crmBusy, setCrmBusy] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [travelBand, setTravelBand] = useState("TRV-LOCAL");
  const [wasteCode, setWasteCode] = useState("WS-ALLOW-SMALL");
  const [prelimCodes, setPrelimCodes] = useState<string[]>(["PRE-STD"]);
  const [overrideSell, setOverrideSell] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateFamily, setEstimateFamily] = useState<Estimate[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fieldMode, setFieldMode] = useState(() => getFieldModeEnabled());
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
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [acceptForm, setAcceptForm] = useState({
    accepted_by_name: "",
    acceptance_method: "email",
    acceptance_po_reference: "",
    acceptance_notes: "",
  });
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [workTypeSearch, setWorkTypeSearch] = useState("");
  const [rates, setRates] = useState<RateItem[]>([]);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDraftKey, setSavedDraftKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [baselineEpoch, setBaselineEpoch] = useState(0);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone?: "primary" | "danger";
    run: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const selectedTypes = useMemo(
    () => new Set(items.map((item) => item.work_type)),
    [items],
  );

  const workTypeGroups = useMemo(() => {
    const term = workTypeSearch.trim().toLowerCase();
    const filtered = workTypes.filter((type) => {
      if (!term) return true;
      const haystack = `${type.label} ${type.code} ${type.category || ""}`.toLowerCase();
      return haystack.includes(term);
    });
    const groups = new Map<string, WorkType[]>();
    for (const type of filtered) {
      const category = type.category || "General";
      const bucket = groups.get(category) || [];
      bucket.push(type);
      groups.set(category, bucket);
    }
    return Array.from(groups.entries());
  }, [workTypes, workTypeSearch]);

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return crmCustomers;
    return crmCustomers.filter((row) => {
      const haystack = `${row.name} ${row.company_name} ${row.email} ${row.telephone}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [crmCustomers, customerSearch]);

  const selectedCrmCustomer = useMemo(
    () => crmCustomers.find((row) => row.id === linkIds.customer_id) ?? null,
    [crmCustomers, linkIds.customer_id],
  );
  const selectedCrmSite = useMemo(
    () => crmSites.find((row) => row.id === linkIds.site_id) ?? null,
    [crmSites, linkIds.site_id],
  );

  const draftKey = useMemo(
    () =>
      serializeEstimateDraft({
        customer,
        linkIds,
        items,
        travelBand,
        wasteCode,
        prelimCodes,
        overrideSell,
        overrideReason,
      }),
    [
      customer,
      linkIds,
      items,
      travelBand,
      wasteCode,
      prelimCodes,
      overrideSell,
      overrideReason,
    ],
  );

  useEffect(() => {
    if (loading) return;
    setSavedDraftKey(draftKey);
    if (baselineEpoch > 0 || estimateId) {
      setLastSavedAt(new Date());
    }
    // Capture baseline after load or successful save; ignore draftKey here on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, baselineEpoch]);

  useEffect(() => {
    setSavedDraftKey(null);
    setLastSavedAt(null);
    setBaselineEpoch(0);
    setPendingLeaveHref(null);
  }, [estimateId]);

  const isDirty =
    !loading &&
    savedDraftKey != null &&
    draftKey !== savedDraftKey &&
    !isEstimateLocked(estimate?.status);

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || saving) return;
    function onDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;
      if (next === current) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingLeaveHref(next);
    }
    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [isDirty, saving]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const [types, rateRows, pricing, customers] = await Promise.all([
          listWorkTypes(),
          listRates(),
          getPricingSettings(),
          listCustomers(),
        ]);
        if (cancelled) return;
        setWorkTypes(types);
        setRates(rateRows);
        setSettings(pricing);
        setCrmCustomers(customers);

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
        } else if (customerIdParam) {
          const customerId = Number(customerIdParam);
          if (!Number.isNaN(customerId)) {
            const row =
              customers.find((item) => item.id === customerId) ??
              (await getCustomer(customerId).catch(() => null));
            if (cancelled) return;
            if (row) {
              setLinkIds({
                customer_id: row.id,
                site_id: null,
                survey_id: null,
              });
              setCustomer({
                customer_name: row.name,
                company_name: row.company_name || "",
                email: row.email || "",
                telephone: row.telephone || "",
                site_address: "",
                postcode: "",
                surveyor: "",
                survey_date: "",
                notes: row.notes || "",
              });
              const sites = await listSites(row.id);
              if (cancelled) return;
              setCrmSites(sites);
              if (sites.length === 1) {
                setLinkIds({
                  customer_id: row.id,
                  site_id: sites[0].id,
                  survey_id: null,
                });
                setCustomer((current) => ({
                  ...current,
                  site_address: [
                    sites[0].address_line1,
                    sites[0].address_line2,
                    sites[0].town,
                  ]
                    .filter(Boolean)
                    .join(", "),
                  postcode: sites[0].postcode || "",
                }));
              }
            }
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
  }, [estimateId, isEdit, surveyIdParam, customerIdParam]);

  useEffect(() => {
    if (!estimate?.id) {
      setEstimateFamily([]);
      return;
    }
    let cancelled = false;
    void listEstimateFamily(estimate.id)
      .then((rows) => {
        if (!cancelled) {
          setEstimateFamily(rows);
          if (rows.length > 1) setHistoryOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setEstimateFamily([]);
      });
    return () => {
      cancelled = true;
    };
  }, [estimate?.id]);

  useEffect(() => {
    function syncFieldMode() {
      setFieldMode(getFieldModeEnabled());
    }
    window.addEventListener("teq-field-mode-change", syncFieldMode);
    window.addEventListener("storage", syncFieldMode);
    return () => {
      window.removeEventListener("teq-field-mode-change", syncFieldMode);
      window.removeEventListener("storage", syncFieldMode);
    };
  }, []);

  useEffect(() => {
    if (!linkIds.customer_id) {
      setCrmSites([]);
      return;
    }
    let cancelled = false;
    void listSites(linkIds.customer_id)
      .then((rows) => {
        if (!cancelled) setCrmSites(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load sites");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkIds.customer_id]);

  useEffect(() => {
    if (!linkIds.site_id) {
      setCrmSurveys([]);
      return;
    }
    let cancelled = false;
    void listSurveys(linkIds.site_id)
      .then((rows) => {
        if (!cancelled) setCrmSurveys(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load surveys");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkIds.site_id]);

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
        setActualsForm(applyJobActualsToForm(row));
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

  function applyActualsResponse(row: JobActuals) {
    setJobActuals(row);
    setActualsForm(applyJobActualsToForm(row));
  }

  async function onAddActualEntry(payload: {
    category: ActualCostCategoryKey;
    description: string;
    amount: number;
    occurred_on: string;
    supplier_ref: string;
  }) {
    if (!estimateId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await createActualCostEntry(estimateId, payload);
      applyActualsResponse(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add actual cost entry",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteActualEntry(entryId: number) {
    if (!estimateId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await deleteActualCostEntry(estimateId, entryId);
      applyActualsResponse(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove actual cost entry",
      );
    } finally {
      setSaving(false);
    }
  }

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
    if (isEstimateLocked(estimate?.status)) return;
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
    if (isEstimateLocked(estimate?.status)) return;
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, measurements: { ...item.measurements, [field]: value } }
          : item,
      ),
    );
  }

  function duplicateWorkItem(key: string) {
    if (isEstimateLocked(estimate?.status)) return;
    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      if (index < 0) return current;
      const source = current[index];
      const clone: DraftItem = {
        key: `${source.work_type}-${Date.now()}`,
        work_type: source.work_type,
        measurements: structuredClone(source.measurements),
      };
      const next = [...current];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }

  function removeWorkItem(key: string) {
    if (isEstimateLocked(estimate?.status)) return;
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function moveWorkItem(key: string, direction: -1 | 1) {
    if (isEstimateLocked(estimate?.status)) return;
    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }

  function ventilationRows(item: DraftItem) {
    return (item.measurements.items as Array<Record<string, unknown>>) || [];
  }

  function updateVentilationRows(
    itemKey: string,
    rows: Array<Record<string, unknown>>,
  ) {
    updateMeasurement(itemKey, "items", rows);
  }

  function addVentilationRow(item: DraftItem) {
    if (isEstimateLocked(estimate?.status)) return;
    const materials = ventMaterials();
    const defaultCode = materials[0]?.code || "MAT-EXTRACTOR-100";
    updateVentilationRows(item.key, [
      ...ventilationRows(item),
      { code: defaultCode, quantity: 1, install: true },
    ]);
  }

  function removeVentilationRow(item: DraftItem, index: number) {
    if (isEstimateLocked(estimate?.status)) return;
    const rows = ventilationRows(item).filter((_, rowIndex) => rowIndex !== index);
    updateVentilationRows(
      item.key,
      rows.length
        ? rows
        : [{ code: "MAT-EXTRACTOR-100", quantity: 1, install: true }],
    );
  }

  function moveVentilationRow(item: DraftItem, index: number, direction: -1 | 1) {
    if (isEstimateLocked(estimate?.status)) return;
    const rows = [...ventilationRows(item)];
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const [row] = rows.splice(index, 1);
    rows.splice(target, 0, row);
    updateVentilationRows(item.key, rows);
  }

  function buildPayload(
    extra?: Partial<EstimatePayload>,
    overrideValues?: { sell: string; reason: string },
  ): EstimatePayload {
    const sellValue = overrideValues?.sell ?? overrideSell;
    const reasonValue = overrideValues?.reason ?? overrideReason;
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
      override_sell_price: sellValue.trim() === "" ? null : Number(sellValue),
      override_reason: sellValue.trim() === "" ? "" : reasonValue,
      clear_override: sellValue.trim() === "",
      ...extra,
    };
  }

  async function saveAndPrice(
    nextStep?: Step,
    status?: string,
    overrideValues?: { sell: string; reason: string },
  ) {
    if (isEstimateLocked(estimate?.status)) {
      setError(
        "This estimate is locked. Create a revision to make commercial changes.",
      );
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      const sellValue = overrideValues?.sell ?? overrideSell;
      const reasonValue = overrideValues?.reason ?? overrideReason;
      if (sellValue.trim() !== "" && reasonValue.trim() === "") {
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
        buildPayload(status ? { status } : undefined, {
          sell: sellValue,
          reason: reasonValue,
        }),
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
      setBaselineEpoch((value) => value + 1);
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

  async function onExplicitSave() {
    await saveAndPrice();
  }

  function confirmLeaveWithoutSaving() {
    if (!pendingLeaveHref) return;
    const href = pendingLeaveHref;
    setPendingLeaveHref(null);
    setSavedDraftKey(draftKey);
    navigate(href);
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
    if (quotation && quotation.lines_reconciled === false) {
      setError(
        "Quotation amounts do not reconcile. Recalculate pricing before marking as quoted.",
      );
      return;
    }
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
      const updated = await transitionEstimate(estimate.id, "accepted", "", {
        accepted_by_name: acceptForm.accepted_by_name.trim(),
        acceptance_method: acceptForm.acceptance_method,
        acceptance_po_reference: acceptForm.acceptance_po_reference.trim(),
        acceptance_notes: acceptForm.acceptance_notes.trim(),
      });
      setEstimate(updated);
      setShowAcceptForm(false);
      setStep("actuals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark as accepted");
    } finally {
      setSaving(false);
    }
  }

  async function onLifecycleTransition(status: string, notes = "") {
    if (!estimate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await transitionEstimate(estimate.id, status, notes);
      setEstimate(updated);
      setShowAcceptForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Could not mark as ${status}`,
      );
    } finally {
      setSaving(false);
    }
  }

  function requestMarkQuoted() {
    if (!estimate) return;
    if (quotation && quotation.lines_reconciled === false) {
      setError(
        "Quotation amounts do not reconcile. Recalculate pricing before marking as quoted.",
      );
      return;
    }
    setPendingConfirm({
      title: "Issue quotation?",
      message: quotation
        ? `This locks ${estimate.reference} as the customer quotation.\n\nIssue date: ${formatUkDate(quotation.issue_date)}\nValid until: ${formatUkDate(quotation.valid_until)}\n\nCommercial details cannot be edited afterwards without creating a revision.`
        : `This locks ${estimate.reference} as the customer quotation. Commercial details cannot be edited afterwards without creating a revision.`,
      confirmLabel: "Issue quotation",
      run: onMarkQuoted,
    });
  }

  function requestCreateRevision() {
    if (!estimate) return;
    setPendingConfirm({
      title: "Create revision?",
      message:
        "A new editable revision will be created from this estimate. The issued quotation on the current version will remain unchanged.",
      confirmLabel: "Create revision",
      run: onCreateRevision,
    });
  }

  function requestMarkAccepted() {
    if (!estimate) return;
    const who = acceptForm.accepted_by_name.trim() || "the customer";
    setPendingConfirm({
      title: "Record acceptance?",
      message: `This marks ${estimate.reference} as accepted by ${who}. Job actuals can then be recorded against the accepted quotation.`,
      confirmLabel: "Record acceptance",
      run: onMarkAccepted,
    });
  }

  function requestLifecycleTransition(
    status: "declined" | "expired" | "closed",
  ) {
    if (!estimate) return;
    const copy = {
      declined: {
        title: "Record customer decline?",
        message: `This records that the customer declined ${estimate.reference}. You can still create a revision later if needed.`,
        confirmLabel: "Record decline",
        tone: "danger" as const,
      },
      expired: {
        title: "Record quotation expired?",
        message: `This records that ${estimate.reference} expired because the quotation validity window has passed.`,
        confirmLabel: "Record expired",
        tone: "danger" as const,
      },
      closed: {
        title: "Close estimate?",
        message: `This closes ${estimate.reference} and removes it from active commercial follow-up. Closed estimates remain available for history and actuals where applicable.`,
        confirmLabel: "Close estimate",
        tone: "danger" as const,
      },
    }[status];
    setPendingConfirm({
      ...copy,
      run: () => onLifecycleTransition(status),
    });
  }

  async function runPendingConfirm() {
    if (!pendingConfirm) return;
    setConfirmBusy(true);
    try {
      await pendingConfirm.run();
      setPendingConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  async function onSaveActuals(event: FormEvent) {
    event.preventDefault();
    if (!estimateId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateJobActuals(estimateId, {
        materials_actual: moneyOrBlank(actualsForm.materials_actual),
        labour_actual: moneyOrBlank(actualsForm.labour_actual),
        waste_actual: moneyOrBlank(actualsForm.waste_actual),
        travel_actual: moneyOrBlank(actualsForm.travel_actual),
        prelims_actual: moneyOrBlank(actualsForm.prelims_actual),
        other_actual: moneyOrBlank(actualsForm.other_actual),
        revenue_actual: moneyOrBlank(actualsForm.revenue_actual),
        notes: actualsForm.notes,
      });
      setJobActuals(updated);
      setActualsForm(applyJobActualsToForm(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save actual costs");
    } finally {
      setSaving(false);
    }
  }

  async function onCustomerSubmit(event: FormEvent) {
    event.preventDefault();
    if (!linkIds.customer_id || !linkIds.site_id) {
      setError("Select a customer and site before continuing.");
      return;
    }
    if (!customer.customer_name.trim()) {
      setError("Customer name is required.");
      return;
    }
    await saveAndPrice("scope");
  }

  function applyCustomerRecord(row: Customer) {
    setCustomer((current) => ({
      ...current,
      customer_name: row.name,
      company_name: row.company_name || "",
      email: row.email || "",
      telephone: row.telephone || "",
    }));
  }

  function applySiteRecord(row: Site) {
    setCustomer((current) => ({
      ...current,
      site_address: formatSiteAddress(row),
      postcode: row.postcode || "",
    }));
  }

  async function onSelectCustomer(customerId: number | null) {
    setShowAddSite(false);
    setLinkedSurveyRef(null);
    if (!customerId) {
      setLinkIds({ customer_id: null, site_id: null, survey_id: null });
      setCrmSites([]);
      setCrmSurveys([]);
      return;
    }
    const row = crmCustomers.find((item) => item.id === customerId);
    setLinkIds({ customer_id: customerId, site_id: null, survey_id: null });
    setCrmSurveys([]);
    if (row) applyCustomerRecord(row);
    try {
      const sites = await listSites(customerId);
      setCrmSites(sites);
      if (sites.length === 1) {
        setLinkIds({
          customer_id: customerId,
          site_id: sites[0].id,
          survey_id: null,
        });
        applySiteRecord(sites[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sites");
    }
  }

  async function onSelectSite(siteId: number | null) {
    setLinkedSurveyRef(null);
    if (!siteId || !linkIds.customer_id) {
      setLinkIds((current) => ({
        ...current,
        site_id: null,
        survey_id: null,
      }));
      setCrmSurveys([]);
      return;
    }
    const row = crmSites.find((item) => item.id === siteId);
    setLinkIds((current) => ({
      ...current,
      site_id: siteId,
      survey_id: null,
    }));
    if (row) applySiteRecord(row);
    try {
      const surveys = await listSurveys(siteId);
      setCrmSurveys(surveys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load surveys");
    }
  }

  function onSelectSurvey(surveyId: number | null) {
    if (!surveyId) {
      setLinkIds((current) => ({ ...current, survey_id: null }));
      setLinkedSurveyRef(null);
      return;
    }
    const row = crmSurveys.find((item) => item.id === surveyId);
    setLinkIds((current) => ({ ...current, survey_id: surveyId }));
    if (!row) return;
    setLinkedSurveyRef(row.reference);
    setCustomer((current) => ({
      ...current,
      surveyor: row.surveyor_name || current.surveyor,
      survey_date: row.survey_date || current.survey_date,
      notes:
        current.notes.trim() ||
        [row.diagnosis_summary, row.recommended_works, row.notes]
          .filter(Boolean)
          .join("\n\n"),
    }));
  }

  async function onCreateCrmCustomer(event: FormEvent) {
    event.preventDefault();
    const name = newCustomerForm.name.trim();
    if (!name) {
      setError("Enter a customer name.");
      return;
    }
    setCrmBusy(true);
    setError(null);
    try {
      const created = await createCustomer({
        name,
        customer_type: newCustomerForm.customer_type,
        telephone: newCustomerForm.telephone.trim(),
        email: newCustomerForm.email.trim(),
      });
      setCrmCustomers((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setShowAddCustomer(false);
      setNewCustomerForm({
        name: "",
        customer_type: "homeowner",
        telephone: "",
        email: "",
      });
      await onSelectCustomer(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create customer");
    } finally {
      setCrmBusy(false);
    }
  }

  async function onCreateCrmSite(event: FormEvent) {
    event.preventDefault();
    if (!linkIds.customer_id) {
      setError("Select a customer before adding a site.");
      return;
    }
    const address = newSiteForm.address_line1.trim();
    if (!address) {
      setError("Enter a site address.");
      return;
    }
    setCrmBusy(true);
    setError(null);
    try {
      const created = await createSite(linkIds.customer_id, {
        label: newSiteForm.label.trim() || "Main property",
        address_line1: address,
        town: newSiteForm.town.trim(),
        postcode: newSiteForm.postcode.trim(),
      });
      setCrmSites((current) => [...current, created]);
      setShowAddSite(false);
      setNewSiteForm({
        label: "Main property",
        address_line1: "",
        town: "",
        postcode: "",
      });
      await onSelectSite(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create site");
    } finally {
      setCrmBusy(false);
    }
  }

  async function onCreateCrmSurvey() {
    if (!linkIds.site_id) {
      setError("Select a site before creating a survey.");
      return;
    }
    setCrmBusy(true);
    setError(null);
    try {
      const created = await createSurvey(linkIds.site_id, {
        survey_date: customer.survey_date || undefined,
        surveyor_name: customer.surveyor || undefined,
        notes: customer.notes || undefined,
      });
      setCrmSurveys((current) => [created, ...current]);
      onSelectSurvey(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create survey");
    } finally {
      setCrmBusy(false);
    }
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
  const locked = isEstimateLocked(estimate?.status);
  const quoteAmountsOk = quotation?.lines_reconciled !== false;
  const saveStateLabel = saving
    ? "Saving…"
    : isDirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${formatUkTime(lastSavedAt)}`
        : "Not saved yet";
  const saveStateTone = saving
    ? "is-saving"
    : isDirty
      ? "is-unsaved"
      : lastSavedAt
        ? "is-saved"
        : "is-idle";

  const primaryCommand = (() => {
    if (!estimate) return null;
    if (estimate.status === "review_required" && canApprove) {
      return {
        label: "Approve for quotation",
        disabled: saving,
        onClick: () => void onApprove(),
      };
    }
    if (estimate.status === "ready_to_quote") {
      return {
        label: "Issue quotation",
        disabled: saving || (quotation != null && !quoteAmountsOk),
        onClick: () => requestMarkQuoted(),
      };
    }
    if (estimate.status === "quoted") {
      return {
        label: showAcceptForm ? "Hide acceptance form" : "Record acceptance",
        disabled: saving,
        onClick: () => setShowAcceptForm((open) => !open),
      };
    }
    if (estimate.status === "accepted" && showActuals) {
      return {
        label: "Job actuals",
        disabled: saving,
        onClick: () => void goToStep("actuals"),
      };
    }
    if (
      locked ||
      estimate.status === "approved"
    ) {
      return {
        label: "Create revision",
        disabled: saving,
        onClick: () => requestCreateRevision(),
      };
    }
    return null;
  })();

  const moreCommandItems: ActionMenuItem[] = (() => {
    if (!estimate) return [];
    const items: ActionMenuItem[] = [];
    const canRevise =
      locked ||
      estimate.status === "ready_to_quote" ||
      estimate.status === "approved";

    if (estimate.status === "quoted") {
      items.push(
        {
          id: "declined",
          label: "Record decline",
          disabled: saving,
          tone: "danger",
          onClick: () => requestLifecycleTransition("declined"),
        },
        {
          id: "expired",
          label: "Record expired",
          disabled: saving,
          tone: "danger",
          onClick: () => requestLifecycleTransition("expired"),
        },
      );
    }

    if (showActuals && estimate.status !== "accepted") {
      items.push({
        id: "actuals",
        label: "Job actuals",
        disabled: saving,
        onClick: () => void goToStep("actuals"),
      });
    }

    if (canRevise && primaryCommand?.label !== "Create revision") {
      items.push({
        id: "revision",
        label: "Create revision",
        disabled: saving,
        onClick: () => requestCreateRevision(),
      });
    }

    if (estimateFamily.length > 1) {
      items.push({
        id: "history",
        label: historyOpen ? "Hide quotation history" : "View quotation history",
        disabled: saving,
        onClick: () => setHistoryOpen((open) => !open),
      });
    }

    if (
      estimate.status === "quoted" ||
      estimate.status === "accepted" ||
      estimate.status === "declined" ||
      estimate.status === "expired"
    ) {
      items.push({
        id: "close",
        label: "Close estimate",
        disabled: saving,
        tone: "danger",
        onClick: () => requestLifecycleTransition("closed"),
      });
    }

    if (estimate.status === "ready_to_quote" && step !== "quotation") {
      items.push({
        id: "view-quote",
        label: "View quotation",
        disabled: saving,
        onClick: () => void goToStep("quotation"),
      });
    }

    return items;
  })();

  return (
    <section className={`stack${locked ? " estimate-editor-locked" : ""}`}>
      <div className="page-header page-header-compact">
        <h1 className="page-title">
          {estimate ? `Estimate ${estimate.reference}` : "New estimate"}
        </h1>
        {estimate ? (
          <p className="page-subtitle">
            {estimate.customer_name}
            {estimate.postcode ? ` · ${estimate.postcode}` : ""}
            {estimate.revision_no && estimate.revision_no > 1
              ? ` · Revision R${estimate.revision_no}`
              : ""}
          </p>
        ) : null}
        <p className="page-lead">
          {locked
            ? "This commercial version is locked. Review the quotation or create a revision to edit."
            : "Move from survey details to a margin-controlled quotation."}
        </p>
        {estimate && estimateFamily.length > 1
          ? (() => {
              const prior = [...estimateFamily]
                .reverse()
                .find(
                  (row) =>
                    row.id !== estimate.id &&
                    (row.status === "quoted" ||
                      row.status === "accepted" ||
                      (row.revision_no || 1) < (estimate.revision_no || 1)),
                );
              if (!prior) return null;
              return (
                <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                  Based on {prior.reference} (
                  {formatEstimateStatus(prior.status)}) · Created{" "}
                  {formatUkDate(estimate.created_at)}
                </p>
              );
            })()
          : null}
      </div>

      {estimate || !locked ? (
        <div className="estimate-command-bar">
          <div className="estimate-command-meta">
            {estimate ? (
              <StatusPill
                status={estimate.status}
                locked={locked}
                suffix={
                  estimate.revision_no && estimate.revision_no > 1
                    ? `rev ${estimate.revision_no}`
                    : undefined
                }
              />
            ) : (
              <StatusPill status="draft" />
            )}
            {!locked ? (
              <span
                className={`save-state-chip ${saveStateTone}`}
                role="status"
                aria-live="polite"
              >
                {saveStateLabel}
              </span>
            ) : null}
            {estimate && estimate.sell_price > 0 ? (
              <span className="estimate-meta-chip">
                <span className="estimate-meta-chip-label">Sell</span>
                {formatMoney(estimate.sell_price)}
              </span>
            ) : null}
            {estimate && estimate.margin_percent > 0 ? (
              <span className="estimate-meta-chip">
                <span className="estimate-meta-chip-label">Margin</span>
                {estimate.margin_percent.toFixed(1)}%
              </span>
            ) : null}
          </div>
          <div className="estimate-command-actions">
            {!locked && isDirty ? (
              <button
                className="btn btn-secondary"
                type="button"
                disabled={saving}
                onClick={() => void onExplicitSave()}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            ) : null}
            {estimate && primaryCommand ? (
              <button
                className="btn btn-primary"
                type="button"
                disabled={primaryCommand.disabled}
                onClick={primaryCommand.onClick}
              >
                {primaryCommand.label}
              </button>
            ) : null}
            {estimate ? (
              <ActionMenu items={moreCommandItems} disabled={saving} />
            ) : null}
          </div>
        </div>
      ) : null}

      {fieldMode && !locked ? (
        <div className="info-banner" role="status">
          <strong>Field mode</strong>
          <span>
            {" "}
            Compact site entry is on. Focus on measurements and save often;
            quotation issue stays on the Quotation step.
          </span>
        </div>
      ) : null}

      {locked ? (
        <div className="lock-banner" role="status">
          <div className="lock-banner-copy">
            <strong>Estimate locked</strong>
            <p>
              This version is {estimate?.status.replaceAll("_", " ")} and
              commercial fields are read-only. Create a revision to change
              scope, measurements, or pricing.
            </p>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={saving}
            onClick={() => requestCreateRevision()}
          >
            Create revision
          </button>
        </div>
      ) : null}

      {estimate && estimateFamily.length > 1 && historyOpen ? (
        <div className="panel stack revision-history-panel" id="quotation-history">
          <div className="toolbar">
            <h2 className="panel-title" style={{ margin: 0 }}>
              Quotation history
            </h2>
            <button
              className="btn btn-secondary btn-compact"
              type="button"
              onClick={() => setHistoryOpen(false)}
            >
              Hide
            </button>
          </div>
          <div className="variance-table-wrap">
            <table className="revision-history-list">
              <thead>
                <tr>
                  <th scope="col">Revision</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="is-num">
                    Sell
                  </th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {estimateFamily.map((row) => {
                  const revLabel =
                    row.revision_no && row.revision_no > 1
                      ? `R${row.revision_no}`
                      : "R1";
                  return (
                    <tr
                      key={row.id}
                      className={row.id === estimate.id ? "is-current" : undefined}
                    >
                      <td>
                        {row.id === estimate.id ? (
                          <strong>
                            {revLabel} · {row.reference}
                          </strong>
                        ) : (
                          <Link to={`/estimates/${row.id}`}>
                            {revLabel} · {row.reference}
                          </Link>
                        )}
                      </td>
                      <td>{formatEstimateStatus(row.status)}</td>
                      <td className="is-num">
                        {row.sell_price > 0 ? formatMoney(row.sell_price) : "—"}
                      </td>
                      <td>{formatUkDate(row.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {showAcceptForm && estimate?.status === "quoted" ? (
        <form
          className="panel stack"
          onSubmit={(event) => {
            event.preventDefault();
            requestMarkAccepted();
          }}
        >
          <h2 className="panel-title">Record acceptance</h2>
          <p className="muted">
            Capture how the customer accepted the quotation before moving to job
            actuals.
          </p>
          <div className="row">
            <div className="field">
              <label htmlFor="accepted_by_name">Accepted by</label>
              <input
                id="accepted_by_name"
                value={acceptForm.accepted_by_name}
                onChange={(event) =>
                  setAcceptForm((current) => ({
                    ...current,
                    accepted_by_name: event.target.value,
                  }))
                }
                placeholder="Customer or contact name"
              />
            </div>
            <div className="field">
              <label htmlFor="acceptance_method">Method</label>
              <select
                id="acceptance_method"
                value={acceptForm.acceptance_method}
                onChange={(event) =>
                  setAcceptForm((current) => ({
                    ...current,
                    acceptance_method: event.target.value,
                  }))
                }
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="verbal">Verbal / on site</option>
                <option value="portal">Portal / written form</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="acceptance_po_reference">PO / order ref</label>
              <input
                id="acceptance_po_reference"
                value={acceptForm.acceptance_po_reference}
                onChange={(event) =>
                  setAcceptForm((current) => ({
                    ...current,
                    acceptance_po_reference: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="acceptance_notes">Notes</label>
            <input
              id="acceptance_notes"
              value={acceptForm.acceptance_notes}
              onChange={(event) =>
                setAcceptForm((current) => ({
                  ...current,
                  acceptance_notes: event.target.value,
                }))
              }
              placeholder="Deposit agreed, start date, etc."
            />
          </div>
          <div className="step-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setShowAcceptForm(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              Confirm acceptance
            </button>
          </div>
        </form>
      ) : null}

      {estimate?.status === "accepted" && estimate.accepted_at ? (
        <div className="info-banner">
          Accepted
          {estimate.accepted_by_name ? ` by ${estimate.accepted_by_name}` : ""}
          {estimate.acceptance_method
            ? ` via ${estimate.acceptance_method}`
            : ""}
          {` on ${formatUkDateTime(estimate.accepted_at)}`}
          {estimate.acceptance_po_reference
            ? ` · PO ${estimate.acceptance_po_reference}`
            : ""}
          .
        </div>
      ) : null}

      {linkedSurveyRef || selectedCrmCustomer || selectedCrmSite ? (
        <div className="info-banner">
          {selectedCrmCustomer ? (
            <>
              Customer <strong>{customerLabel(selectedCrmCustomer)}</strong>
              {selectedCrmCustomer.telephone
                ? ` · ${selectedCrmCustomer.telephone}`
                : ""}
              {selectedCrmCustomer.email
                ? ` · ${selectedCrmCustomer.email}`
                : ""}
            </>
          ) : (
            "Customer details"
          )}
          {selectedCrmSite ? (
            <>
              {" · "}
              Site <strong>{selectedCrmSite.label || "Property"}</strong>
              {selectedCrmSite.postcode
                ? ` · ${selectedCrmSite.postcode}`
                : ""}
            </>
          ) : null}
          {linkedSurveyRef ? (
            <>
              {" · "}
              Survey <strong>{linkedSurveyRef}</strong>
            </>
          ) : null}
          .
        </div>
      ) : null}

      <p className="workflow-progress" aria-live="polite">
        {(() => {
          const visible = STEPS.filter(
            (item) => item.id !== "actuals" || showActuals,
          );
          const index = Math.max(
            0,
            visible.findIndex((item) => item.id === step),
          );
          const current = visible[index];
          return `${index + 1} of ${visible.length} · ${current?.label || "Estimate"}`;
        })()}
      </p>
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
        <form
          className={`panel stack${locked ? " is-readonly" : ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            if (locked) {
              setStep("scope");
              return;
            }
            void onCustomerSubmit(event);
          }}
        >
          <h2 className="panel-title">Customer &amp; site</h2>
          <p className="muted">
            {locked
              ? "Read-only CRM snapshot for this quoted revision."
              : "Link a customer and site from CRM. Identifying details come from those records."}
          </p>
          {!locked && !linkIds.customer_id && customer.customer_name ? (
            <div className="info-banner">
              This estimate still has free-text details
              ({customer.customer_name}). Select a customer and site to link CRM
              records before continuing.
            </div>
          ) : null}
          <fieldset className="readonly-fieldset" disabled={locked}>
            <div className="row">
              <div className="field">
                <label htmlFor="crm_customer_search">Customer</label>
                <input
                  id="crm_customer_search"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers…"
                />
              </div>
              <div className="field">
                <label htmlFor="crm_customer">Select customer</label>
                <select
                  id="crm_customer"
                  required={!locked}
                  value={linkIds.customer_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    void onSelectCustomer(value ? Number(value) : null);
                  }}
                >
                  <option value="">Select customer…</option>
                  {filteredCustomers.map((row) => (
                    <option key={row.id} value={row.id}>
                      {customerLabel(row)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!locked ? (
              <div className="step-actions" style={{ marginTop: 0 }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setShowAddCustomer((open) => !open)}
                >
                  {showAddCustomer ? "Cancel new customer" : "Add new customer"}
                </button>
              </div>
            ) : null}
            {showAddCustomer && !locked ? (
              <div className="panel stack" style={{ margin: 0 }}>
                <h3 className="panel-title" style={{ fontSize: "1rem" }}>
                  New customer
                </h3>
                <div className="row">
                  <div className="field">
                    <label htmlFor="new_customer_name">Name</label>
                    <input
                      id="new_customer_name"
                      value={newCustomerForm.name}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="new_customer_type">Type</label>
                    <select
                      id="new_customer_type"
                      value={newCustomerForm.customer_type}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          customer_type: e.target.value,
                        })
                      }
                    >
                      <option value="homeowner">Homeowner</option>
                      <option value="landlord">Landlord</option>
                      <option value="agent">Agent</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label htmlFor="new_customer_telephone">Telephone</label>
                    <input
                      id="new_customer_telephone"
                      value={newCustomerForm.telephone}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          telephone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="new_customer_email">Email</label>
                    <input
                      id="new_customer_email"
                      type="email"
                      value={newCustomerForm.email}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={crmBusy}
                  onClick={(event) => void onCreateCrmCustomer(event)}
                >
                  {crmBusy ? "Saving…" : "Save customer"}
                </button>
              </div>
            ) : null}

            {selectedCrmCustomer ? (
              <div className="crm-summary">
                <div>
                  <span className="muted">Contact</span>
                  <div>
                    {selectedCrmCustomer.telephone || "No telephone"}
                    {selectedCrmCustomer.email
                      ? ` · ${selectedCrmCustomer.email}`
                      : ""}
                  </div>
                </div>
                <div>
                  <span className="muted">Type</span>
                  <div>{selectedCrmCustomer.customer_type}</div>
                </div>
              </div>
            ) : null}

            <div className="row">
              <div className="field">
                <label htmlFor="crm_site">Site</label>
                <select
                  id="crm_site"
                  required={!locked}
                  disabled={!linkIds.customer_id}
                  value={linkIds.site_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    void onSelectSite(value ? Number(value) : null);
                  }}
                >
                  <option value="">
                    {linkIds.customer_id
                      ? "Select site…"
                      : "Select a customer first"}
                  </option>
                  {crmSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.label || "Property"}
                      {site.postcode ? ` · ${site.postcode}` : ""}
                      {site.address_line1 ? ` — ${site.address_line1}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="crm_survey">Survey</label>
                <select
                  id="crm_survey"
                  disabled={!linkIds.site_id}
                  value={linkIds.survey_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSelectSurvey(value ? Number(value) : null);
                  }}
                >
                  <option value="">
                    {linkIds.site_id
                      ? "Optional — select or create survey"
                      : "Select a site first"}
                  </option>
                  {crmSurveys.map((survey) => (
                    <option key={survey.id} value={survey.id}>
                      {survey.reference}
                      {survey.survey_date
                        ? ` · ${formatUkDate(survey.survey_date)}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!locked && linkIds.customer_id ? (
              <div className="step-actions" style={{ marginTop: 0 }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setShowAddSite((open) => !open)}
                >
                  {showAddSite ? "Cancel new site" : "Add site"}
                </button>
                {linkIds.site_id ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={crmBusy}
                    onClick={() => void onCreateCrmSurvey()}
                  >
                    {crmBusy ? "Creating…" : "Create survey"}
                  </button>
                ) : null}
              </div>
            ) : null}
            {showAddSite && !locked && linkIds.customer_id ? (
              <div className="panel stack" style={{ margin: 0 }}>
                <h3 className="panel-title" style={{ fontSize: "1rem" }}>
                  New site
                </h3>
                <div className="row">
                  <div className="field">
                    <label htmlFor="new_site_label">Label</label>
                    <input
                      id="new_site_label"
                      value={newSiteForm.label}
                      onChange={(e) =>
                        setNewSiteForm({
                          ...newSiteForm,
                          label: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="new_site_address">Address</label>
                    <input
                      id="new_site_address"
                      value={newSiteForm.address_line1}
                      onChange={(e) =>
                        setNewSiteForm({
                          ...newSiteForm,
                          address_line1: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label htmlFor="new_site_town">Town</label>
                    <input
                      id="new_site_town"
                      value={newSiteForm.town}
                      onChange={(e) =>
                        setNewSiteForm({
                          ...newSiteForm,
                          town: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="new_site_postcode">Postcode</label>
                    <input
                      id="new_site_postcode"
                      value={newSiteForm.postcode}
                      onChange={(e) =>
                        setNewSiteForm({
                          ...newSiteForm,
                          postcode: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={crmBusy}
                  onClick={(event) => void onCreateCrmSite(event)}
                >
                  {crmBusy ? "Saving…" : "Save site"}
                </button>
              </div>
            ) : null}

            {selectedCrmSite || customer.site_address ? (
              <div className="crm-summary">
                <div>
                  <span className="muted">Site address</span>
                  <div>
                    {selectedCrmSite
                      ? formatSiteAddress(selectedCrmSite)
                      : customer.site_address}
                    {(selectedCrmSite?.postcode || customer.postcode)
                      ? ` · ${selectedCrmSite?.postcode || customer.postcode}`
                      : ""}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="row">
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
          </fieldset>
          <div className="step-actions">
            <Link className="btn btn-secondary" to="/">
              Back to estimates
            </Link>
            <button className="btn btn-primary" disabled={saving || crmBusy}>
              {saving
                ? "Saving…"
                : locked
                  ? "View work scope"
                  : "Continue to work scope"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "scope" ? (
        <div className={`panel stack${locked ? " is-readonly" : ""}`}>
          <h2 className="panel-title">Work scope</h2>
          <p className="muted">
            {locked
              ? "Work types included in this locked commercial version."
              : "Select the services included in the proposed works."}
          </p>
          {!locked ? (
            <div className="field">
              <label htmlFor="work-type-search">Search work types</label>
              <input
                id="work-type-search"
                type="search"
                placeholder="Name, code, or category…"
                value={workTypeSearch}
                onChange={(event) => setWorkTypeSearch(event.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}
          {workTypeGroups.length === 0 ? (
            <div className="empty-state">
              <strong>No work types match</strong>
              <p className="muted">Try a different search term.</p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setWorkTypeSearch("")}
              >
                Clear search
              </button>
            </div>
          ) : (
            workTypeGroups.map(([category, types]) => (
              <div key={category} className="stack" style={{ gap: "0.55rem" }}>
                <h3 className="scope-category-title">{category}</h3>
                <div className="scope-grid">
                  {types.map((type) => {
                    const active = selectedTypes.has(type.code);
                    return (
                      <button
                        key={type.code}
                        type="button"
                        className={`scope-card${active ? " is-selected" : ""}${locked ? " is-locked" : ""}`}
                        disabled={locked}
                        aria-pressed={active}
                        onClick={() => toggleWorkType(type.code)}
                      >
                        <strong>
                          {active ? "✓ " : ""}
                          {type.label}
                        </strong>
                        <span>
                          {locked
                            ? active
                              ? "Included in quoted revision"
                              : "Not included"
                            : active
                              ? "Selected"
                              : "Add to estimate"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
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
              {locked ? "View measurements" : "Continue to measurements"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "measurements" ? (
        <div className={`stack${locked ? " is-readonly" : ""}`}>
          {locked ? (
            <p className="muted">
              Measurements and allowances are read-only on this locked revision.
            </p>
          ) : null}
          <fieldset className="readonly-fieldset" disabled={locked}>
          {items.map((item, itemIndex) => {
            const workLabel =
              workTypes.find((w) => w.code === item.work_type)?.label ||
              item.work_type;
            const sameTypeCount = items.filter(
              (row) => row.work_type === item.work_type,
            ).length;
            const sameTypeIndex =
              items
                .slice(0, itemIndex + 1)
                .filter((row) => row.work_type === item.work_type).length;
            const ventRows =
              item.work_type === "ventilation_installation"
                ? ventilationRows(item)
                : [];

            return (
            <div className="panel stack measurement-item-panel" key={item.key}>
              <div className="measurement-item-header">
                <div>
                  <p className="measurement-item-index muted">
                    Item {itemIndex + 1}
                    {sameTypeCount > 1 ? ` · ${workLabel} #${sameTypeIndex}` : ""}
                  </p>
                  <h2 className="panel-title" style={{ margin: 0 }}>
                    {workLabel}
                  </h2>
                </div>
                {!locked ? (
                  <div className="measurement-item-actions">
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      disabled={itemIndex === 0}
                      onClick={() => moveWorkItem(item.key, -1)}
                    >
                      Move up
                    </button>
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      disabled={itemIndex >= items.length - 1}
                      onClick={() => moveWorkItem(item.key, 1)}
                    >
                      Move down
                    </button>
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      onClick={() => duplicateWorkItem(item.key)}
                    >
                      Duplicate
                    </button>
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => removeWorkItem(item.key)}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>
              {item.work_type === "injection_replaster" ? (
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

              {item.work_type === "membrane_waterproofing" ? (
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

              {item.work_type === "pump_package" ? (
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

              {item.work_type === "timber_remediation" ? (
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

              {item.work_type === "ventilation_installation" ? (
                <div className="stack repeatable-list">
                  <div className="repeatable-list-header">
                    <h3 className="repeatable-list-title">Ventilation equipment</h3>
                    <p className="muted repeatable-list-lead">
                      {ventRows.length} item{ventRows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {ventRows.map((ventItem, index) => (
                    <div
                      className="repeatable-row"
                      key={`${item.key}-vent-${index}`}
                    >
                      <span className="repeatable-row-index" aria-hidden="true">
                        {index + 1}.
                      </span>
                      <div className="field">
                        <label htmlFor={`${item.key}-vent-code-${index}`}>
                          Equipment
                        </label>
                        <select
                          id={`${item.key}-vent-code-${index}`}
                          value={String(ventItem.code || "")}
                          onChange={(e) => {
                            const next = [...ventRows];
                            next[index] = { ...ventItem, code: e.target.value };
                            updateVentilationRows(item.key, next);
                          }}
                        >
                          {ventMaterials().map((mat) => (
                            <option key={mat.code} value={mat.code}>
                              {mat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field repeatable-qty-field">
                        <label htmlFor={`${item.key}-vent-qty-${index}`}>
                          Qty
                        </label>
                        <input
                          id={`${item.key}-vent-qty-${index}`}
                          type="number"
                          min={1}
                          value={Number(ventItem.quantity || 1)}
                          onChange={(e) => {
                            const next = [...ventRows];
                            next[index] = {
                              ...ventItem,
                              quantity: Number(e.target.value),
                            };
                            updateVentilationRows(item.key, next);
                          }}
                        />
                      </div>
                      {!locked ? (
                        <div className="repeatable-row-actions">
                          <button
                            className="btn btn-secondary btn-compact"
                            type="button"
                            disabled={index === 0}
                            aria-label={`Move equipment ${index + 1} up`}
                            onClick={() => moveVentilationRow(item, index, -1)}
                          >
                            Up
                          </button>
                          <button
                            className="btn btn-secondary btn-compact"
                            type="button"
                            disabled={index >= ventRows.length - 1}
                            aria-label={`Move equipment ${index + 1} down`}
                            onClick={() => moveVentilationRow(item, index, 1)}
                          >
                            Down
                          </button>
                          <button
                            className="btn btn-secondary btn-compact"
                            type="button"
                            aria-label={`Remove equipment ${index + 1}`}
                            onClick={() => removeVentilationRow(item, index)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!locked ? (
                    <div>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => addVentilationRow(item)}
                      >
                        + Add equipment
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            );
          })}

          <div className="panel stack">
            <h2 className="panel-title">Job allowances</h2>
            <div className="allowance-group stack">
              <h3 className="allowance-group-title">Travel &amp; disposal</h3>
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
            </div>
            <div className="allowance-group stack">
              <h3 className="allowance-group-title">Site access &amp; preliminaries</h3>
              <div className="allowance-check-grid">
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
          </div>

          </fieldset>
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
              onClick={() => {
                if (locked) {
                  setStep("pricing");
                  return;
                }
                void saveAndPrice("pricing");
              }}
            >
              {saving
                ? "Calculating…"
                : locked
                  ? "View price review"
                  : "Calculate price"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "pricing" && estimate ? (
        <div className={`stack${locked ? " is-readonly" : ""}`}>
          <div className="panel stack">
            <div className="toolbar">
              <h2 className="panel-title" style={{ margin: 0 }}>
                Internal price review
              </h2>
              <span className="internal-tag">
                {locked ? "Locked · Internal only" : "Internal only"}
              </span>
            </div>

            <div className="cost-allocation-grid">
              <div className="cost-allocation-group">
                <h3 className="cost-allocation-title">Direct work cost</h3>
                <p className="muted cost-allocation-lead">
                  Materials and labour priced on the selected work types.
                </p>
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
                    <span className="muted">Direct subtotal</span>
                    <div className="money">
                      {formatMoney(
                        estimate.materials_cost + estimate.labour_cost,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cost-allocation-group">
                <h3 className="cost-allocation-title">Allocated allowances</h3>
                <p className="muted cost-allocation-lead">
                  Waste, travel, and preliminaries shared across work types by
                  direct cost weight.
                </p>
                <div className="price-grid">
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
                    <span className="muted">Allowances subtotal</span>
                    <div className="money">
                      {formatMoney(
                        estimate.waste_cost +
                          estimate.travel_cost +
                          estimate.prelim_cost,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cost-allocation-group is-total">
                <h3 className="cost-allocation-title">Total priced cost</h3>
                <div className="money cost-allocation-total">
                  {formatMoney(estimate.total_cost)}
                </div>
              </div>
            </div>

            <div className="cost-allocation-group">
              <h3 className="cost-allocation-title">Sell &amp; margin</h3>
              <div className="price-grid">
                <div>
                  <span className="muted">Target margin</span>
                  <div className="money">
                    {estimate.target_margin_percent.toFixed(1)}%
                  </div>
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
                  <div className="margin-health-row">
                    <span
                      className={`money ${
                        estimate.below_target_margin ? "is-danger" : "is-success"
                      }`}
                    >
                      {estimate.margin_percent.toFixed(1)}%
                    </span>
                    <span
                      className={`margin-health-chip ${
                        estimate.below_target_margin ? "is-below" : "is-on-target"
                      }`}
                    >
                      {estimate.below_target_margin
                        ? "Below target"
                        : "On target"}
                    </span>
                  </div>
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

            {locked ? (
              <p className="muted">
                Override controls are unavailable while this estimate is locked.
              </p>
            ) : (
              <div className="stack">
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
                {overrideSell.trim() !== "" ? (
                  <div>
                    <button
                      className="btn btn-secondary btn-compact"
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setOverrideSell("");
                        setOverrideReason("");
                        void saveAndPrice("pricing", undefined, {
                          sell: "",
                          reason: "",
                        });
                      }}
                    >
                      Restore calculated price
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            <div className="stack">
              <div className="work-type-pricing-header">
                <h3 className="cost-allocation-title" style={{ margin: 0 }}>
                  Work-type cost allocation
                </h3>
                <p className="muted" style={{ margin: 0 }}>
                  Each work type shows direct cost, its share of allowances, then
                  the fully loaded cost used for target sell.
                </p>
              </div>
              {estimate.items.map((item, index) => {
                const breakdownLine = getBreakdownLines(estimate)[index];
                const directCost = breakdownLine?.line_cost ?? item.line_cost;
                const allocated =
                  breakdownLine?.allocated_job_cost ??
                  Math.max(0, (breakdownLine?.fully_loaded_cost ?? 0) - directCost);
                const fullyLoaded =
                  breakdownLine?.fully_loaded_cost ??
                  directCost + allocated;
                const targetSell = breakdownLine?.line_sell ?? item.line_sell;
                return (
                  <details
                    key={item.id}
                    className="line-summary line-summary-alloc"
                    open={estimate.items.length <= 2}
                  >
                    <summary className="line-summary-summary">
                      <span className="line-summary-title">{item.label}</span>
                      <span className="line-summary-meta muted">
                        Total priced cost {formatMoney(fullyLoaded)} · Target sell{" "}
                        {formatMoney(targetSell)}
                      </span>
                    </summary>
                    <p className="muted">{item.description}</p>
                    <div className="price-grid line-alloc-grid">
                      <div>
                        <span className="muted">Direct work cost</span>
                        <div className="money">{formatMoney(directCost)}</div>
                      </div>
                      <div>
                        <span className="muted">Allocated allowances</span>
                        <div className="money">{formatMoney(allocated)}</div>
                      </div>
                      <div>
                        <span className="muted">Total priced cost</span>
                        <div className="money">{formatMoney(fullyLoaded)}</div>
                      </div>
                      <div>
                        <span className="muted">Target sell</span>
                        <div className="money">{formatMoney(targetSell)}</div>
                      </div>
                      <div>
                        <span className="muted">Target margin</span>
                        <div className="money">{item.target_margin_percent}%</div>
                      </div>
                    </div>
                  </details>
                );
              })}
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
              onClick={() => {
                if (locked) {
                  setStep("quotation");
                  return;
                }
                void saveAndPrice("quotation", "ready_to_quote");
              }}
            >
              {saving
                ? "Preparing…"
                : locked
                  ? "View quotation"
                  : "Generate quotation"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "quotation" && quotation ? (
        <div className="stack">
          {quotation.lines_reconciled === false ? (
            <div className="error-banner">
              Internal: line amounts do not match the subtotal. Recalculate
              pricing before issuing this quotation.
            </div>
          ) : null}
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
                {quotation.lines_reconciled === false ? (
                  <span className="internal-tag is-warning" title="Internal check">
                    Lines do not balance
                  </span>
                ) : (
                  <span className="internal-tag" title="Internal check">
                    Lines balanced
                  </span>
                )}
                <span className="export-cluster-label">Export</span>
                <div className="btn-segment" role="group" aria-label="Export quotation">
                  {quoteAmountsOk ? (
                    <a
                      className="btn btn-primary"
                      href={quotationPdfUrl(quotation.estimate.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF
                    </a>
                  ) : (
                    <button className="btn btn-primary" type="button" disabled>
                      PDF
                    </button>
                  )}
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
                {quotation.company_website
                  ? ` · ${quotation.company_website}`
                  : ""}
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
              Issue date: {formatUkDate(quotation.issue_date)}
              {" · "}
              Valid until: {formatUkDate(quotation.valid_until)}
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
            <p className="muted">{quotation.payment_terms}</p>
            <p className="muted">
              Valid for {quotation.validity_days} days
              {quotation.valid_until
                ? ` (until ${formatUkDate(quotation.valid_until)})`
                : ""}
              .
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
                Back to estimates
              </Link>
            </div>
            {estimate?.status === "ready_to_quote" ? (
              <div className="step-actions-group">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={saving || !quoteAmountsOk}
                  onClick={() => requestMarkQuoted()}
                >
                  Issue quotation
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
              Leave a category blank until the cost is known. Blank means not
              entered — not £0. Add detailed lines for invoices or labour days;
              those totals roll up automatically. Final actual margin is shown
              only when all cost categories are filled.
            </p>
            {jobActuals ? (
              <div className="info-banner actuals-status-banner">
                <StatusPill
                  label={actualsStatusLabel(jobActuals.status)}
                  tone={
                    jobActuals.status === "complete"
                      ? "is-success"
                      : jobActuals.status === "partial"
                        ? "is-review"
                        : "is-draft"
                  }
                />
                <span>
                  {jobActuals.categories_entered} of {jobActuals.categories_total}{" "}
                  cost categories entered
                </span>
              </div>
            ) : null}
            {jobActuals && jobActuals.categories_entered === 0 ? (
              <div className="empty-state" style={{ padding: "0.75rem 0" }}>
                <strong>No actual costs recorded</strong>
                <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                  Add job costs when work begins or after completion. Blank
                  fields mean not entered — not £0.
                </p>
              </div>
            ) : null}
            {canManageActuals ? (
              <form className="stack" onSubmit={onSaveActuals}>
                {(
                  [
                    {
                      category: "materials" as const,
                      label: "Materials",
                      inputId: "materials_actual",
                      estimated: estimate.materials_cost || 0,
                      formKey: "materials_actual" as const,
                    },
                    {
                      category: "labour" as const,
                      label: "Labour",
                      inputId: "labour_actual",
                      estimated: estimate.labour_cost || 0,
                      formKey: "labour_actual" as const,
                    },
                    {
                      category: "waste" as const,
                      label: "Waste",
                      inputId: "waste_actual",
                      estimated: estimate.waste_cost || 0,
                      formKey: "waste_actual" as const,
                    },
                    {
                      category: "travel" as const,
                      label: "Travel",
                      inputId: "travel_actual",
                      estimated: estimate.travel_cost || 0,
                      formKey: "travel_actual" as const,
                    },
                    {
                      category: "prelims" as const,
                      label: "Preliminaries",
                      inputId: "prelims_actual",
                      estimated: estimate.prelim_cost || 0,
                      formKey: "prelims_actual" as const,
                    },
                    {
                      category: "other" as const,
                      label: "Other",
                      inputId: "other_actual",
                      estimated: 0,
                      formKey: "other_actual" as const,
                    },
                  ] as const
                ).map((item) => {
                  const driven = Boolean(
                    jobActuals?.entry_driven_categories?.includes(item.category),
                  );
                  const entries =
                    jobActuals?.entries?.filter(
                      (row) => row.category === item.category,
                    ) || [];
                  return (
                    <ActualCostCategory
                      key={item.category}
                      category={item.category}
                      label={item.label}
                      inputId={item.inputId}
                      estimated={item.estimated}
                      totalValue={actualsForm[item.formKey]}
                      entries={entries}
                      drivenByEntries={driven}
                      busy={saving}
                      onTotalChange={(value) =>
                        setActualsForm({
                          ...actualsForm,
                          [item.formKey]: value,
                        })
                      }
                      onAddEntry={onAddActualEntry}
                      onDeleteEntry={onDeleteActualEntry}
                    />
                  );
                })}
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
                  />
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    Quoted sell: {formatMoney(estimate.sell_price)}
                  </p>
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
              {jobActuals.status !== "complete" ? (
                <p className="muted">
                  Actual margin is shown only when all six cost categories are
                  entered. Missing values show as “Not entered”, not £0.
                </p>
              ) : null}
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
                        <td className="money">
                          {row.entered
                            ? formatOptionalMoney(row.actual)
                            : "Not entered"}
                        </td>
                        <td
                          className={`money ${varianceTone(row.label, row.variance)}`}
                        >
                          {row.entered
                            ? formatOptionalMoney(row.variance)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>Margin %</td>
                      <td>
                        {jobActuals.comparison.estimated_margin_percent.toFixed(
                          2,
                        )}
                        %
                      </td>
                      <td>
                        {jobActuals.comparison.actual_margin_percent != null
                          ? `${jobActuals.comparison.actual_margin_percent.toFixed(2)}%`
                          : "—"}
                      </td>
                      <td
                        className={
                          jobActuals.comparison.margin_percent_variance == null
                            ? ""
                            : jobActuals.comparison.margin_percent_variance < 0
                              ? "is-danger"
                              : "is-success"
                        }
                      >
                        {jobActuals.comparison.margin_percent_variance != null
                          ? `${jobActuals.comparison.margin_percent_variance.toFixed(2)}%`
                          : "—"}
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
              Back to estimates
            </Link>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.title || ""}
        message={pendingConfirm?.message || ""}
        confirmLabel={pendingConfirm?.confirmLabel || "Confirm"}
        tone={pendingConfirm?.tone || "primary"}
        busy={confirmBusy || saving}
        onCancel={() => {
          if (!confirmBusy) setPendingConfirm(null);
        }}
        onConfirm={() => void runPendingConfirm()}
      />

      <ConfirmDialog
        open={Boolean(pendingLeaveHref)}
        title="Leave without saving?"
        message="You have unsaved changes on this estimate. Leave and discard them, or stay to save."
        confirmLabel="Leave without saving"
        cancelLabel="Stay"
        tone="danger"
        onCancel={() => setPendingLeaveHref(null)}
        onConfirm={confirmLeaveWithoutSaving}
      />
    </section>
  );
}
