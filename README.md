# Advanced Damp — Local Production Estimating Platform

Web app for UK damp-proofing surveyors and office staff: CRM → survey → estimate → margin-controlled sell price → branded quotation PDF → job actuals.

**Version:** 1.0.0-local-prod

## Documentation

| Document | Purpose |
|---|---|
| [`Advanced_Damp_Production_Level_Local_Estimating_Platform_Project_Overview.md`](./Advanced_Damp_Production_Level_Local_Estimating_Platform_Project_Overview.md) | Production blueprint |
| [`Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview_v2.md`](./Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview_v2.md) | Original POC overview |
| [`docs/CLIENT_HANDOFF.md`](./docs/CLIENT_HANDOFF.md) | **Client handoff pack** (start here) |
| [`docs/VERCEL_DEPLOYMENT.md`](./docs/VERCEL_DEPLOYMENT.md) | Deploy frontend + API on Vercel |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | Recent features (search, exports, rate table, demos) |
| [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) | Estimate/rate search & export endpoints |
| [`docs/LOCAL_PRODUCTION_ASSUMPTIONS.md`](./docs/LOCAL_PRODUCTION_ASSUMPTIONS.md) | Assumed defaults, lifecycle, permissions |
| [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) | Day-to-day user guide |
| [`docs/ADMIN_GUIDE.md`](./docs/ADMIN_GUIDE.md) | Backups, rates, security |
| [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md) | Go-live checklist |
| [`docs/IMPLEMENTATION_STATUS.md`](./docs/IMPLEMENTATION_STATUS.md) | Phase A–G status and go-live gate |
| [`docs/ACCEPTANCE_TEST_SCENARIOS.md`](./docs/ACCEPTANCE_TEST_SCENARIOS.md) | UAT scenarios A–J (+ K–M) |
| [`docs/HISTORICAL_JOB_VALIDATION.md`](./docs/HISTORICAL_JOB_VALIDATION.md) | Real job sign-off worksheet |
| [`docs/DELIVERY_NOTE.md`](./docs/DELIVERY_NOTE.md) | Short delivery summary for client |
| [`docs/SCRIPTS_REFERENCE.md`](./docs/SCRIPTS_REFERENCE.md) | PowerShell scripts |
| [`docs/RATE_IMPORT.md`](./docs/RATE_IMPORT.md) | Bulk rate CSV import & export |
| [`docs/MOBILE_UI_UX_PRINCIPLES.md`](./docs/MOBILE_UI_UX_PRINCIPLES.md) | Mobile/tablet UX |
| [`docs/UI_UX_DESIGN_SYSTEM.md`](./docs/UI_UX_DESIGN_SYSTEM.md) | Brand and UI rules |

## Stack

- **Frontend:** React + TypeScript (Vite) — port 5173
- **Backend:** Python FastAPI — port 8000
- **Database:** SQLite (`backend/data/advanced_damp_local_prod.db`)

## Run locally

**One command (Windows):**

```powershell
.\scripts\start-local.ps1
```

Opens backend (8000) and frontend (5173) in separate terminals. See `docs/CLIENT_HANDOFF.md` for first-time setup.

**Production mode (single port — recommended on office PC):**

```powershell
.\scripts\start-production.ps1
```

Builds the frontend and serves UI + API at **http://127.0.0.1:8000** (`SERVE_FRONTEND=true`).

If port 8000 is busy, run `.\scripts\stop-servers.ps1` first.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173

If Vite or `npm run build` fails on Windows paths containing `&`, scripts already use `node ./node_modules/...` — run commands from the `frontend/` folder.

## Demo sign-in

| Role | Email | Password |
|---|---|---|
| Admin | `admin@advanceddamp.co.uk` | `AdvancedDamp1!` |
| Owner | `owner@advanceddamp.co.uk` | `OwnerDamp1!` |
| Surveyor | `james.whitaker@advanceddamp.co.uk` | `Surveyor1!` |
| Office | `office@advanceddamp.co.uk` | `OfficeDamp1!` |

Change passwords and JWT secret before live use.

## Features (local production foundation)

- JWT auth with roles and permissions
- Customer / site / survey CRM
- Rate admin with searchable, paginated rate table and commercial settings
- Pricing engine with job-level allowance allocation and PDF-safe reconciliation
- Estimate lifecycle with approval gates and revisions
- Estimate dashboard advanced search, filters, and pagination
- Branded quotation PDF plus CSV and Excel (`.xlsx`) export
- Seeded demo estimates for walkthrough testing
- Job actuals and variance
- Admin backups, logging, health check
- Single-port production mode (`start-production.ps1`)
## Backup

```powershell
.\scripts\backup.ps1
.\scripts\restore.ps1 advanced_damp-YYYYMMDD-HHMMSS.db
```

Or use **Admin** in the app (owner/admin). Restart the backend after restore.

## Tests

```powershell
.\scripts\verify-delivery.ps1
```

## Notes

Placeholder commercial rates are used until Advanced Damp supplies live price lists. See `docs/RELEASE_CHECKLIST.md` before go-live.
