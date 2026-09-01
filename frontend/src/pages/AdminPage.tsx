import { useEffect, useState } from "react";
import {
  EstimateListSkeleton,
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB");
  } catch {
    return iso;
  }
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
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

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
      setMessage(`Backup created: ${row.filename}`);
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
      const result = await restoreBackup(filename);
      await refresh();
      setRestoreTarget(null);
      setMessage(
        `Restored ${result.restored_from}. Restart the backend to reload the database.${
          result.pre_restore_backup
            ? ` Safety copy: ${result.pre_restore_backup}.`
            : ""
        }`,
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
      <section className="stack">
        <div className="page-header">
          <h1 className="page-title">Admin</h1>
          <p className="page-lead">You do not have permission to manage backups.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-lead">
          Database backups and system status for local production.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="panel">{message}</div> : null}

      {system ? (
        <div className="panel">
          <h2 className="panel-title">System</h2>
          <ul className="meta-list">
            <li>
              <span>Application</span>
              <strong>{system.app}</strong>
            </li>
            <li>
              <span>Version</span>
              <strong>{system.version}</strong>
            </li>
            <li>
              <span>Environment</span>
              <strong>{system.environment}</strong>
            </li>
            <li>
              <span>Database</span>
              <strong>{system.database_ok ? "Connected" : "Unavailable"}</strong>
            </li>
            <li>
              <span>Stored backups</span>
              <strong>{system.backup_count}</strong>
            </li>
          </ul>
        </div>
      ) : null}

      <div className="toolbar">
        <LoadingButton
          className="btn btn-primary"
          type="button"
          loading={busy}
          loadingText="Creating backup…"
          disabled={loading}
          onClick={() => void handleCreateBackup()}
        >
          Create backup
        </LoadingButton>
      </div>

      {loading ? (
        <>
          <PanelSkeleton rows={4} />
          <EstimateListSkeleton count={3} />
        </>
      ) : backups.length === 0 ? (
        <div className="panel empty-state">
          <strong>No backups yet</strong>
          Create the first copy before live commercial use.
        </div>
      ) : (
        <div className="panel variance-table-wrap">
          <table className="variance-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((row) => (
                <tr key={row.filename}>
                  <td>{row.filename}</td>
                  <td>{formatBytes(row.size_bytes)}</td>
                  <td>{formatWhen(row.created_at)}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => void handleDownload(row.filename)}
                      >
                        Download
                      </button>
                      {restoreTarget === row.filename ? (
                        <>
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={busy}
                            onClick={() => void handleRestore(row.filename)}
                          >
                            Confirm restore
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={busy}
                            onClick={() => setRestoreTarget(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => setRestoreTarget(row.filename)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel muted">
        Restore replaces the live SQLite database. A pre-restore safety copy is
        created automatically. Restart the backend after restore. See{" "}
        <code>docs/ADMIN_GUIDE.md</code> for PowerShell scripts.
      </div>
    </section>
  );
}
