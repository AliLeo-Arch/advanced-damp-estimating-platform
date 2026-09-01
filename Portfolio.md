# Advanced Damp Estimating Platform

**Job Estimating & Quoting Tool for UK Damp Proofing Contractors**

| | |
|---|---|
| **Client** | Advanced Damp Ltd (UK damp-proofing contractor) |
| **Project type** | Custom web application — POC → local production foundation |
| **Version** | 1.0.0-local-prod |
| **Status** | Delivered — ready for client go-live (live rates & sign-off pending) |
| **Domain** | Construction estimating · damp proofing · commercial quoting |

---

## Executive summary

Advanced Damp Ltd needed a purpose-built estimating and quoting platform to replace spreadsheet-based workflows. Surveyors and office staff required a single system to capture site surveys, price multi-trade damp-proofing work with margin control, issue branded customer quotations, and track job actuals after completion.

This project delivers a **full-stack estimating platform** — from customer CRM through to PDF/Excel quotations and post-job variance analysis. It was developed in structured phases (A–G), validated with **34 automated tests** and **6 commercial benchmark scenarios**, and packaged with complete handoff documentation, PowerShell tooling, and optional Vercel cloud deployment.

The result is an office-deployable application that enforces commercial policy (minimum job value, margin gates, approval workflows) while remaining practical for day-to-day surveyor use on desktop and mobile.

---

## Business problem

UK damp-proofing contractors face estimating challenges that generic tools rarely solve well:

- **Multiple work types** on a single job (DPC injection, cavity drain membranes, sump & pump, timber treatment, ventilation) each with different measurement units and margin targets
- **Job-level costs** (travel bands, waste/skip allowances, preliminaries) that must be allocated fairly across work lines
- **Commercial risk** when surveyors override sell prices or margins fall below policy
- **Customer-facing quotations** that must reconcile line amounts to subtotals with no cost or margin leakage
- **Post-job learning** — comparing quoted vs actual costs to improve future pricing

Advanced Damp needed software that reflects how damp specialists actually survey, price, quote, and review jobs — not a generic CRM or accounting package.

---

## Solution overview

A modern web application guides users through a clear workflow:

```
Customer & site → Work scope → Measurements → Price review → Quotation → Job actuals
```

The platform combines:

- **CRM-lite** — customers, sites, and surveys linked to estimates
- **Configurable rate engine** — materials, labour, travel, waste, prelims, and package rates
- **Margin-controlled pricing** — per work-type targets, minimum job value, override approval gates
- **Branded outputs** — PDF, CSV, and Excel quotations with internal cost sheets
- **Lifecycle management** — draft through quoted/accepted/closed with revision support
- **Operations tooling** — backups, health checks, audit trail, rate CSV import/export

---

## Key features

### Estimating & pricing

| Capability | Detail |
|---|---|
| **Five work types** | Chemical DPC & replastering, cavity drain membrane, sump & pump, timber treatment, condensation & ventilation |
| **Measurement capture** | Wall lengths, areas, package selections, multi-unit ventilation lines |
| **Job-level allowances** | Travel bands, waste/skip, preliminaries allocated by direct-cost weight |
| **Minimum job value** | Automatic uplift (default £750) when calculated sell is below threshold |
| **Sell override** | Manual sell with reason; triggers manager review when policy requires |
| **PDF-safe reconciliation** | Line sells always sum exactly to job subtotal on customer documents |

### Quotation & export

| Format | Audience | Contents |
|---|---|---|
| **PDF** | Customer | Branded quotation with scope lines, VAT, terms, guarantee wording |
| **CSV** | Office / email | Quotation lines and totals |
| **Excel (.xlsx)** | Internal review | Quotation sheet + internal cost/margin breakdown |
| **CSV list** | Management | Filtered estimate register export |

### Commercial controls

- **Estimate lifecycle** — `draft → priced → review_required → approved → ready_to_quote → quoted → accepted/declined/expired → closed`
- **Approval gates** — overrides and below-target margins require owner/admin sign-off
- **Minimum margin block** — quotations blocked when margin falls below permitted floor (default 20%)
- **Revisions** — locked estimates can be revised (`AD-00001-R2`) without losing history
- **VAT snapshot** — rate and validity dates locked when quotation is issued

### CRM & administration

- Customer, site, and survey records with estimate prefill from survey
- **Rate table** — searchable, sortable, paginated grid with inline edit
- **Commercial settings** — VAT, payment terms, target margins, minimum job, survey fee
- **Bulk rate import/export** — Excel-friendly CSV round-trip for live rate loading
- **Role-based access** — admin, owner, surveyor, office, accounts with granular permissions

### Search, filters & productivity

- **Estimates dashboard** — advanced search, status chips, date/price filters, pagination, URL-bookmarkable filters
- **Rate admin** — server-side search, category filter, inactive toggle, sortable columns
- **Demo seed data** — pre-priced estimates (`AD-DEMO-01`, `AD-DEMO-04`, `AD-DEMO-05`) for walkthrough testing
- **Estimate editor UX** — command bar, clickable workflow stepper, grouped actions, loading states

### Post-job costing

- Actual materials, labour, waste, travel, prelims, and other costs
- Quoted vs actual variance table (cost, revenue, margin £ and %)
- Available on quoted, accepted, and closed jobs
- Permission-controlled editing for accounts/owner/admin roles

### Operations & reliability

- SQLite database with automated backup/restore (UI + PowerShell)
- Application logging and `/health` endpoint
- Audit events on create, update, approve, backup, and settings changes
- Single-port production mode for office PC deployment
- Optional split deployment on Vercel (frontend + API)

---

## User roles

| Role | Typical use |
|---|---|
| **Admin** | Full access including backups and system admin |
| **Owner** | Rates, commercial settings, approvals, backups |
| **Surveyor** | Create estimates, enter measurements, request overrides |
| **Office** | Estimates, customers, quotation issuance |
| **Accounts** | Job actuals entry and variance review |

Authentication uses JWT with permission-based route guards on both API and UI.

---

## Technical architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React + TypeScript (Vite)               │
│  Dashboard · Estimate Editor · CRM · Rates · Admin · Login  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST / JSON  (+ JWT)
┌────────────────────────────▼────────────────────────────────┐
│                    Python FastAPI API                       │
│  Auth · CRM · Estimates · Rates · Quotations · Actuals · Admin│
├─────────────────────────────────────────────────────────────┤
│  Pricing Engine │ Lifecycle │ PDF/CSV/XLSX Export │ Audit   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              SQLite (local) / Postgres-ready (cloud)        │
└─────────────────────────────────────────────────────────────┘
```

### Backend (`backend/`)

| Component | Technology / pattern |
|---|---|
| API framework | FastAPI with OpenAPI docs at `/docs` |
| ORM | SQLAlchemy 2.x |
| Auth | JWT (PyJWT) + bcrypt password hashing |
| PDF generation | ReportLab (branded A4 quotations) |
| Excel export | openpyxl (quotation + internal sheets) |
| Configuration | pydantic-settings (`.env` driven) |
| Schema evolution | Lightweight SQLite column migration helper |

**Core modules:** `pricing_engine.py`, `lifecycle.py`, `quotation.py`, `estimate_query.py`, `rate_query.py`, `estimate_export.py`, `actuals.py`, `backup.py`

### Frontend (`frontend/`)

| Component | Technology / pattern |
|---|---|
| UI framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Routing | React Router 7 |
| Styling | Custom CSS design system (Advanced Damp brand) |
| API client | Typed fetch wrapper with `VITE_API_URL` for production |
| State | React hooks; session in localStorage |

**Key pages:** Dashboard (estimate table), Estimate Editor (multi-step wizard), Customers, Rates, Admin, Login

### Pricing engine (business logic highlight)

The pricing engine implements a documented **Option A allocation policy**:

1. Price each work line on materials + labour from the rate table
2. Allocate waste, travel, and preliminaries by each line's share of direct cost
3. Apply per-work-type target margin to (direct + allocated job cost)
4. Sum line sells; apply minimum job value or sell override
5. Reconcile displayed line amounts so they sum exactly to the final sell price

This approach prevents the common failure mode where PDF line totals drift from the quoted subtotal.

---

## Development phases delivered

| Phase | Scope | Outcome |
|---|---|---|
| **A** | Auth, roles, CRM, estimate linkage, audit | Secure multi-role foundation |
| **B** | Rate admin, commercial settings UI | Owner-managed pricing policy |
| **C** | Pricing engine hardening | Allocation + PDF-safe reconciliation |
| **D** | Lifecycle, approval gates, revisions | Commercial control workflow |
| **E** | Quotation PDF, VAT snapshot, terms | Customer-ready branded output |
| **F** | Job actuals and variance | Post-job commercial learning |
| **G** | Backups, logging, health, admin UI, docs | Production operations readiness |
| **Polish** | Search, exports, rate table, UX, Vercel | Production environment support |

---

## Quality assurance

### Automated test suite — 34 tests

| Test suite | Validates |
|---|---|
| `test_pricing_engine.py` | Allocation, minimum job, line reconciliation |
| `test_lifecycle.py` | Status transitions, approval rules |
| `test_quotation_pdf.py` | PDF generation, amount reconciliation |
| `test_actuals.py` | Variance calculations |
| `test_backup.py` | SQLite backup and restore |
| `test_benchmark_jobs.py` | Five seed commercial scenarios |
| `test_rate_import.py` | CSV import/export round-trip |
| `test_estimate_export.py` | Export filenames and list CSV |
| `test_estimate_search.py` | Estimate search and pagination |
| `test_rate_search.py` | Rate search and pagination |

### Commercial benchmark scenarios (DEMO-01 … DEMO-05)

Validated pricing outcomes for representative UK jobs:

| Scenario | Description | Benchmark sell (seed rates) |
|---|---|---|
| DEMO-01 | Bromley DPC + extractor | ~£2,152.67 ex VAT |
| DEMO-02 | Greenwich basement membrane + sump | ~£13,152.65 ex VAT |
| DEMO-03 | Tunbridge Wells wet rot | ~£2,351.46 ex VAT |
| DEMO-04 | Hackney PIV + extractors | ~£1,607.64 ex VAT |
| DEMO-05 | Small localised DPC (min job) | £750.00 ex VAT |

Run verification:

```powershell
.\scripts\verify-delivery.ps1
```

---

## UX & design

The interface follows Advanced Damp's brand guidelines:

- **Colours** — Navy (`#0C1644`), orange accent (`#FF5F14`), blue highlights (`#2C93F5`)
- **Typography** — Montserrat (body), Red Hat Display (headings)
- **Layout** — Card panels, status pills, workflow steppers, responsive tables
- **Mobile** — Collapsible navigation, stacked forms, sticky action bars on long steps
- **Loading** — Skeleton screens, spinners, and loading buttons for perceived performance

Notable UX improvements in the polish pass:

- Estimates **data table** with sortable columns and mobile card fallback
- Estimate editor **command bar** with grouped quotation/revision actions
- **Clickable workflow stepper** for non-linear navigation
- Rate table with **sticky header**, category pills, and inline edit rows
- Professional login page with session boot validation

---

## Deployment options

### Option 1 — Local office PC (recommended for production)

Single Windows machine on the office LAN:

```powershell
.\scripts\start-production.ps1
```

Serves UI + API on **http://127.0.0.1:8000** with persistent SQLite storage.

### Option 2 — Development mode

```powershell
.\scripts\start-local.ps1
```

Frontend on port 5173, API on port 8000 with hot reload.

### Option 3 — Vercel (demo / split hosting)

- **Frontend project** — static Vite build with `VITE_API_URL`
- **Backend project** — FastAPI serverless via `api/index.py`

See `docs/VERCEL_DEPLOYMENT.md`. Note: SQLite on Vercel is ephemeral; Postgres recommended for lasting cloud data.

---

## Deliverables

### Application

- Full-stack estimating platform (frontend + backend)
- Seeded demo rates, users, and sample estimates
- Branded quotation PDF template
- Admin backup/restore interface

### Tooling (PowerShell)

| Script | Purpose |
|---|---|
| `start-local.ps1` | Dev servers (frontend + backend) |
| `start-production.ps1` | Single-port office deployment |
| `stop-servers.ps1` | Stop running dev/production servers |
| `backup.ps1` / `restore.ps1` | Database safety |
| `import-rates.ps1` / `export-rates.ps1` | Bulk rate management |
| `reset-password.ps1` | Secure credential rotation |
| `verify-delivery.ps1` | Full test + benchmark verification |

### Documentation (20+ guides)

| Document | Audience |
|---|---|
| `docs/CLIENT_HANDOFF.md` | Client / owner — start here |
| `docs/USER_GUIDE.md` | Surveyors and office staff |
| `docs/ADMIN_GUIDE.md` | Owner / admin |
| `docs/RELEASE_CHECKLIST.md` | Go-live sign-off |
| `docs/ACCEPTANCE_TEST_SCENARIOS.md` | QA / UAT (scenarios A–M) |
| `docs/HISTORICAL_JOB_VALIDATION.md` | Commercial sign-off worksheet |
| `docs/RATE_IMPORT.md` | Bulk rate CSV workflow |
| `docs/SECURITY.md` | IT security review |
| `docs/API_REFERENCE.md` | Search & export HTTP API |
| `docs/VERCEL_DEPLOYMENT.md` | Cloud deployment |
| `docs/CHANGELOG.md` | Feature history |

---

## Outcomes & business value

| Outcome | Impact |
|---|---|
| **Faster quoting** | Survey → priced quotation in one guided workflow |
| **Margin protection** | Automated gates prevent under-priced quotes reaching customers |
| **Audit trail** | Who changed what, when — estimates, rates, approvals, backups |
| **Consistent PDFs** | Branded, reconciled customer documents every time |
| **Rate agility** | CSV import lets commercial team update costs without developer involvement |
| **Post-job insight** | Quoted vs actual variance supports commercial tuning |
| **Low IT overhead** | Runs on a single office PC; no cloud subscription required |
| **Testable & documented** | 34 tests, benchmark harness, and full handoff pack reduce go-live risk |

---

## Technology stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, React Router 7 |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2 |
| **Database** | SQLite (local); Postgres-compatible design for cloud |
| **Auth** | JWT + bcrypt (passlib) |
| **PDF** | ReportLab |
| **Excel** | openpyxl |
| **Testing** | pytest (34 tests) |
| **Tooling** | PowerShell automation scripts |
| **Deployment** | Local Windows PC, optional Vercel serverless |

---

## Project statistics

| Metric | Value |
|---|---|
| Development phases | 7 (A–G) + polish pass |
| Automated tests | 34 |
| Benchmark scenarios | 6 |
| Work types supported | 5 |
| User roles | 5 |
| Export formats | PDF, CSV, Excel, CSV list |
| PowerShell scripts | 10 |
| Documentation files | 20+ |
| API endpoints | 40+ (estimates, rates, CRM, auth, admin, actuals) |

---

## Go-live status

The software foundation is **complete and delivered**. Remaining steps are **client-owned** commercial actions:

| Item | Status |
|---|---|
| Load live rates via CSV import | Ready (template + scripts provided) |
| Validate 5–10 historical jobs | Worksheet + benchmark harness ready |
| Change passwords and JWT secret | Scripts + `.env.example` provided |
| Approve sample PDFs and quotation wording | Pending client review |
| Test backup/restore on target PC | Admin UI + scripts provided |

---

## Future roadmap (out of v1 scope)

- Effective-dated rate versions (cost history over time)
- Full quotation wording settings UI (terms currently in DB/settings)
- Postgres / Turso for persistent cloud database
- Customer e-signature portal
- Accounting integration (Xero, Sage)
- Multi-office sync and remote access hardening
- Alembic database migrations

---

## Repository structure

```
advanced-damp-estimating-platform/
├── frontend/          React + Vite UI
├── backend/           FastAPI API + pricing engine
│   ├── app/           Application code
│   ├── api/           Vercel serverless entrypoint
│   ├── data/          Seed data, templates, benchmarks
│   └── tests/         pytest suite (34 tests)
├── scripts/           PowerShell go-live tooling
├── docs/              User, admin, and technical guides
└── Portfolio.md       This document
```

---

## Contact & links

| Resource | Location |
|---|---|
| **Project README** | `README.md` |
| **Client handoff** | `docs/CLIENT_HANDOFF.md` |
| **API documentation** | `http://127.0.0.1:8000/docs` (when running locally) |
| **Live demo (Vercel)** | Configure per `docs/VERCEL_DEPLOYMENT.md` |

---

*Advanced Damp Estimating Platform · Local Production Foundation · v1.0.0-local-prod*

*Built for Advanced Damp Ltd — UK damp proofing, surveying, and remediation.*
