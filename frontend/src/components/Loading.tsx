import type { ButtonHTMLAttributes, ReactNode } from "react";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

export function Spinner({
  size = "md",
  className = "",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      className={`spinner spinner-${size} ${className}`.trim()}
      role="status"
      aria-label={label}
    />
  );
}

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
  className?: string;
};

export function LoadingState({
  label = "Loading…",
  compact = false,
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`loading-state ${compact ? "is-compact" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={compact ? "sm" : "md"} label={label} />
      <p className="loading-state-label">{label}</p>
    </div>
  );
}

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden style={style} />;
}

export function EstimateListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="estimates-table-wrap skeleton-table-wrap" aria-hidden>
      <table className="estimates-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Customer</th>
            <th>Site</th>
            <th>Surveyor</th>
            <th>Survey</th>
            <th>Status</th>
            <th className="is-num">Sell</th>
            <th className="is-num">Margin</th>
            <th className="is-actions">Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }, (_, index) => (
            <tr key={index}>
              <td colSpan={9}>
                <Skeleton className="skeleton-line" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PanelSkeleton({
  title = true,
  rows = 4,
}: {
  title?: boolean;
  rows?: number;
}) {
  return (
    <div className="panel skeleton-panel" aria-hidden>
      {title ? <Skeleton className="skeleton-line skeleton-panel-title" /> : null}
      <div className="skeleton-stack">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="skeleton-line" />
        ))}
      </div>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <section className="stack" aria-busy="true" aria-live="polite">
      <div className="page-header">
        <Skeleton className="skeleton-line skeleton-page-title" />
        <Skeleton className="skeleton-line skeleton-line-muted" />
      </div>
      <div className="workflow-hint skeleton-workflow">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="skeleton-chip" />
        ))}
      </div>
      <PanelSkeleton rows={5} />
      <PanelSkeleton rows={3} />
      <LoadingState label="Loading estimate editor…" compact />
    </section>
  );
}

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: ReactNode;
};

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  className = "",
  disabled,
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      {...rest}
      className={`${className} ${loading ? "is-loading" : ""}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="btn-spinner" label="Working" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function InlineLoading({ label }: { label: string }) {
  return (
    <div className="inline-loading" role="status" aria-live="polite">
      <Spinner size="sm" label={label} />
      <span>{label}</span>
    </div>
  );
}
