/** Shared estimate lifecycle status labels, tones, and lock rules. */

export const ESTIMATE_STATUS_OPTIONS = [
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

export type EstimateStatusValue =
  (typeof ESTIMATE_STATUS_OPTIONS)[number]["value"];

/** Semantic chip tones aligned to the lifecycle colour system. */
export type StatusTone =
  | "is-draft"
  | "is-priced"
  | "is-review"
  | "is-approved"
  | "is-ready"
  | "is-quoted"
  | "is-success"
  | "is-danger"
  | "is-expired"
  | "is-closed"
  | "is-warning"
  | "";

export const ESTIMATE_LOCKED_STATUSES = new Set<string>([
  "quoted",
  "accepted",
  "declined",
  "expired",
  "closed",
]);

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  ESTIMATE_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

const STATUS_TONES: Record<string, StatusTone> = {
  draft: "is-draft",
  priced: "is-priced",
  review_required: "is-review",
  approved: "is-approved",
  ready_to_quote: "is-ready",
  quoted: "is-quoted",
  accepted: "is-success",
  declined: "is-danger",
  expired: "is-expired",
  closed: "is-closed",
};

export function formatEstimateStatus(status: string): string {
  if (!status) return "—";
  return STATUS_LABELS[status] || status.replaceAll("_", " ");
}

export function estimateStatusTone(status: string): StatusTone {
  return STATUS_TONES[status] || "is-draft";
}

export function isEstimateLocked(status: string | undefined | null): boolean {
  return Boolean(status && ESTIMATE_LOCKED_STATUSES.has(status));
}

export function estimateOpenActionLabel(status: string): string {
  if (status === "review_required") return "Review";
  if (isEstimateLocked(status)) return "Open";
  return "Edit draft";
}
