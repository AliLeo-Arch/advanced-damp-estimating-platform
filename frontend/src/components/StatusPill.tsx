import {
  estimateStatusTone,
  formatEstimateStatus,
  StatusTone,
} from "../estimateStatus";

type StatusPillProps = {
  status?: string;
  label?: string;
  tone?: StatusTone | string;
  locked?: boolean;
  suffix?: string;
  className?: string;
};

export default function StatusPill({
  status,
  label,
  tone,
  locked = false,
  suffix,
  className = "",
}: StatusPillProps) {
  const resolvedTone = tone ?? (status ? estimateStatusTone(status) : "");
  const resolvedLabel =
    label ?? (status ? formatEstimateStatus(status) : "");
  const text = [
    locked ? "Locked" : null,
    resolvedLabel,
    suffix || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span className={`status-pill ${resolvedTone} ${className}`.trim()}>
      {text}
    </span>
  );
}
