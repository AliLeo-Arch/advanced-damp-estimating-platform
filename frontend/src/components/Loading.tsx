import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useDelayedFlag } from "../hooks/useAsyncLoad";

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

export function AppBootScreen({
  label = "Starting Trade Estimating & Quoting…",
}: {
  label?: string;
}) {
  return (
    <div className="app-shell app-boot">
      <div className="app-boot-card" role="status" aria-live="polite" aria-busy="true">
        <img
          className="app-boot-mark"
          src="/brand/trade-estimating-mark.svg"
          alt=""
          width={48}
          height={48}
        />
        <p className="app-boot-title">Trade Estimating</p>
        <p className="app-boot-sub">Quoting</p>
        <LoadingState label={label} compact />
      </div>
    </div>
  );
}

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden style={style} />;
}

export type TableSkeletonColumn = {
  label: string;
  width?: string;
  className?: string;
};

export function TableSkeleton({
  columns,
  rows = 6,
  tableClassName = "estimates-table",
  wrapClassName = "estimates-table-wrap",
}: {
  columns: TableSkeletonColumn[];
  rows?: number;
  tableClassName?: string;
  wrapClassName?: string;
}) {
  return (
    <div className={`${wrapClassName} skeleton-table-wrap`} aria-hidden>
      <table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label} className={column.className} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex} className="skeleton-row">
              {columns.map((column, columnIndex) => (
                <td key={`${rowIndex}-${column.label}`} className={column.className}>
                  <Skeleton
                    className="skeleton-line"
                    style={{
                      width:
                        column.width ||
                        (columnIndex === 0 ? "74%" : columnIndex % 2 ? "58%" : "46%"),
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EstimateListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <TableSkeleton
      rows={count}
      columns={[
        { label: "Reference", width: "68%" },
        { label: "Customer", width: "72%" },
        { label: "Site", width: "80%", className: "is-secondary" },
        { label: "Surveyor", width: "54%", className: "is-secondary" },
        { label: "Survey", width: "48%" },
        { label: "Status", width: "42%" },
        { label: "Sell", width: "56%", className: "is-num" },
        { label: "Margin", width: "40%", className: "is-num" },
        { label: "Action", width: "52%", className: "is-actions" },
      ]}
    />
  );
}

export function RateTableSkeleton({ count = 8 }: { count?: number }) {
  return (
    <TableSkeleton
      rows={count}
      tableClassName="rate-table"
      wrapClassName="rate-table-wrap"
      columns={[
        { label: "Code", width: "78%" },
        { label: "Name", width: "86%" },
        { label: "Category", width: "58%" },
        { label: "Unit", width: "36%" },
        { label: "Cost", width: "52%", className: "is-num" },
        { label: "Waste", width: "36%", className: "is-num" },
        { label: "Status", width: "42%" },
        { label: "Actions", width: "64%", className: "is-actions" },
      ]}
    />
  );
}

export function CustomerTableSkeleton({ count = 6 }: { count?: number }) {
  return (
    <TableSkeleton
      rows={count}
      tableClassName="rate-table customer-table"
      wrapClassName="rate-table-wrap"
      columns={[
        { label: "Name", width: "72%" },
        { label: "Type", width: "48%" },
        { label: "Contact", width: "64%" },
        { label: "Actions", width: "42%", className: "is-actions" },
      ]}
    />
  );
}

export function BackupTableSkeleton({ count = 4 }: { count?: number }) {
  return (
    <TableSkeleton
      rows={count}
      tableClassName="admin-backup-table"
      wrapClassName="admin-table-wrap"
      columns={[
        { label: "Created", width: "62%" },
        { label: "Size", width: "40%", className: "is-num" },
        { label: "File", width: "78%" },
        { label: "Actions", width: "58%", className: "is-actions" },
      ]}
    />
  );
}

export function CountGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="ops-count-grid" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="ops-count-card skeleton-card">
          <Skeleton className="skeleton-line skeleton-line-short" />
          <Skeleton className="skeleton-line skeleton-line-money" />
        </div>
      ))}
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
          <Skeleton
            key={index}
            className={`skeleton-line${index % 3 === 2 ? " skeleton-line-muted" : ""}`}
            style={{ width: index % 2 ? "86%" : "100%" }}
          />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({
  sections = 3,
  fields = 6,
}: {
  sections?: number;
  fields?: number;
}) {
  return (
    <div className="stack" aria-hidden>
      {Array.from({ length: sections }, (_, sectionIndex) => (
        <div key={sectionIndex} className="panel skeleton-panel settings-section">
          <Skeleton className="skeleton-line skeleton-panel-title" />
          <Skeleton className="skeleton-line skeleton-line-muted" style={{ width: "58%", marginBottom: "1rem" }} />
          <div className="settings-grid settings-grid-company">
            {Array.from({ length: fields }, (_, fieldIndex) => (
              <div key={fieldIndex} className="field">
                <Skeleton className="skeleton-line skeleton-line-short" />
                <Skeleton className="skeleton-field" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <section className="stack" aria-busy="true" aria-live="polite">
      <div className="page-header">
        <Skeleton className="skeleton-line skeleton-page-title" />
        <Skeleton className="skeleton-line skeleton-line-muted" />
      </div>
      <div className="customer-tabs" aria-hidden>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="skeleton-chip" />
        ))}
      </div>
      <PanelSkeleton title={false} rows={6} />
    </section>
  );
}

export function EditorSkeleton() {
  return (
    <section className="stack" aria-busy="true" aria-live="polite">
      <div className="page-header">
        <Skeleton className="skeleton-line skeleton-page-title" />
        <Skeleton className="skeleton-line skeleton-line-muted" />
      </div>
      <div className="estimate-command-bar skeleton-card">
        <Skeleton className="skeleton-pill" />
        <Skeleton className="skeleton-chip" />
        <Skeleton className="skeleton-chip" />
      </div>
      <div className="workflow-stepper skeleton-workflow">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="skeleton-chip" />
        ))}
      </div>
      <PanelSkeleton rows={5} />
      <PanelSkeleton rows={3} />
    </section>
  );
}

export function RefreshOverlay({
  active,
  label = "Updating…",
}: {
  active: boolean;
  label?: string;
}) {
  const shown = useDelayedFlag(active, 140);
  if (!shown) return null;
  return (
    <div className="refresh-overlay" role="status" aria-live="polite">
      <Spinner size="sm" label={label} />
      <span>{label}</span>
    </div>
  );
}

export function Refreshable({
  refreshing,
  label = "Updating…",
  className = "",
  children,
}: {
  refreshing: boolean;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`refreshable ${refreshing ? "is-refreshing" : ""} ${className}`.trim()}
      aria-busy={refreshing || undefined}
    >
      {children}
      <RefreshOverlay active={refreshing} label={label} />
    </div>
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
