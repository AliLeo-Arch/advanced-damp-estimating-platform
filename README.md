# Trade Estimating & Quoting — Local Production Platform

Configurable estimating and quoting platform for specialist contractors: CRM → survey → estimate → margin-controlled sell price → branded quotation PDF → job actuals.

**App version:** `1.0.0-local-prod`  
**Docs pack:** [`docs/VERSION.md`](./docs/VERSION.md) (`1.0.0-trade-estimating`)  
**Branch:** `feature/generic-branding`

## Documentation

Full index: [`docs/README.md`](./docs/README.md)

| Document | Purpose |
|---|---|
| [`docs/ops/CLIENT_HANDOFF.md`](./docs/ops/CLIENT_HANDOFF.md) | **Handoff pack** (start here) |
| [`docs/product/PRODUCT_DEFINITION.md`](./docs/product/PRODUCT_DEFINITION.md) | Generic product definition |
| [`docs/product/UI_UX_ENHANCEMENT_SPECIFICATION.md`](./docs/product/UI_UX_ENHANCEMENT_SPECIFICATION.md) | UI/UX enhancement specification |
| [`docs/ops/CHANGELOG.md`](./docs/ops/CHANGELOG.md) | Feature history |
| [`docs/guides/USER_GUIDE.md`](./docs/guides/USER_GUIDE.md) | Day-to-day user guide |
| [`docs/guides/ADMIN_GUIDE.md`](./docs/guides/ADMIN_GUIDE.md) | Backups, rates, security |
| [`docs/ops/RELEASE_CHECKLIST.md`](./docs/ops/RELEASE_CHECKLIST.md) | Go-live checklist |
| [`docs/ops/SECURITY.md`](./docs/ops/SECURITY.md) | Security notes |
| [`docs/ops/SCRIPTS_REFERENCE.md`](./docs/ops/SCRIPTS_REFERENCE.md) | PowerShell scripts |

### Branch-separated packs (exact versions)

| Pack | Version | Location |
|---|---|---|
| Trade Estimating docs (this branch) | `1.0.0-trade-estimating` | [`docs/`](./docs/) |
| Trade Estimating demos | `1.0.0` | [`docs/demos/trade-estimating/`](./docs/demos/trade-estimating/) |
| Advanced Damp client archive | `v1.0.0` | [`docs/clients/advanced-damp/`](./docs/clients/advanced-damp/) |

`main` remains the Advanced Damp client delivery line. This branch keeps the Advanced Damp pack frozen under `docs/clients/advanced-damp/v1.0.0/` for reference only.

## Stack

- **Frontend:** React + TypeScript (Vite) — port 5173
- **Backend:** Python FastAPI — port 8000
- **Database:** SQLite (`backend/data/trade_estimating_local_prod.db`)

## Run locally

**One command (Windows):**

```powershell
.\scripts\start-local.ps1
```

Opens backend (8000) and frontend (5173) in separate terminals. See `docs/ops/CLIENT_HANDOFF.md` for first-time setup.

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
| Admin | `admin@northbridge-demo.example` | `DemoAdmin1!` |
| Owner | `owner@northbridge-demo.example` | `DemoOwner1!` |
| Surveyor | `james.whitaker@northbridge-demo.example` | `Surveyor1!` |
| Office | `office@northbridge-demo.example` | `DemoOffice1!` |

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
.\scripts\restore.ps1 trade_estimating-YYYYMMDD-HHMMSS.db
.\scripts\register-daily-backup.ps1
```

Or use **Admin** in the app (owner/admin). Restart the backend after restore.

## Tests

```powershell
.\scripts\verify-delivery.ps1
```

## Notes

Placeholder commercial rates are used until the deploying contractor supplies live price lists. See `docs/ops/RELEASE_CHECKLIST.md` before go-live.
