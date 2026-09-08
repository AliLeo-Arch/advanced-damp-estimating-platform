import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  BackupTableSkeleton,
  LoadingButton,
  PanelSkeleton,
} from "../components/Loading";
import {
  createBackup,
  downloadBackup,
  listBackups,
  restoreBackup,
  SystemInfo,
  BackupRow,
  getSystemInfo,
} from "../api";
import { getStoredUser } from "../auth";
import { formatUkDateTime } from "../locale";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(iso: string) {
  return formatUkDateTime(iso, iso);
}

function formatEnvironment(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "local_production") return "Office production";
  if (normalized === "vercel") return "Hosted";
  if (normalized === "demo") return "Demo";
  if (normalized === "development" || normalized === "dev") return "Development";
  return value.replaceAll("_", " ");
}

function backupFreshness(iso: string | null | undefined): {
  label: string;
  tone: "is-success" | "is-warning" | "is-danger";
} {
  if (!iso) {
    return {
      label: "No backup yet — create one before live work",
      tone: "is-danger",
    };
  }
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (Number.isNaN(ageHours)) {
    return { label: "Backup time unavailable", tone: "is-warning" };
  }
  if (ageHours < 24) {
    return { label: "Up to date (within 24 hours)", tone: "is-success" };
  }
  if (ageHours < 72) {
    return {
      label: "Due soon — last backup more than 24 hours ago",
      tone: "is-warning",
    };
  }
  return { label: "Overdue — create a backup now", tone: "is-danger" };
}

export default function AdminPage() {
  const user = getStoredUser();
  const canBackup = Boolean(user?.permissions?.includes("backup"));

  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<BackupRow | null>(null);

  const latestBackup = useMemo(() => backups[0] ?? null, [backups]);
  const freshness = useMemo(
    () => backupFreshness(latestBackup?.created_at),
    [latestBackup],
  );
  const retentionKeep = system?.backup_retention_keep ?? 30;
  const cadenceLabel =
    system?.backup_recommended_cadence === "daily"
      ? "Daily"
      : system?.backup_recommended_cadence || "Daily";

  async function refresh() {
    const [rows, info] = await Promise.all([listBackups(), getSystemInfo()]);
    setBackups(rows);
    setSystem(info);
  }

  useEffect(() => {
    if (!canBackup) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load admin data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canBackup]);

  async function handleCreateBackup() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const row = await createBackup();
      await refresh();
      setMessage(`Backup created successfully (${formatWhen(row.created_at)}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(filename: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await restoreBackup(filename);
      await refresh();
      setRestoreConfirm(null);
      setMessage(
        "Restore complete. A safety copy of the previous data was kept automatically. Refresh the page if displayed data looks out of date.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(filename: string) {
    setError(null);
    try {
      await downloadBackup(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    }
  }

  if (!canBackup) {
    return (
      <section className="stack admin-page">
        <div className="page-header admin-page-header">
          <div className="admin-page-heading">
            <h1 className="page-title">Admin</h1>
            <p className="page-lead">
              You do not have permission to manage backups.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="stack admin-page">
      <div className="page-header admin-page-header">
        <div className="admin-page-heading">
          <h1 className="page-title">Admin</h1>
          <p className="page-lead">
            Backup status, system health, and restore controls for this
            installation.
          </p>
        </div>
        <div className="admin-page-actions">
          <LoadingButton
            className="btn btn-primary"
            type="button"
            loading={busy}
            loadingText="Creating backup…"
            disabled={loading}
            onClick={() => void handleCreateBackup()}
          >
            {backups.length === 0 ? "Create first backup" : "Create backup"}
          </LoadingButton>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      {loading && !system ? (
        <PanelSkeleton rows={4} />
      ) : system ? (
        <section className="panel admin-status-panel">
          <header className="admin-section-header">
            <div>
              <h2 className="panel-title admin-section-title">System status</h2>
              <p className={`backup-freshness ${freshness.tone}`} role="status">
                {freshness.label}
              </p>
            </div>
          </header>

          <div className="admin-stat-grid" aria-label="Backup summary">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Stored backups</span>
              <strong className="admin-stat-value">{system.backup_count}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Retention</span>
              <strong className="admin-stat-value">Latest {retentionKeep}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Cadence</span>
              <strong className="admin-stat-value">{cadenceLabel}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Database</span>
              <strong
                className={`admin-stat-value ${
                  system.database_ok ? "is-ok" : "is-bad"
                }`}
              >
                {system.database_ok ? "Connected" : "Unavailable"}
              </strong>
            </div>
          </div>

          <dl className="admin-meta-grid">
            <div className="admin-meta-item">
              <dt>Last successful backup</dt>
              <dd>
                {latestBackup ? formatWhen(latestBackup.created_at) : "None yet"}
              </dd>
            </div>
            <div className="admin-meta-item">
              <dt>Latest size</dt>
              <dd>
                {latestBackup ? formatBytes(latestBackup.size_bytes) : "—"}
              </dd>
            </div>
            <div className="admin-meta-item">
              <dt>Environment</dt>
              <dd>{formatEnvironment(system.environment)}</dd>
            </div>
            <div className="admin-meta-item">
              <dt>Application</dt>
              <dd title={`${system.app} · v${system.version}`}>
                {system.app}
                <span className="admin-meta-version">v{system.version}</span>
              </dd>
            </div>
          </dl>

          <p className="backup-schedule-note">
            Create a backup at least daily during active quoting, and after
            significant rate or settings changes. Older copies beyond the
            retention limit are pruned automatically when a new backup is
            created.
          </p>
        </section>
      ) : null}

      <section className="panel admin-library-panel">
        <header className="admin-section-header admin-library-header">
          <div>
            <h2 className="panel-title admin-section-title">Backup library</h2>
            <p className="muted admin-section-lead">
              Download a copy for offsite storage, or restore to replace current
              data.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="admin-library-body">
            <BackupTableSkeleton count={4} />
          </div>
        ) : backups.length === 0 ? (
          <div className="empty-state admin-empty">
            <strong>No backups yet</strong>
            <p>
              Create a backup before using this system for live commercial work.
            </p>
            <div className="step-actions" style={{ justifyContent: "center" }}>
              <LoadingButton
                className="btn btn-primary"
                type="button"
                loading={busy}
                loadingText="Creating backup…"
                onClick={() => void handleCreateBackup()}
              >
                Create first backup
              </LoadingButton>
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-backup-table">
              <thead>
                <tr>
                  <th scope="col">Created</th>
                  <th scope="col" className="is-num">
                    Size
                  </th>
                  <th scope="col">File</th>
                  <th scope="col" className="is-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {backups.map((row, index) => (
                  <tr key={row.filename} className={index === 0 ? "is-latest" : undefined}>
                    <td data-label="Created">
                      <div className="admin-backup-when">
                        {formatWhen(row.created_at)}
                        {index === 0 ? (
                          <span className="admin-latest-pill">Latest</span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="Size" className="is-num">
                      {formatBytes(row.size_bytes)}
                    </td>
                    <td data-label="File">
                      <code className="admin-backup-file">{row.filename}</code>
                    </td>
                    <td data-label="Actions" className="is-actions">
                      <div className="admin-row-actions">
                        <button
                          className="btn btn-secondary btn-compact"
                          type="button"
                          onClick={() => void handleDownload(row.filename)}
                        >
                          Download
                        </button>
                        <button
                          className="btn btn-secondary btn-compact"
                          type="button"
                          disabled={busy}
                          onClick={() => setRestoreConfirm(row)}
                        >
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="admin-restore-note">
          Restoring a backup replaces current application data with the selected
          backup. A safety copy is created automatically before restore.
        </p>
      </section>

      <ConfirmDialog
        open={Boolean(restoreConfirm)}
        title="Restore backup?"
        message={
          restoreConfirm
            ? `Restoring the backup from ${formatWhen(restoreConfirm.created_at)} replaces current application data. A safety copy of the current data is created automatically before restore.`
            : ""
        }
        confirmLabel="Restore backup"
        tone="danger"
        busy={busy}
        onCancel={() => {
          if (!busy) setRestoreConfirm(null);
        }}
        onConfirm={() => {
          if (restoreConfirm) void handleRestore(restoreConfirm.filename);
        }}
      />
    </section>
  );
}
