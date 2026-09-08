# Trade Estimating & Quoting Platform

**Configurable job estimating and quoting for UK specialist contractors**

| | |
|---|---|
| **Project type** | Full-stack web application — local production platform |
| **Version** | 1.0.0-local-prod |
| **Status** | Delivered foundation — ready for contractor go-live (live rates pending) |
| **Domain** | Construction estimating · commercial quoting · field CRM |
| **Primary market** | UK specialist trades (damp proofing, timber, ventilation, and related work) |

---

## One-line pitch

A margin-controlled estimating platform that takes contractors from customer survey to branded quotation PDF and quoted-vs-actual review — without spreadsheets.

---

## Executive summary

Specialist contractors often price jobs in spreadsheets: rates drift, margins are hard to enforce, and customer quotations do not always reconcile to the commercial total. This project delivers a **production-grade local web application** that replaces that workflow with a controlled commercial pipeline:

```text
Customer / site → Survey → Work scope → Measurements
→ Deterministic costing → Margin-controlled sell price
→ Review / approval → Branded quotation → Job actuals
```

The platform combines CRM-lite, a versioned rate library, a pricing engine with minimum-job and margin rules, quotation export (PDF / CSV / Excel), estimate lifecycle with revisions, and post-job variance analysis. It ships with role-based access, backups, health checks, handoff documentation, and demo assets (screenshots + product walkthrough video).

---

## Problem

UK specialist contractors need estimating software that reflects how they actually work:

- Multiple work types on one job, each with different units and margin targets
- Job-level allowances (travel, waste, prelims) that must allocate fairly across lines
- Commercial policy: minimum job value, margin floors, and override approvals
- Customer PDFs that must reconcile line amounts to the quoted subtotal exactly
- Post-job learning: quoted vs actual cost, revenue, and margin

Generic CRMs and accounting tools rarely solve this end-to-end.

---

## Solution

A React + FastAPI application with a clear estimate wizard and office-ready operations:

| Area | What it delivers |
|---|---|
| **CRM** | Customers, sites, and surveys linked into estimates |
| **Rates** | Searchable library with cost history and CSV import/export |
| **Pricing** | Deterministic costing, target margins, minimum job, PDF-safe reconciliation |
| **Lifecycle** | Draft → priced → review → quote → accept/decline → close, with revisions |
| **Outputs** | Branded PDF quotation; CSV and Excel (customer + internal cost sheets) |
| **Actuals** | Materials, labour, and overhead capture with variance reporting |
| **Ops** | JWT roles, backups, logging, health, single-port production mode |

---

## Key capabilities

### Estimating workflow

1. **Customer** — link CRM customer / site / survey  
2. **Scope** — select work packages and trade lines  
3. **Measurements** — capture quantities and allowances  
4. **Price review** — inspect cost, sell, and margin before issue  
5. **Quotation** — export PDF / CSV / Excel; lock commercial snapshot  
6. **Job actuals** — record real costs and compare to quoted baseline  

### Commercial controls

- Per–work-type target margins and minimum job value  
- Sell override with reason; manager review when policy requires  
- Minimum margin gate before quotation  
- Revisions that preserve history (`EST-xxxxx-R2`)  
- VAT and terms snapshot when a quote is issued  

### Productivity & UX

- Estimates dashboard with advanced search, status chips, date/price filters, pagination  
- Rate admin with drawers, sticky table header, and cost history  
- Command bar + clickable workflow stepper in the estimate editor  
- Skeleton loading, refresh overlays, and loading buttons  
- Field mode for compact site entry  
- Responsive layout for desktop and tablet  

---

## Tech stack

| Layer | Stack |
|---|---|
| **Frontend** | React, TypeScript, Vite, React Router, custom design system |
| **Backend** | Python, FastAPI, SQLAlchemy, Pydantic |
| **Data** | SQLite (local production); Postgres-ready patterns for cloud |
| **Auth** | JWT + bcrypt; permission-based UI and API guards |
| **Exports** | ReportLab (PDF), openpyxl (Excel), CSV |
| **Quality** | Automated API/pricing/lifecycle tests + commercial benchmarks |
| **Tooling** | PowerShell start/backup/verify scripts; standalone screenshot & demo-video kits |

### Architecture (high level)

```text
┌──────────────────────────────────────────────┐
│         React + TypeScript (Vite)            │
│  Estimates · Editor · CRM · Rates · Admin    │
└──────────────────────┬───────────────────────┘
                       │ REST + JWT
┌──────────────────────▼───────────────────────┐
│              FastAPI API                     │
│  Auth · Pricing · Lifecycle · Quotation      │
│  Actuals · Rates · Backups · Audit           │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│           SQLite (local production)          │
└──────────────────────────────────────────────┘
```

---

## Design system

Professional contractor-facing UI (not a generic SaaS template):

- **Navy** `#0C1644` — primary brand / structure  
- **Orange** `#FF5F14` — primary CTA  
- **Blue** `#2C93F5` — interactive accents  
- **Typography** — Montserrat (UI body), Red Hat Display (headings)  
- Dense, readable controls for office use; touch-friendly targets on mobile  

---

## Roles

| Role | Typical access |
|---|---|
| **Admin** | Full system including backups |
| **Owner** | Rates, commercial settings, approvals |
| **Surveyor** | Create estimates, measurements, override requests |
| **Office** | Customers, estimates, quotation issue |
| **Accounts** | Job actuals and variance |

---

## Outcomes & delivery artefacts

- End-to-end estimating platform suitable for office PC deployment  
- Commercial policy enforced in software (margins, minimums, approvals)  
- Customer-ready quotation outputs with reconciled totals  
- Quoted-vs-actual visibility for pricing improvement  
- Handoff pack: product docs, user/admin guides, release checklist, scripts  
- Demo pack: UI screenshots + chaptered product demo video  

### Demo assets (this repo)

| Asset | Location |
|---|---|
| **Demo video** | [`docs/demos/trade-estimating/v1.0.0/video/trade-estimating-product-demo.webm`](./docs/demos/trade-estimating/v1.0.0/video/trade-estimating-product-demo.webm) |
| **Screenshots** | [`docs/demos/trade-estimating/v1.0.0/screenshots/`](./docs/demos/trade-estimating/v1.0.0/screenshots/) |
| **Demo pack README** | [`docs/demos/trade-estimating/v1.0.0/README.md`](./docs/demos/trade-estimating/v1.0.0/README.md) |

Regenerate media with standalone utilities (not part of the app runtime):

- `tools/screenshot-kit/`  
- `tools/demo-video-kit/`  

---

## Upwork / portfolio ready copy

### Project title

```text
Job Estimating & Quoting Platform for UK Contractors
```

### Role

```text
Full-stack engineer — product UI, API, and commercial workflow
```

### Short description (~600 characters)

```text
Built a production local estimating platform for specialist UK contractors (e.g. damp proofing). Replaced spreadsheet pricing with a controlled flow: CRM → survey → scope → measurements → rate-driven cost → margin/sell price → branded quotation PDF → job actuals and variance.

Delivered React/TypeScript UI, FastAPI/SQLite backend, role-based access, versioned rate library, revisions, backups, and professional demo assets (screenshots + walkthrough video) for client handoff.

Impact: faster, consistent quotes with enforceable margins and clearer quoted-vs-actual visibility for office and field teams.
```

### Video caption

```text
Trade Estimating & Quoting — CRM to survey, margin-controlled quote, PDF, and job actuals for UK specialist contractors.
```

### Skills (suggested)

React · TypeScript · Python · FastAPI · UI/UX Design  

*(Alternates: REST API, SQLite, Playwright, Product Design)*

---

## Suggested portfolio gallery order

1. Login  
2. Estimates dashboard (with advanced filters)  
3. Estimate editor — price review  
4. Quotation / PDF-ready view  
5. Rates library  
6. Customers / CRM  
7. Job actuals / variance  
8. Demo video (full walkthrough)  

Files live under `docs/demos/trade-estimating/v1.0.0/screenshots/` and `.../video/`.

---

## Run locally (for demos)

```powershell
.\scripts\start-local.ps1
```

- App: http://127.0.0.1:5173  
- API: http://127.0.0.1:8000  

Demo admin: see project `README.md` (change credentials before any live use).

---

## Related documentation

| Document | Purpose |
|---|---|
| [`README.md`](./README.md) | Quick start and feature overview |
| [`docs/product/PRODUCT_DEFINITION.md`](./docs/product/PRODUCT_DEFINITION.md) | Product definition |
| [`docs/ops/CLIENT_HANDOFF.md`](./docs/ops/CLIENT_HANDOFF.md) | Client handoff pack |
| [`docs/guides/USER_GUIDE.md`](./docs/guides/USER_GUIDE.md) | Day-to-day usage |
| [`docs/ops/CHANGELOG.md`](./docs/ops/CHANGELOG.md) | Feature history |

---

*Portfolio summary for Trade Estimating & Quoting — configurable estimating for specialist contractors.*
