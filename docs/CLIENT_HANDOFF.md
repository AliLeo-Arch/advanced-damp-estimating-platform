# Client Handoff — Advanced Damp Estimating Platform

**Version:** 1.0.0-local-prod  
**Prepared for:** Advanced Damp Ltd  
**Deployment model:** Local production (office PC / LAN)

---

## 1. What you are receiving

A working **local estimating and quoting platform** that covers:

- Customer, site, and survey records (CRM-lite)
- Multi work-type estimates with margin control
- Approval workflow for overrides and low margins
- Branded quotation PDF, plus CSV and Excel export
- Advanced estimate search / filters / pagination on the dashboard
- Searchable, paginated rate table for commercial admin
- Seeded demo estimates for walkthrough testing
- Job actuals and variance after acceptance
- Rate and commercial settings administration
- Database backup/restore and operational logging

Built on **seed/assumed commercial rates** until Advanced Damp supplies live price lists. The software is functionally complete; **commercial go-live** requires your rates, historical validation, and sign-off.

---

## 2. Quick start (office PC)

### Prerequisites

- Windows 10/11
- Python 3.11+ and Node.js 18+ installed

### First-time setup

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env — set JWT_SECRET to a long random value

# Frontend
cd ..\frontend
npm install
```

### Daily use

**Terminal 1 — API**

```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

**Terminal 2 — UI**

```powershell
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173** in Chrome or Edge.

**Production mode (recommended on office PC):** single app at **http://127.0.0.1:8000**

```powershell
.\scripts\stop-servers.ps1   # if dev servers still running
.\scripts\start-production.ps1
```

API documentation: **http://127.0.0.1:8000/docs**

---

## 3. Sign-in (change before live use)

| Role | Email | Password |
|---|---|---|
| Admin | admin@advanceddamp.co.uk | AdvancedDamp1! |
| Owner | owner@advanceddamp.co.uk | OwnerDamp1! |
| Surveyor | james.whitaker@advanceddamp.co.uk | Surveyor1! |
| Office | office@advanceddamp.co.uk | OfficeDamp1! |

**Action required:** Change every password and set `JWT_SECRET` in `backend/.env` before staff use.

---

## 4. Typical workflow

1. **Customers** — add customer → site → survey  
2. **New estimate** — from survey (prefilled) or Estimates → New  
   - Or open a seeded demo such as **AD-DEMO-01** for a quick walkthrough  
3. **Work scope** → **Measurements** → **Price review**  
4. If override or low margin → **Review required** → owner/admin **Approve**  
5. **Quotation** — preview, download **PDF / CSV / Excel**, mark as quoted  
6. On job completion — **Job actuals** (accounts/owner/admin)

**Finding work later:** use Estimates search, status chips, and pagination (see `docs/USER_GUIDE.md`).

Mobile/tablet: use the **menu** (top right) for navigation.

---

## 5. Important file locations

| Item | Path |
|---|---|
| Live database | `backend/data/advanced_damp_local_prod.db` |
| Backups | `backend/data/backups/` |
| Application log | `backend/data/logs/app.log` |
| Seed/sample rates | `backend/data/sample_seed.json` |
| Environment config | `backend/.env` |
| Benchmark scenarios | `backend/data/benchmark_jobs.json` |

---

## 6. Backup (do this before go-live)

**From the app:** Sign in as admin/owner → **Admin** → Create backup → Download copy to USB/cloud.

**From PowerShell:**

```powershell
.\scripts\backup.ps1
```

**Restore (test monthly):**

```powershell
.\scripts\restore.ps1 advanced_damp-YYYYMMDD-HHMMSS.db
# Then restart the backend
```

---

## 7. Go-live gate (your actions)

Complete **`docs/RELEASE_CHECKLIST.md`**. Minimum before calling it production-ready:

1. Import **real rates** — export seed rates, edit in Excel, re-import:

```powershell
.\scripts\export-rates.ps1
# Edit backend\data\rates_export.csv
.\scripts\import-rates.ps1 backend\data\rates_export.csv -DryRun
.\scripts\import-rates.ps1 backend\data\rates_export.csv
```

See `docs/RATE_IMPORT.md`.  
2. Confirm margins, min job (£750 assumed), VAT (20%), payment terms  
3. Validate **5–10 historical jobs** — see `docs/HISTORICAL_JOB_VALIDATION.md`  
4. Run acceptance scenarios — `docs/ACCEPTANCE_TEST_SCENARIOS.md`  
5. Sign off sample PDFs and quotation wording  
6. Secure passwords + JWT secret — `docs/SECURITY.md`  
7. Prove backup and restore on the target PC  

---

## 8. Automated validation (developer / IT)

```powershell
.\scripts\verify-delivery.ps1
```

Runs **34 automated tests**, **6 benchmark scenarios**, rate import dry-run, and rate export.

Expected: all steps report **OK** / **passed** on seed rates.

---

## 9. Documentation index

| Document | Purpose |
|---|---|
| `docs/USER_GUIDE.md` | Staff day-to-day use |
| `docs/ADMIN_GUIDE.md` | Rates, backups, security |
| `docs/CHANGELOG.md` | Recent feature summary |
| `docs/API_REFERENCE.md` | Search / export API |
| `docs/RELEASE_CHECKLIST.md` | Go-live checklist |
| `docs/ACCEPTANCE_TEST_SCENARIOS.md` | UAT scenarios A–M |
| `docs/HISTORICAL_JOB_VALIDATION.md` | Real job sign-off worksheet |
| `docs/IMPLEMENTATION_STATUS.md` | What is built vs pending |
| `docs/SECURITY.md` | Security findings and mitigations |
| `docs/LOCAL_PRODUCTION_ASSUMPTIONS.md` | Assumed commercial defaults |
| `docs/MOBILE_UI_UX_PRINCIPLES.md` | Phone/tablet UX |
| `docs/SCRIPTS_REFERENCE.md` | All PowerShell scripts |
| `docs/RATE_IMPORT.md` | Rate CSV import & export |
| `README.md` | Technical overview |

---

## 10. Support and maintenance

| Task | Frequency |
|---|---|
| Database backup | Daily when in active use |
| Restore test | Monthly |
| Review application log | Weekly or after errors |
| Rate updates | As supplier costs change |
| `verify-delivery.ps1` | After code changes or before handoff sign-off |

**Log file:** `backend/data/logs/app.log` — check after unexpected errors.

**Health check:** Dashboard shows **connected** when API and database are OK.

---

## 11. What is intentionally out of scope (v1)

- Full job management / scheduling  
- Accounting integration (Xero, Sage, etc.)  
- Cloud hosting and remote multi-site sync  
- Effective-dated rate history  
- Customer portal / e-signature  

These can be added later without rebuilding the pricing engine.

---

## 12. Sign-off

| | Name | Date |
|---|---|---|
| Delivered by (developer) | | |
| Accepted by (Advanced Damp) | | |
| Commercial owner | | |

**Notes / agreed tolerance for historical validation:**

_______________________________________________

_______________________________________________
