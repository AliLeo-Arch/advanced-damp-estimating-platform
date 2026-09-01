# Advanced Damp Job Estimating & Quoting Tool  
## Project Overview — Version 2.0 (Implemented POC)

**Document status:** POC overview + **local production delivery update (Aug 2026)**  
**Supersedes for delivery status:** `Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview.md` (v1 — original proposal)  
**Client:** Advanced Damp Ltd  
**Product type:** Local production estimating platform (evolved from POC)  
**Version:** 1.0.0-local-prod  
**Brand reference:** [https://advanceddamp.co.uk/](https://advanceddamp.co.uk/)  
**Currency / market:** GBP · United Kingdom  

> **Delivery update (Aug 2026):** The POC has been extended into a **local production foundation** (Phases A–G). See `docs/IMPLEMENTATION_STATUS.md` and `docs/CLIENT_HANDOFF.md` for the current handoff pack. Commercial go-live still requires Advanced Damp live rates, historical job validation, and sign-off.

---

## 1. Executive summary

Advanced Damp Ltd is a specialist damp-proofing and structural waterproofing contractor operating across London, the South East and wider regions. Surveyors currently produce written reports and quotations after on-site surveys, but pricing is performed manually. That process is slow, inconsistent between surveyors, and makes commercial margin difficult to control.

This project delivers a **Proof of Concept web application** that converts survey measurements into a structured, margin-controlled estimate and a branded customer quotation. The POC demonstrates that Advanced Damp can:

- standardise pricing across surveyors;
- centralise materials, labour, waste, travel and preliminary rates;
- apply job-type target margins with live override feedback;
- enforce a minimum job value;
- generate a professional customer-facing quotation and PDF;
- retain saved estimates with a snapshot of rates used at pricing time; and
- establish a technical foundation suitable for later production expansion.

The POC is intentionally focused on the estimating and quoting workflow. It is not a full CRM, job-management or accounting platform. Those capabilities are designed for later phases without requiring a rebuild of the pricing engine.

---

## 2. Business problem

Manual estimating creates the following operational issues:

| Problem | Business impact |
|---|---|
| Slow quotation preparation | Surveyors spend unnecessary time on arithmetic and rewrite |
| Inconsistent pricing between surveyors | Similar jobs are quoted differently |
| Rates scattered across spreadsheets | Price updates are error-prone and hard to audit |
| Weak margin visibility | Discounts and overrides hide commercial damage |
| No reliable estimate history | Quoted-versus-actual analysis is difficult |
| Manual branded quotations | Extra admin work and inconsistent customer documents |

The POC addresses these by introducing a single digital workflow:

**Site survey inputs → standardised costing → controlled sell price → branded quotation → saved estimate record**

---

## 3. Project objectives

### 3.1 Primary objective

Prove that Advanced Damp’s estimating process can be converted into a practical digital workflow that is:

- fast enough for on-site / same-day use;
- simple enough for a non-technical business owner to understand;
- commercially disciplined (margin and minimum job value); and
- familiar in brand presentation to [advanceddamp.co.uk](https://advanceddamp.co.uk/).

### 3.2 Demonstrated capabilities (implemented)

1. Create and edit draft estimates  
2. Capture customer and site information  
3. Select one or more work types (scope builder)  
4. Enter survey measurements and job options  
5. Apply travel bands, waste/skip and preliminaries  
6. Automatically calculate materials and labour costs  
7. Apply work-type target margins using true margin maths  
8. Override sell price and immediately recalculate margin  
9. Enforce a configurable minimum job value  
10. Review an internal commercial summary  
11. Generate a customer-facing quotation (no internal costs/margins exposed)  
12. Export a branded PDF quotation  
13. Persist estimates in a local database  
14. Seed and serve central rate tables from sample commercial data  

---

## 4. Solution recommendation

### Platform choice: lightweight responsive web application

The original brief allowed either an advanced spreadsheet or a simple web app. The implemented POC is a **responsive web application**.

### Why web rather than spreadsheet

| Requirement | Spreadsheet risk | Web app advantage |
|---|---|---|
| Non-technical owner maintains rates | Formulas easily broken | Rates separated from calculation logic |
| On-site use (tablet / laptop) | Fragile mobile UX | Responsive React UI |
| Consistent pricing rules | Hard to protect | Server-side pricing engine |
| Historical estimates | Weak versioning | Structured SQLite records + rate snapshot |
| Branded PDF | Manual formatting | Automated quotation PDF |
| Future quoted-vs-actual / multi-user | Requires rebuild | Extensible API + data model |

---

## 5. Technology stack (as built)

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Surveyor / owner interface |
| Routing | React Router | Dashboard and estimate wizard |
| Backend | Python FastAPI | REST API, validation, PDF |
| Pricing | Dedicated Python pricing engine | Deterministic cost and margin logic |
| Persistence | SQLite + SQLAlchemy | Local POC database |
| PDF | ReportLab | Branded quotation export |
| Seed data | JSON commercial sample file | Materials, labour, packages, rules |

### Runtime (local POC)

| Service | Default URL |
|---|---|
| Frontend | http://localhost:5173/ |
| Backend API | http://127.0.0.1:8000/ |
| Interactive API docs | http://127.0.0.1:8000/docs |

---

## 6. Repository structure

```text
backend/
  app/
    main.py                 FastAPI application entry
    config.py               Settings (DB path, company name, VAT)
    database.py             Engine, sessions, init + seed hook
    models.py               Estimate, EstimateItem, RateItem, PricingSettings
    schemas.py              Pydantic request/response models
    pricing_engine.py       Work-type costing and margin engine
    estimate_service.py     Persist + recalculate helpers
    seed.py                 Load sample_seed.json into SQLite
    routers/
      health.py
      rates.py
      estimates.py          Estimates, quotation JSON, PDF
  data/
    sample_seed.json        Professional sample commercial dataset
    advanced_damp.db        Local SQLite database (generated)

frontend/
  src/
    App.tsx                 Shell, header, footer, routes
    api.ts                  API client
    index.css               Advanced Damp design tokens and UI
    pages/
      DashboardPage.tsx     Estimate list
      EstimateEditorPage.tsx  Five-step estimating wizard
  public/brand/             Local brand asset folder

docs/
  UI_UX_DESIGN_SYSTEM.md    Brand and interaction rules

.cursor/rules/
  advanced-damp-ui.mdc      Frontend UI enforcement rule
```

The original proposal document (v1) is retained for historical scope reference.

---

## 7. Users and roles (POC)

### Surveyor

Uses the application to:

- create or reopen an estimate;
- enter customer / site details;
- select treatment scope;
- enter measurements;
- review calculated cost and margin;
- apply an authorised sell-price override if needed;
- generate quotation and PDF;
- return to the dashboard of saved estimates.

### Business owner / administrator

In the POC, rate maintenance is seeded centrally. A dedicated **rate admin UI** is the next planned enhancement. The architecture already separates rate data from calculation logic so the owner can later update rates without touching source code.

Formal authentication and role-based permissions are deferred to production.

---

## 8. End-to-end estimating workflow (implemented)

The application implements a guided five-step workflow that mirrors Advanced Damp’s survey-led commercial process:

```text
1. Customer & site
        ↓
2. Work scope
        ↓
3. Measurements (+ travel / waste / prelims)
        ↓
4. Price review (internal)
        ↓
5. Quotation (+ PDF)
```

### Step 1 — Customer & site

Captures:

- customer name;
- surveyor;
- site address and postcode;
- survey date;
- survey notes.

Creates or updates a draft estimate with a unique reference (for example `AD-00001`).

### Step 2 — Work scope

Surveyor selects one or more work types using company-aligned language:

1. Chemical DPC Injection & Replastering  
2. Cavity Drain Membrane Systems  
3. Sump & Pump Installations  
4. Timber Treatment  
5. Condensation & Ventilation  

### Step 3 — Measurements

Dynamic forms collect work-type-specific inputs, then job-level allowances:

- travel band (local / banded distance charges);
- waste or skip selection;
- preliminaries (standard setup, parking, ULEZ, restricted access, protection, etc.).

### Step 4 — Price review (internal only)

Displays:

- materials, labour, waste, travel, preliminaries and total cost;
- target margin % (blended from selected work types);
- calculated sell price;
- final sell price;
- margin £ and actual margin %;
- minimum-job-value adjustment (when applied);
- below-target margin warning;
- sell-price override with live recalculation;
- per-line cost/sell summaries.

This view is explicitly marked **Internal only**.

### Step 5 — Quotation

Produces a customer-facing quotation containing:

- Advanced Damp company details;
- quote reference, customer and site;
- scope descriptions;
- subtotal ex VAT, VAT and total inc VAT;
- payment terms and validity;
- assumptions and exclusions.

Internal costs and margins are never shown on the quotation or PDF.

---

## 9. Supported work types and pricing logic

### 9.1 Chemical DPC injection & replastering

**Inputs:** walls, wall length (lm), replaster height (m)  
**Derived:** total DPC lm, replaster area m²  
**Cost drivers:** DPC cream, plugs, renovating plaster, SBR primer, DPC labour, replaster labour  

### 9.2 Cavity drain membrane systems

**Inputs:** wall m², floor m², drainage channel lm, battens/boarding flags  
**Cost drivers:** wall/floor membrane, fixings, battens, board, channel, membrane/board labour  

### 9.3 Sump & pump installations

**Inputs:** package selection + optional add-ons  
**Packages (sample):** standard single pump, twin pump, battery backup, professional alarm  
**Cost drivers:** package materials + installation labour allowances  

### 9.4 Timber treatment

**Inputs:** treatment area m², joist repairs, floor renewal m²  
**Cost drivers:** treatment fluid, replacement timber, floorboarding, treatment/joist labour  

### 9.5 Condensation & ventilation

**Inputs:** equipment type(s) and quantities (extractor / PIV), install flag  
**Cost drivers:** unit supply, duct/grille pack, installation labour  

---

## 10. Central rate management

Rates are stored in SQLite (`rate_items`) and seeded from `backend/data/sample_seed.json`.

### Rate categories

| Category | Examples |
|---|---|
| Materials | DPC cream, membranes, plaster, fans, PIV |
| Labour | Day rates and output rates (lm / m² / each) |
| Waste & skips | Small allowance, midi, builder’s, large |
| Travel | Local, Band 1–3 distance charges |
| Preliminaries | Setup, parking, ULEZ, access, protection |
| Sump packages | Standard / twin / battery / alarm packages |

### Pricing settings

| Setting | Sample POC value |
|---|---|
| Minimum job value | £750 |
| VAT rate | 20% |
| Quote validity | 30 days |
| DPC target margin | 35% |
| Cavity drain target margin | 32% |
| Sump target margin | 30% |
| Timber target margin | 33% |
| Ventilation target margin | 28% |

**Important:** Sample rates are illustrative for demonstration only. They must be replaced with Advanced Damp’s live supplier costs, productivity assumptions and commercial targets during discovery.

---

## 11. Pricing engine — commercial rules

### 11.1 Base cost

```text
Base Cost =
    Materials
  + Labour
  + Waste / Skip
  + Travel
  + Preliminaries
```

### 11.2 True margin (not markup)

Sell price is derived from target margin as:

```text
Sell Price = Cost / (1 − Margin %)
```

Example:

- Cost = £1,000  
- Target margin = 30%  
- Sell = £1,000 / 0.70 = **£1,428.57**  
- Margin £ = £428.57  
- Margin % of sell = **30%**

A naive 30% markup on cost would only yield ~23.08% margin. The POC intentionally avoids that error.

### 11.3 Blended target margin

Where multiple work types exist on one estimate, the engine calculates a cost-weighted blended target margin from each line’s target.

### 11.4 Sell-price override

An authorised user may override the final sell price. The application immediately recalculates:

- margin £;
- actual margin %;
- below-target warning (when applicable).

### 11.5 Minimum job value

If calculated sell price falls below the configured floor (sample £750), final sell price is lifted to the minimum and the adjustment is surfaced on the internal review screen.

### 11.6 Rate snapshot

When an estimate is priced, the system stores a snapshot of rate unit costs used. Historical estimates therefore remain commercially intelligible even after future rate changes.

---

## 12. Data model (POC)

### Core entities

| Entity | Purpose |
|---|---|
| `Estimate` | Header: customer/site, status, cost/sell/margin, allowances |
| `EstimateItem` | Work-type lines with measurements and line pricing |
| `RateItem` | Central rate table rows |
| `PricingSettings` | Minimum job value, VAT, margins, terms |

### Estimate statuses

- `draft`  
- `ready_to_quote`  
- `quoted`  
- `accepted`  
- `declined`  

Additional operational statuses can be introduced in production.

---

## 13. Application architecture

```text
┌─────────────────────────────────────┐
│     React / TypeScript frontend     │
│   Dashboard + five-step wizard      │
│   Advanced Damp branded UI          │
└─────────────────┬───────────────────┘
                  │ REST (proxied in dev)
                  ▼
┌─────────────────────────────────────┐
│              FastAPI                │
│  Estimates · Rates · Quotation/PDF  │
│  Pricing engine (deterministic)     │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│               SQLite                │
│  Estimates · Items · Rates · Rules  │
└─────────────────────────────────────┘
```

Frontend, business logic and persistence remain separated so SQLite can later be replaced by PostgreSQL without rewriting the estimating UI or pricing rules.

---

## 14. User interface and brand system

The UI follows a dedicated design system aligned to the live Advanced Damp website.

### Brand tokens

| Token | Value | Use |
|---|---|---|
| Navy | `#0C1644` | Headings, authority |
| Orange | `#FF5F14` | Primary CTAs |
| Blue | `#2C93F5` | Accent / focus / header rule |
| Canvas | `#F5F7FA` | App background |
| Success / Danger | `#2F532E` / `#870000` | Margin health |

### Typography

- **Red Hat Display** — titles and primary buttons  
- **Montserrat** — body, forms, tables  

### UX principles applied

1. Survey-first workflow  
2. Field-speed (large targets, clear steps)  
3. Commercial clarity before PDF  
4. Customer documents never expose margin/cost  
5. Familiar brand identity without cloning marketing page layouts  
6. One primary orange CTA per region  
7. Deterministic, auditable numbers  

Full rules are documented in `docs/UI_UX_DESIGN_SYSTEM.md`.

---

## 15. Quotation and PDF output

### Customer quotation content

- Advanced Damp Ltd identity and contact details  
- Quote reference  
- Customer and site  
- Scope of works (descriptions, not internal build-ups)  
- Subtotal ex VAT  
- VAT and total inc VAT  
- Payment terms  
- Validity period  
- Assumptions and exclusions  

### PDF

Generated server-side via ReportLab and downloadable from the quotation step (`/api/estimates/{id}/quotation.pdf`).

Company contact details used in the POC quotation reflect the public website:

- Phone: 0300 373 7251  
- Email: info@advanceddamp.co.uk  
- London office: 45 Fitzroy St, London W1T 6EB  

---

## 16. Sample / demonstration data

Professional sample commercial data is provided in `backend/data/sample_seed.json`, including:

- materials and labour rates;
- sump packages;
- waste, travel and preliminaries;
- target margins and minimum job value;
- surveyors;
- customer/site examples;
- named demo scenarios (including the Bromley DPC + ventilation showcase and a minimum-job-value edge case).

### Example verified POC calculation

**Scenario:** 12 lm DPC, 1.2 m replaster height, one extractor, local travel  

Illustrative engine output from smoke testing:

- Total cost ≈ **£1,419.72**  
- Sell (ex VAT) ≈ **£2,149.79**  
- Total inc VAT ≈ **£2,579.75**  

Exact figures depend on seeded rates and selected allowances.

---

## 17. API surface (high level)

| Area | Endpoints (representative) |
|---|---|
| Health | `GET /health` |
| Rates | `GET /api/rates/`, `GET /api/rates/settings` |
| Estimates | `GET/POST /api/estimates/`, `GET/PUT /api/estimates/{id}` |
| Work types | `GET /api/estimates/work-types` |
| Recalculate | `POST /api/estimates/{id}/recalculate` |
| Quotation | `GET /api/estimates/{id}/quotation` |
| PDF | `GET /api/estimates/{id}/quotation.pdf` |

OpenAPI documentation is available at `/docs` when the backend is running.

---

## 18. What is included in this POC

- Responsive Advanced Damp-branded web UI  
- Estimate dashboard (list, open, create)  
- Full five-step estimating wizard  
- Five work-type pricing modules  
- Central seeded rate tables and pricing settings  
- True margin engine + override + minimum job value  
- Internal commercial summary  
- Customer quotation preview  
- Branded PDF export  
- SQLite persistence and rate snapshot fields  
- Local run instructions  

---

## 19. Intentionally deferred (future phases)

| Deferred item | Rationale |
|---|---|
| Full authentication / RBAC | Not required to prove estimating value |
| Cloud production hosting | Local POC first |
| Owner rate-admin screens | Data model ready; UI next enhancement |
| Full quoted-vs-actual job costing | Data foundations prepared; costing UI later |
| CRM / Xero / email / e-sign | Integrations after estimating is proven |
| Offline-first / native apps | Progressive enhancement later |
| AI-assisted scoping | Must remain non-authoritative for pricing |

### Suggested roadmap

1. **Phase 1 — POC (current):** estimating workflow, pricing, quotation  
2. **Phase 2 — Production estimating:** auth, cloud DB, permissions, audit, polished mobile UX  
3. **Phase 3 — Job costing:** actuals vs quoted margin reporting  
4. **Phase 4 — Operations:** scheduling, documents, invoicing integrations  
5. **Phase 5 — Business intelligence:** margin by job type/surveyor, win rate, variance trends  

---

## 20. Discovery inputs still required from Advanced Damp

To replace sample rates with live commercial truth:

- current price lists and supplier costs;  
- labour day rates and productivity assumptions;  
- waste / skip policy;  
- travel bands from the operating office(s);  
- prelim / ULEZ / parking allowances;  
- true target margins by job type;  
- minimum job value policy;  
- VAT treatment nuances;  
- sample quotations and preferred wording;  
- logo/letterhead assets for final PDF print quality;  
- payment terms and standard exclusions/assumptions.  

Until these are supplied, the POC remains a realistic demonstration using carefully structured sample data.

---

## 21. Success criteria (POC)

The POC is successful when a user can:

1. Open the application  
2. Create or reopen an estimate  
3. Enter customer/site details  
4. Select work types and measurements  
5. Receive an automatic cost calculation  
6. See target and actual margin  
7. Override price and see margin change immediately  
8. Observe minimum job value enforcement when applicable  
9. Generate a customer quotation without internal cost leakage  
10. Export PDF  
11. Save and reopen the estimate  
12. Rely on central rates without editing application source code  

These criteria are met by the current implementation, subject to replacing sample rates with client live data for commercial go-live.

### 21.1 Local production extensions (implemented Aug 2026)

Beyond the original POC scope, the following production capabilities are now built:

| Area | Capability |
|---|---|
| Auth | JWT login, roles (admin, owner, surveyor, office, accounts), permissions |
| CRM | Customers, sites, surveys; survey → estimate prefill |
| Commercial control | Lifecycle, approval gates, revisions, minimum margin block |
| Rate admin | Owner/admin UI for rates and commercial settings |
| Pricing engine | Job-level allowance allocation; PDF-safe line reconciliation |
| Quotation | Issue/valid dates, VAT snapshot, configurable terms, PDF export |
| Actuals | Quoted vs actual variance after acceptance |
| Operations | Backups, logging, health check, admin UI |
| Mobile UX | Responsive layout, drawer nav, sticky step actions |
| Validation | Automated benchmark scenarios (DEMO-01 … DEMO-05) |

**Not yet commercially production-ready until:** real rates loaded, 5–10 historical jobs validated, passwords/JWT secured, client PDF sign-off (`docs/RELEASE_CHECKLIST.md`).

---

## 22. How to run locally

### Development (two terminals)

```powershell
.\scripts\start-local.ps1
```

Or manually:

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/

### Production mode (single port — office PC)

Builds the frontend and serves UI + API from **http://127.0.0.1:8000**:

```powershell
.\scripts\start-production.ps1
```

Set `SERVE_FRONTEND=true` in `backend/.env` if starting uvicorn manually after `npm run build`.

Handoff documentation: `docs/CLIENT_HANDOFF.md`

---

## 23. Design principles (product)

1. **Simple for surveyors** — no technical knowledge required to price a job  
2. **Safe for the business owner** — rates and rules are data, not fragile formulas  
3. **Deterministic pricing** — transparent, auditable calculations  
4. **Commercial visibility** — margin consequences are immediate and obvious  
5. **Historical accuracy** — rate snapshots protect past quotations  
6. **Extensible architecture** — production features can be added without rewriting the engine  
7. **Brand familiarity** — Advanced Damp visual language without marketing-page clutter  

---

## 24. Key value proposition

This system is not merely a calculator. It connects:

```text
Survey measurements
      +
Standardised rates
      +
Labour productivity assumptions
      +
Job-specific rules
      +
Commercial margin controls
      ↓
Consistent internal estimate
      ↓
Professional customer quotation
      ↓
Historical estimating data
      ↓
Future profitability analysis
```

**Immediate value:** faster, more consistent estimating with controlled margin.  
**Strategic value:** a clean commercial dataset and architecture for production estimating, job costing and operational growth.

---

## 25. Document control

| Field | Detail |
|---|---|
| Document | Advanced Damp Job Estimating & Quoting Tool — Project Overview v2.0 |
| Nature | Implemented POC overview (professional delivery description) |
| Related v1 | `Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview.md` (original proposal) |
| UI rules | `docs/UI_UX_DESIGN_SYSTEM.md` |
| Sample data | `backend/data/sample_seed.json` |
| Client website | https://advanceddamp.co.uk/ |

---

*End of Project Overview v2.0*
