# Scripts Reference

All PowerShell scripts run from the **repository root** unless noted.

## Daily use

| Script | Purpose |
|---|---|
| `start-local.ps1` | Dev mode — backend :8000 + frontend :5173 (two windows) |
| `start-production.ps1` | Production — build frontend, serve all on :8000 |
| `stop-servers.ps1` | Free ports 8000 and 5173 before production start |

## Data & rates

| Script | Purpose |
|---|---|
| `export-rates.ps1` | Export active rates to `backend/data/rates_export.csv` |
| `import-rates.ps1` | Import/update rates from CSV (`-DryRun` to validate) |
| `backup.ps1` | Copy SQLite DB to `backend/data/backups/` |
| `restore.ps1` | Restore DB — `restore.ps1 advanced_damp-YYYYMMDD-HHMMSS.db` |

## Admin & verification

| Script | Purpose |
|---|---|
| `reset-password.ps1` | Reset user password — `reset-password.ps1 email "NewPass1!"` |
| `verify-delivery.ps1` | Full smoke check — tests, benchmarks, rate import/export |

## Examples

```powershell
# First-time office setup after clone
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
cd ..\frontend
npm install

# Production daily start
.\scripts\stop-servers.ps1
.\scripts\start-production.ps1

# Replace seed rates
.\scripts\export-rates.ps1
# Edit backend\data\rates_export.csv in Excel
.\scripts\import-rates.ps1 backend\data\rates_export.csv -DryRun
.\scripts\import-rates.ps1 backend\data\rates_export.csv

# Secure accounts before staff use
.\scripts\reset-password.ps1 admin@advanceddamp.co.uk "YourNewPassword1!"

# Confirm everything works
.\scripts\verify-delivery.ps1
```

## Backend Python scripts

Run from `backend/` or via the PowerShell wrappers above.

| Script | Purpose |
|---|---|
| `scripts/validate_benchmarks.py` | Pricing benchmark report |
| `scripts/import_rates.py` | CSV import (`--dry-run`) |
| `scripts/export_rates.py` | CSV export |
| `scripts/reset_password.py` | Password reset |

## Shared helpers

| File | Purpose |
|---|---|
| `scripts/common.ps1` | Port checks used by start/stop scripts (not run directly) |

See also `docs/CLIENT_HANDOFF.md`, `docs/ADMIN_GUIDE.md`, `docs/RATE_IMPORT.md`.
