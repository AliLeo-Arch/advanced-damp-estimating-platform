# Generic Trade Estimating & Quoting Platform
## Production-Level Local Application — Product Definition, Architecture & Refactoring Blueprint

**Working project name:** Generic Trade Estimating & Quoting Platform  
**Document type:** Product definition + production architecture + generic-branch refactoring plan  
**Version:** 1.0  
**Deployment target:** Local / company-controlled production environment  
**Product positioning:** Configurable estimating, margin-control, quotation, and quoted-vs-actual platform for specialist contractors  
**Primary market:** UK specialist construction and field-service contractors  
**Status:** Generic product branch derived from a previously validated specialist estimating POC  

---

# 1. Executive Summary

This project is a **production-grade, configurable job estimating and quotation platform for specialist contractors**.

It is designed for businesses that currently rely on spreadsheets, manual pricing, individual surveyor knowledge, or fragmented rate tables to produce job estimates and customer quotations.

The platform converts structured site or survey inputs into a controlled commercial workflow:

```text
Customer / Site
      ↓
Survey / Job Inputs
      ↓
Work Scope
      ↓
Measurements & Options
      ↓
Deterministic Costing
      ↓
Margin-Controlled Sell Price
      ↓
Commercial Review / Approval
      ↓
Customer Quotation
      ↓
PDF / Revision History
      ↓
Accepted Commercial Baseline
      ↓
Actual Cost Capture
      ↓
Quoted-vs-Actual Analysis
```

The goal of this generic branch is to remove all direct dependency on, or visible reference to, any one company and turn the solution into its own **reusable product with a clear technical and commercial identity**.

The platform should be suitable for demonstrating and delivering services to contractors in areas such as:

- damp proofing;
- waterproofing;
- timber treatment;
- ventilation;
- drainage;
- roofing;
- insulation;
- plastering;
- rendering;
- flooring;
- specialist refurbishment;
- fire protection;
- building maintenance;
- restoration;
- remediation;
- plumbing and mechanical installation;
- electrical contracting;
- specialist fit-out;
- other measurement-driven or package-driven construction trades.

The generic product should retain the strongest characteristics of the original proof of concept:

- structured estimating from real site measurements;
- central rate management;
- deterministic pricing;
- true margin calculations;
- minimum-job controls;
- controlled overrides;
- professional customer quotations;
- historical rate snapshots;
- saved estimate records;
- extensible work-type modules.

It should then expand those capabilities into a production-ready local application with:

- authentication and roles;
- customer/site/survey records;
- configurable company branding;
- generic work-type definitions;
- versioned pricing data;
- approval workflows;
- quotation revisions;
- audit history;
- actual-cost entry;
- quoted-vs-actual reporting;
- PostgreSQL;
- local Docker deployment;
- backup and restore;
- configurable documents and business rules.

The generic branch must be developed so that a new contractor can be onboarded primarily through **configuration and commercial data**, rather than through a full code rewrite.

---

# 2. Strategic Purpose of the Generic Branch

The generic branch has two goals.

## 2.1 Technical Goal

Convert a validated single-client estimating workflow into a reusable software architecture.

This requires moving from:

```text
Client-specific labels
+ client-specific rates
+ client-specific branding
+ client-specific workflow assumptions
```

to:

```text
Configurable company profile
+ configurable work types
+ configurable measurement schemas
+ configurable rates
+ configurable pricing rules
+ configurable quotation templates
+ reusable estimating engine
```

## 2.2 Commercial / Marketing Goal

Create a strong portfolio-quality product that demonstrates the ability to build:

- contractor estimating systems;
- field survey applications;
- margin-control tools;
- quote-generation software;
- rate-table administration;
- construction SaaS foundations;
- quoted-vs-actual costing;
- configurable business workflows;
- local-first enterprise applications.

The project should be marketable without revealing or depending on any previous client's identity, data, rates, quotation language, or business-specific intellectual property.

---

# 3. Product Positioning

## 3.1 Product Category

The application is best positioned as a:

> **Configurable Trade Estimating & Quoting Platform for Specialist Contractors**

It is not simply:

- a calculator;
- an Excel replacement;
- a quote template;
- a CRM;
- a generic invoicing system.

Its core value lies in connecting:

```text
Survey Measurements
        +
Standardised Rates
        +
Labour Productivity
        +
Packages / Options
        +
Travel / Waste / Preliminaries
        +
Commercial Margin Controls
        ↓
Consistent Estimate
        ↓
Professional Quotation
        ↓
Historical Commercial Data
        ↓
Profitability Analysis
```

---

# 4. Target Customers

The platform is suitable for contractors where jobs are priced from a mixture of measurements, product specifications, fixed packages, labour assumptions, and commercial allowances.

Examples include:

## Building Remediation

- damp proofing;
- basement waterproofing;
- timber repair;
- mould remediation;
- structural repairs;
- concrete repair;
- leak remediation.

## Building Envelope

- roofing;
- cladding;
- rendering;
- insulation;
- waterproof coatings;
- sealants;
- façade repair.

## Building Services

- ventilation;
- plumbing;
- pump systems;
- mechanical installation;
- electrical work;
- access-control installation.

## Interior / Refurbishment

- plastering;
- flooring;
- fit-out;
- partitioning;
- ceiling systems;
- decoration;
- specialist finishes.

## Property Maintenance

- planned maintenance;
- responsive repairs;
- landlord remedial works;
- commercial maintenance;
- multi-site property services.

The architecture should support industry-specific configuration without changing the fundamental estimating engine.

---

# 5. Core Business Problems Addressed

Specialist contractors frequently experience the following problems:

| Problem | Commercial Impact |
|---|---|
| Estimates created manually | Slow quote turnaround |
| Surveyors use different assumptions | Inconsistent pricing |
| Rates stored in multiple spreadsheets | Difficult maintenance |
| Labour productivity is not standardised | Margin leakage |
| Travel, waste and preliminaries are forgotten | Underpricing |
| Margin is confused with markup | Incorrect selling prices |
| Discounts are applied without visibility | Commercial risk |
| Previous rates overwrite historical assumptions | Weak auditability |
| Quotations are manually reformatted | Administrative overhead |
| Quote versions are overwritten | Poor commercial history |
| Actual costs are not compared to estimates | Pricing assumptions never improve |

The platform addresses these issues through deterministic, auditable workflows.

---

# 6. Product Principles

The generic platform should follow these principles.

## 6.1 Configuration Before Custom Code

A new customer should be able to change:

- branding;
- services/work types;
- materials;
- labour rates;
- travel rules;
- waste prices;
- preliminaries;
- packages;
- margins;
- minimum job value;
- quotation terms;

without changing application source code.

## 6.2 Deterministic Commercial Logic

AI must never be required for core pricing.

Every commercial number must be derived from:

- explicit measurements;
- approved rates;
- configured calculation rules;
- defined margin rules;
- authorised overrides.

## 6.3 Historical Integrity

An estimate or quotation must remain understandable after central rates change.

## 6.4 Surveyor-Friendly UX

The application should be usable by field staff who are not software specialists.

## 6.5 Owner-Safe Administration

Commercial data should be editable through controlled forms rather than formulas, JSON, or database tools.

## 6.6 Extensibility

New service categories should be addable without rebuilding the entire system.

## 6.7 Local-First Production

The first production deployment should work entirely inside a company-controlled environment.

## 6.8 Cloud-Ready Architecture

Local-first must not mean architecturally trapped.

---

# 7. Generic End-to-End Business Workflow

The generic workflow is:

```text
1. Customer created / selected
             ↓
2. Site / property created / selected
             ↓
3. Survey / site visit / job request created
             ↓
4. Surveyor records findings and measurements
             ↓
5. Work scope selected
             ↓
6. Specification / options selected
             ↓
7. Travel / waste / preliminaries added
             ↓
8. Pricing engine calculates internal cost
             ↓
9. Target sell price calculated
             ↓
10. Commercial review
             ↓
11. Approval if required
             ↓
12. Customer quotation generated
             ↓
13. Quotation issued
             ↓
14. Revision if scope or price changes
             ↓
15. Accepted / declined / expired
             ↓
16. Accepted quotation becomes job baseline
             ↓
17. Actual costs recorded
             ↓
18. Quoted-vs-actual profitability reviewed
```

A contractor may use only part of this workflow initially, but the data model should support the full lifecycle.

---

# 8. User Roles

The platform should use role-based permissions.

## 8.1 Administrator

Can manage:

- users;
- roles;
- company settings;
- rate tables;
- work types;
- pricing rules;
- document templates;
- backups;
- audit history.

## 8.2 Business Owner / Commercial Manager

Can:

- review all estimates;
- see cost and margin;
- approve overrides;
- maintain selected rates/settings;
- review profitability;
- reopen or supersede estimates;
- review actual-vs-estimated performance.

## 8.3 Surveyor / Estimator

Can:

- create customers/sites;
- create survey/job records;
- enter measurements;
- select work scope;
- calculate estimates;
- review pricing according to permission;
- generate quotations;
- create revisions.

Cannot normally:

- edit central rates;
- delete historical quotes;
- bypass approval rules.

## 8.4 Office / Administration

Can:

- maintain customer details;
- manage quote status;
- download quotation PDFs;
- record sent/accepted/declined information;
- add administrative notes.

## 8.5 Accounts / Costing User

Can:

- view accepted job baseline;
- enter actual costs;
- record labour/material variances;
- review profitability reports.

---

# 9. Company / Brand Configuration

All company identity must be stored as configurable data.

## 9.1 Company Profile

Fields:

- company name;
- trading name;
- legal entity;
- registration number;
- VAT number;
- telephone;
- email;
- website;
- registered address;
- trading address;
- logo;
- default currency;
- default VAT rate;
- quotation prefix;
- default payment terms;
- default validity period.

## 9.2 Brand Configuration

Support configurable:

- logo;
- primary colour;
- secondary colour;
- accent colour;
- quotation header;
- quotation footer;
- company contact block.

The generic repository must not contain visible branding tied to a previous client.

Synthetic demo branding should be used.

---

# 10. Customer Model

## 10.1 Customer Fields

- Customer ID
- Customer type
- Individual / organisation
- Title
- First name
- Last name
- Company name
- Email
- Telephone
- Alternative telephone
- Billing address
- Postcode
- Notes
- Active/inactive
- Created by
- Created date
- Updated date

## 10.2 Customer Types

Configurable examples:

- Homeowner
- Landlord
- Property Manager
- Commercial Client
- Contractor
- Architect
- Developer
- Surveyor
- Facilities Manager
- Other

---

# 11. Site / Property Model

One customer may own or manage multiple sites.

Recommended fields:

- Site ID
- Customer ID
- Site name
- Address lines
- Town
- County/region
- Postcode
- Site contact
- Site telephone
- Property type
- Occupancy type
- Parking/access notes
- Risk/access notes
- Travel origin
- General notes

Relationship:

```text
Customer
    ├── Site A
    │     ├── Survey
    │     ├── Estimate
    │     └── Quote
    │
    └── Site B
          ├── Survey
          └── Estimate
```

---

# 12. Survey / Site Visit Record

The platform should support an optional structured survey layer.

Some contractors will use it heavily; others may create estimates directly.

## 12.1 Survey Fields

- Survey reference
- Customer
- Site
- Survey date
- Surveyor
- Survey type
- Site notes
- Diagnosis/findings
- Recommended scope
- Access constraints
- Photos/documents
- Survey fee
- Survey status

## 12.2 Why Survey Should Be Separate from Estimate

A survey describes:

> what exists on site.

An estimate describes:

> how the proposed works are commercially priced.

Separating these allows:

- multiple estimate revisions from one survey;
- rejected scope alternatives;
- stronger auditability;
- future report-generation features.

---

# 13. Estimate Lifecycle

Recommended states:

```text
DRAFT
  ↓
PRICED
  ↓
REVIEW_REQUIRED
  ↓
APPROVED
  ↓
READY_TO_QUOTE
  ↓
QUOTED
  ↓
ACCEPTED / DECLINED / EXPIRED
  ↓
JOB_COSTING
  ↓
CLOSED
```

Not every organisation needs every state, so workflow states should be configurable where practical.

---

# 14. Estimate Revision Model

Issued quotations must never be silently overwritten.

Example:

```text
Estimate EST-00125
    ├── Revision 1
    │     └── Quotation EST-00125-R1
    ├── Revision 2
    │     └── Quotation EST-00125-R2
    └── Revision 3
          └── Quotation EST-00125-R3
                └── Accepted
```

Every revision should preserve:

- measurements;
- scope;
- specification;
- rates;
- costs;
- margin;
- sell price;
- terms;
- quotation wording;
- creator;
- approver;
- issue date.

---

# 15. Work-Type / Service Architecture

The system should model estimating as configurable **work-type modules**.

Each work type should contain:

- code;
- name;
- category;
- active/inactive;
- measurement fields;
- option fields;
- material mappings;
- labour rules;
- package rules;
- quote description template;
- target margin;
- minimum charge;
- validation rules.

Example:

```text
Work Type
├── Input Schema
├── Calculation Rule
├── Rate References
├── Optional Add-ons
├── Labour Method
├── Margin Rule
└── Customer Description
```

---

# 16. Starter Demonstration Work Types

To preserve the technical richness of the existing product while removing company specificity, the generic demo branch can ship with synthetic example modules.

These are **demonstration templates**, not hard-coded target-market limits.

## 16.1 Injection Treatment & Replastering

Inputs:

- number of walls;
- wall length;
- treatment length;
- replaster height;
- plaster specification.

Derived:

- linear metres;
- replaster area;
- material quantities;
- labour output.

## 16.2 Membrane Waterproofing System

Inputs:

- wall area;
- floor area;
- membrane specification;
- fixing type;
- drainage channel;
- battens;
- boarding.

## 16.3 Pump / Drainage Package

Inputs:

- package;
- pump configuration;
- backup option;
- alarm;
- installation complexity.

## 16.4 Timber Remedial Treatment

Inputs:

- treatment basis;
- area;
- linear length;
- repair quantity;
- floor replacement.

## 16.5 Ventilation Equipment

Inputs:

- equipment type;
- quantity;
- installation type;
- duct/grille option;
- electrical/access allowance.

These starter modules demonstrate both:

- measurement-driven pricing;
- package-driven pricing.

---

# 17. Generic Measurement Schema

A configurable work type should support measurement field types such as:

- integer;
- decimal;
- currency;
- metres;
- linear metres;
- square metres;
- cubic metres;
- quantity;
- hours;
- days;
- dropdown;
- checkbox;
- multi-select;
- package;
- text note.

Example definition:

```json
{
  "code": "wall_area",
  "label": "Wall area",
  "type": "decimal",
  "unit": "m²",
  "required": true,
  "min": 0
}
```

For the first production release, complex formulas may remain code-backed while the schema is configuration-driven.

A later rules engine can make more work types fully data-driven.

---

# 18. Rate Administration

Central rate management is a core product feature.

The business owner must not need to edit:

- source code;
- JSON files;
- spreadsheets containing formulas;
- database tables.

## 18.1 Material Rates

Fields:

- code;
- description;
- category;
- supplier/reference;
- unit;
- cost;
- waste factor;
- effective date;
- active/inactive;
- notes.

## 18.2 Labour Rates

Support:

- hourly;
- day rate;
- per unit;
- per linear metre;
- per m²;
- per m³;
- per item;
- package labour;
- minimum labour allocation.

## 18.3 Equipment / Package Rates

For fixed-price or bundled systems.

A package may include:

- materials;
- equipment;
- labour;
- consumables;
- fixed preliminaries;
- default margin.

## 18.4 Waste / Disposal

Examples:

- bagged waste;
- disposal allowance;
- skip sizes;
- haulage;
- specialist disposal.

## 18.5 Travel

Configurable:

```text
Travel Origin
    ↓
Distance Band
    ↓
Charge
```

## 18.6 Preliminaries

Examples:

- setup;
- parking;
- congestion charge;
- protection;
- restricted access;
- carrying;
- scaffold/tower;
- permit;
- specialist access;
- welfare;
- other.

---

# 19. Rate Versioning

A production rate should not simply be overwritten.

Each change should record:

- previous cost;
- new cost;
- effective date;
- changed by;
- changed at;
- reason.

Example:

```text
Rate MAT-001

01 Jan 2026   £8.20
01 Apr 2026   £8.65
01 Sep 2026   £9.10
```

The estimate stores the rate version actually used.

---

# 20. Historical Pricing Snapshot

When an estimate is priced, store a snapshot containing:

- rate ID;
- rate version;
- unit;
- unit cost;
- quantity;
- waste factor;
- calculated cost;
- labour rate;
- package definition;
- margin rule.

This guarantees:

```text
Rate changes tomorrow
        ↓
Old quotation remains commercially reproducible
```

---

# 21. Pricing Engine

The pricing engine should remain a dedicated backend domain service.

## 21.1 Base Cost

```text
Materials
+ Labour
+ Equipment / Packages
+ Waste / Disposal
+ Travel
+ Access / Preliminaries
+ Other Direct Costs
= Total Estimated Cost
```

## 21.2 True Margin Formula

Target margin is calculated from sell price:

```text
Sell Price = Cost / (1 - Margin %)
```

Example:

```text
Cost:          £1,000
Target margin: 30%

Sell:
£1,000 / 0.70 = £1,428.57
```

This produces a real 30% gross margin.

---

# 22. Margin vs Markup

The product should make this distinction explicit.

## Margin

```text
Margin % =
(Sell - Cost) / Sell
```

## Markup

```text
Markup % =
(Sell - Cost) / Cost
```

A 30% markup is not a 30% margin.

The system should use the commercial convention selected in company settings, with **true gross margin** recommended as the default.

---

# 23. Work-Type Margin

Each work type can have its own default target margin.

Example synthetic configuration:

| Work Type | Target |
|---|---:|
| Treatment & replaster | 35% |
| Membrane waterproofing | 32% |
| Pump package | 30% |
| Timber remediation | 33% |
| Ventilation | 28% |

Demo values must be clearly marked as synthetic.

Production customers replace them with their own commercial targets.

---

# 24. Job-Level Costs

Travel, waste and preliminaries may apply to the whole job rather than one work type.

The generic engine should support one of two configurable strategies.

## Strategy A — Allocate

Distribute job-level cost across work types using:

- base-cost weighting;
- sell-price weighting;
- configurable allocation.

## Strategy B — Separate Commercial Component

Treat job-level cost as a dedicated estimate component with its own margin rule.

The chosen strategy must preserve reconciliation.

---

# 25. Minimum Job Value

Support:

- global minimum;
- work-type minimum;
- customer-specific minimum if needed later.

Example:

```text
Calculated sell:   £480
Minimum job value: £750

Final sell:        £750
```

The internal review should show the adjustment explicitly.

---

# 26. Sell-Price Override

An authorised user may override the calculated sell price.

The system must immediately show:

- calculated sell;
- override sell;
- margin value;
- actual margin%;
- variance from target;
- approval requirement.

Required override metadata:

- user;
- timestamp;
- reason;
- approval status.

---

# 27. Approval Workflow

Examples of configurable rules:

- no approval when actual margin ≥ target;
- manager approval below target;
- block quote below absolute minimum margin;
- manager approval for discount > X%;
- approval for custom/manual lines;
- approval for unusually high-value estimates.

These rules should be configurable per deployment.

---

# 28. Internal Price Review

The commercial review page should contain:

## Summary

- materials;
- labour;
- packages/equipment;
- waste;
- travel;
- preliminaries;
- other;
- total cost;
- target margin;
- calculated sell;
- final sell;
- margin value;
- actual margin;
- minimum-job adjustment;
- approval status.

## Work-Type Detail

Per work type:

- measurements;
- selected specification;
- derived quantities;
- material build-up;
- labour basis;
- cost;
- target sell;
- warnings.

---

# 29. Customer Quotation

The customer quotation should be generated only from an approved/reviewed estimate state.

## 29.1 Header

- configurable logo;
- company details;
- quotation number;
- revision;
- issue date;
- validity date;
- customer;
- site;
- reference.

## 29.2 Scope

For each work type:

- customer-facing title;
- plain-English scope;
- quantities where appropriate;
- specification;
- inclusions;
- optional notes.

## 29.3 Commercial Section

Recommended default:

- subtotal ex VAT;
- VAT;
- total inc VAT.

Internal data must not appear:

- material cost;
- labour cost;
- target margin;
- internal margin value;
- internal rates.

---

# 30. Customer-Line Reconciliation

If the quotation displays individual work-type prices:

```text
Sum(all visible line prices)
=
Displayed subtotal
```

If exact allocation is not desirable, use:

```text
Scope descriptions
+
One overall contract price
```

Never display customer line values that do not reconcile to the subtotal.

---

# 31. Quotation PDF

Requirements:

- A4;
- print-ready logo;
- configurable company information;
- quotation date;
- revision;
- page numbers;
- repeating header/footer when multi-page;
- correct VAT;
- exact reconciliation;
- assumptions;
- exclusions;
- payment terms;
- validity;
- optional acceptance section.

Filename example:

```text
EST-00125-R2-Customer-Quotation.pdf
```

---

# 32. Quotation Versioning

Every issued version is immutable.

Fields:

- quotation ID;
- estimate revision;
- version;
- issue date;
- validity;
- PDF path;
- quotation snapshot;
- created by;
- approved by;
- status.

Statuses:

- Draft
- Ready
- Sent
- Accepted
- Declined
- Expired
- Superseded

---

# 33. Acceptance

Record:

- accepted quotation version;
- acceptance date;
- accepted by;
- acceptance method;
- PO/reference;
- deposit note;
- attachment/reference.

Only one quote version should be the accepted commercial baseline.

---

# 34. Actual Costing

The generic product should include a practical quoted-vs-actual module.

## 34.1 Materials

- item;
- work type;
- quantity;
- unit cost;
- total;
- note.

## 34.2 Labour

- work type;
- crew/person description;
- hours/days;
- actual labour cost;
- note.

## 34.3 Other

- waste;
- travel;
- access;
- equipment;
- variation;
- subcontractor;
- other.

---

# 35. Quoted-vs-Actual Comparison

Example:

| Category | Estimated | Actual | Variance |
|---|---:|---:|---:|
| Materials | £2,400 | £2,525 | +£125 |
| Labour | £1,800 | £2,050 | +£250 |
| Waste | £180 | £180 | £0 |
| Travel | £120 | £150 | +£30 |
| Prelims | £350 | £425 | +£75 |
| **Total cost** | **£4,850** | **£5,330** | **+£480** |

Then show:

- estimated margin;
- actual margin;
- margin variance.

This is one of the strongest long-term value propositions of the product.

---

# 36. Reporting

Initial reporting should include:

- estimates by date;
- estimates by user;
- quotation status;
- average quotation value;
- win/loss value;
- target margin;
- actual margin;
- override frequency;
- margin by work type;
- estimate-vs-actual variance;
- rate change history.

---

# 37. Dashboard

Recommended dashboard sections:

## Work Queue

- Draft
- Review Required
- Ready to Quote
- Quoted
- Accepted
- Expired

## Search

- estimate number;
- customer;
- site;
- postcode;
- date;
- status;
- surveyor/estimator.

## Actions

- New estimate
- Open
- Revise
- Download latest quote
- View history

---

# 38. Attachments

Support:

- survey reports;
- photos;
- sketches;
- specifications;
- customer correspondence;
- supplier documents;
- acceptance evidence.

For local deployment, files should use controlled local storage with database metadata.

Example:

```text
data/
  documents/
    customers/
    sites/
    surveys/
    estimates/
    quotations/
    actual-costs/
```

---

# 39. Audit Trail

Track:

- user login;
- customer changes;
- site changes;
- survey changes;
- estimate creation;
- measurement changes;
- pricing calculation;
- rate changes;
- margin changes;
- override;
- approval;
- quotation generation;
- status changes;
- acceptance;
- actual-cost edits.

Audit fields:

- timestamp;
- user;
- entity;
- entity ID;
- action;
- previous value;
- new value.

---

# 40. Data Retention

Use archive/status rather than destructive delete for:

- estimates;
- issued quotations;
- accepted records;
- audit events;
- rate history.

Normal users should not be able to hard-delete historical commercial records.

---

# 41. Recommended Production Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- form-validation library
- lightweight state/query layer

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

## Database

- PostgreSQL

## Migrations

- Alembic

## PDF

- ReportLab or equivalent server-side generator

## Deployment

- Docker
- Docker Compose

## Testing

- Pytest
- frontend unit/component tests
- end-to-end critical workflow tests

---

# 42. Generic Local Architecture

```text
┌───────────────────────────────────────────┐
│ Browser                                  │
│ React / TypeScript                       │
│ Desktop + Laptop + Tablet                │
└────────────────────┬──────────────────────┘
                     │ REST API
                     ▼
┌───────────────────────────────────────────┐
│ FastAPI                                   │
│                                           │
│ Auth Service                              │
│ Customer / Site Service                   │
│ Survey Service                            │
│ Estimate Service                          │
│ Pricing Engine                            │
│ Rate Management                           │
│ Approval Service                          │
│ Quotation Service                         │
│ Actual Cost Service                       │
│ Audit Service                             │
└────────────────────┬──────────────────────┘
                     │
              ┌──────┴───────┐
              ▼              ▼
┌──────────────────────┐   ┌───────────────────┐
│ PostgreSQL           │   │ Local File Store  │
│ Commercial data      │   │ PDFs / documents  │
└──────────────────────┘   └───────────────────┘
```

---

# 43. Deployment Options

## 43.1 Single Workstation

Suitable for:

- one primary user;
- demonstrations;
- very small contractor.

## 43.2 Local Office Server / LAN

Recommended for real multi-user operation.

```text
Local server
├── API
├── PostgreSQL
├── File store
└── Frontend

Company users
└── Browser over LAN
```

## 43.3 Future Cloud

The architecture should later support:

- managed PostgreSQL;
- object storage;
- cloud authentication;
- email integration;
- SaaS multi-tenancy.

---

# 44. Docker Compose

Recommended services:

```text
services:
  frontend
  api
  postgres
```

Persistent volumes:

```text
database volume
document volume
backup volume
```

Benefits:

- reproducible deployment;
- easier installation;
- easier upgrades;
- environment consistency.

---

# 45. Authentication

Minimum local-production requirements:

- username/password;
- secure password hashing;
- role-based permissions;
- disabled users;
- session expiry;
- failed-login controls;
- logout;
- password change.

A local deployment still contains commercially sensitive pricing data and needs access control.

---

# 46. Security Principles

- backend is the source of pricing truth;
- no pricing authority in frontend;
- server-side authorisation;
- no plaintext passwords;
- no credentials in frontend code;
- validate all incoming data;
- sanitize uploaded filenames;
- prevent directory traversal;
- restrict margin/rate access;
- audit overrides;
- backup commercial data.

---

# 47. Backend as Source of Truth

Correct architecture:

```text
Frontend
    captures:
        measurements
        options
        scope

Backend
    validates
    loads rates
    performs calculations
    applies margin
    applies minimum
    records snapshots
    stores result
```

Never trust a sell price calculated only in the browser.

---

# 48. Currency & Rounding

Use exact decimal arithmetic.

Recommended storage:

```text
NUMERIC(12,2)
```

or integer minor units.

Required invariants:

```text
Subtotal + VAT = Total
```

and:

```text
Visible line totals = Subtotal
```

where line prices are displayed.

---

# 49. Generic Database Model

Core entities:

```text
User
Role
Permission

CompanyProfile
Office
CompanySetting

Customer
Site
Survey
Attachment

Estimate
EstimateRevision
EstimateWorkItem
EstimateMeasurement
EstimateAllowance

WorkTypeDefinition
WorkTypeFieldDefinition
RateItem
RateVersion
PackageDefinition
PricingRule
TravelRule
PreliminaryRate

PricingSnapshot
PricingSnapshotItem

Approval
Quotation
QuotationVersion
Acceptance

ActualCostEntry

AuditEvent
```

---

# 50. Relationship Overview

```text
Company
  │
  ├── Users
  ├── Rates
  ├── Work Types
  └── Customers
        │
        └── Sites
              │
              └── Surveys
                    │
                    └── Estimates
                          │
                          ├── Revisions
                          │     ├── Work Items
                          │     ├── Measurements
                          │     ├── Pricing Snapshot
                          │     └── Approvals
                          │
                          ├── Quotations
                          │
                          └── Accepted Baseline
                                │
                                └── Actual Costs
```

---

# 51. Generic Repository Structure

Recommended target:

```text
backend/
  app/
    api/
    auth/
    customers/
    sites/
    surveys/
    estimates/
    pricing/
    rates/
    approvals/
    quotations/
    actual_costs/
    audit/
    settings/
    shared/
  migrations/
  tests/

frontend/
  src/
    app/
    components/
    features/
      auth/
      customers/
      sites/
      surveys/
      estimates/
      rates/
      quotations/
      actual-costs/
      settings/
    design-system/
    api/

docs/
  architecture/
  product/
  deployment/
  testing/
  demo/

data/
  demo/
  documents/
  backups/

docker/
docker-compose.yml
README.md
```

---

# 52. Genericisation Rules for This Branch

This branch must not contain customer-specific product identity.

## 52.1 Remove

Remove from code, UI, docs, tests and seed data:

- previous company name;
- previous logo;
- previous website;
- previous email/phone;
- previous addresses;
- real customer names;
- real project addresses;
- company-specific quotation numbers;
- company-specific assumptions;
- company-specific exclusions;
- company-specific supplier/rate data.

## 52.2 Replace With

Use synthetic examples:

```text
Company:
Northbridge Property Services Ltd

Customer:
Emma Thompson

Site:
24 Cedar Road, Reading RG1 4AB

Estimate:
EST-00001
```

All synthetic names should be clearly fictional.

---

# 53. Company Branding Must Become Configuration

Any current hard-coded company details should be replaced by:

```text
company_settings
```

Examples:

```text
company.name
company.logo
company.phone
company.email
company.address
company.website
company.primary_colour
company.quote_prefix
```

PDF and UI should read from configuration.

---

# 54. Generic Work-Type Naming

Avoid coding domain logic using branded or client-specific identifiers.

Bad:

```text
client_dpc
client_membrane_package
```

Better:

```text
injection_replaster
membrane_waterproofing
pump_package
timber_remediation
ventilation_installation
```

Even better long-term:

```text
work_type.code
```

with configurable definitions.

---

# 55. Generic Pricing Keys

Avoid:

```text
client_min_job
client_margin
```

Use:

```text
pricing.minimum_job_value
pricing.default_vat_rate
pricing.margin.<work_type_code>
```

---

# 56. Demo Data Strategy

The public/generic branch should ship with synthetic data only.

Include:

- fictional customers;
- fictional sites;
- synthetic rates;
- synthetic work types;
- fictional quote examples.

Every demo rate should state:

> Demonstration value only — not commercial advice.

This prevents the project from appearing to disclose client data.

---

# 57. White-Label Readiness

A new deployment should eventually require only:

1. logo;
2. company details;
3. colours;
4. quotation template;
5. rate data;
6. work-type rules;
7. margins;
8. terms.

This creates a repeatable professional-service model:

```text
Generic Platform
      +
Client Configuration
      +
Commercial Discovery
      ↓
Contractor-Specific Production System
```

---

# 58. Productisation Opportunity

The generic project can support multiple commercial offerings.

## Offering A — Custom Local Estimating Tool

For small contractors wanting an internal system.

## Offering B — Production Web Application

For multi-user companies.

## Offering C — Estimating + Job Costing

Adds actual-cost analysis.

## Offering D — Integrations

Adds:

- accounting;
- CRM;
- email;
- document storage.

## Offering E — SaaS Product

Future multi-tenant product.

The current branch should primarily target A–C while preserving a path to D/E.

---

# 59. Multi-Tenant Future Readiness

The first generic production release does not need full multi-tenancy.

However, avoid designs that make it impossible.

Recommended future boundary:

```text
Organisation
  ├── Users
  ├── Settings
  ├── Rates
  ├── Customers
  ├── Estimates
  └── Quotations
```

Do not implement tenant complexity prematurely if local deployment is the current goal.

---

# 60. Generic UI / UX Direction

The UI should look like a professional construction software product rather than a previous customer's website.

Recommended visual direction:

- neutral professional brand;
- navy / slate / neutral base;
- one configurable accent colour;
- strong typography;
- high readability;
- field-friendly spacing;
- clear commercial warnings;
- minimal decoration.

## Navigation

Recommended:

```text
Dashboard
Customers
Surveys
Estimates
Rates
Job Costing
Reports
Settings
```

---

# 61. Estimate Wizard

Recommended generic steps:

```text
1. Customer & Site
2. Survey / Job Details
3. Work Scope
4. Measurements & Options
5. Allowances
6. Price Review
7. Approval
8. Quotation
```

The UI can merge steps where appropriate for smaller screens.

---

# 62. Rate Management UX

Example:

```text
Rates > Materials

Search [________________]

Code      Description          Unit     Cost      Active
MAT-001   Wall membrane       m²       £8.40     Yes
MAT-002   Treatment fluid     litre    £12.50    Yes

[Add Rate] [Export]
```

Edit dialog:

```text
Description
Unit
Cost
Effective Date
Category
Reason for Change

[Save New Version]
```

Never expose JSON as the normal admin workflow.

---

# 63. Work-Type Configuration UX

Long-term admin capabilities may include:

- enable/disable work type;
- edit display name;
- set margin;
- set minimum;
- choose quotation description;
- configure available options.

Complex calculation formulas should initially remain developer-controlled until a safe rule-definition system is intentionally designed.

---

# 64. Error Handling

Bad:

```text
Calculation failed.
```

Good:

```text
This estimate cannot be priced because
"Floor membrane – 8 mm" has no active rate.

Open Rate Management or select another specification.
```

Errors should explain the business action required.

---

# 65. Autosave

Field users may be interrupted.

Recommended:

- save after each workflow step;
- save when pricing;
- visible "Saved" status;
- unsaved-change protection;
- manual Save remains available.

---

# 66. Backup

Local production requires strong backup procedures.

Backup:

- PostgreSQL;
- quotations;
- uploaded documents;
- settings;
- template assets.

Recommended:

- automatic daily backup;
- timestamped archives;
- secondary company-controlled copy;
- documented restore;
- periodic restore test.

---

# 67. Data Export

Provide CSV/XLSX export for:

- customers;
- estimates;
- rate tables;
- quoted-vs-actual;
- reports.

Exports support portability but are not the system of record.

---

# 68. Testing Strategy

## Pricing Tests

Test:

- each work type;
- mixed work types;
- package pricing;
- output labour;
- day-rate labour;
- travel;
- waste;
- preliminaries;
- minimum job;
- override;
- VAT;
- rounding.

## Historical Tests

- rate change does not alter old quote;
- quotation revision retains old version.

## Permission Tests

- estimator cannot edit rates;
- unauthorised user cannot approve;
- issued quote cannot be mutated.

## PDF Tests

- visible numbers reconcile;
- no internal margins;
- correct customer/site;
- correct issue date/version.

---

# 69. Demo Scenarios

A generic portfolio demo should include multiple scenarios.

## Scenario 1 — Multi-Work Estimate

Demonstrates:

- measurements;
- multiple work types;
- blended commercial result;
- quotation.

## Scenario 2 — Minimum Job

Shows minimum sell floor.

## Scenario 3 — Margin Override

Shows commercial warning and approval.

## Scenario 4 — Rate Change

Shows historical snapshot.

## Scenario 5 — Quote Revision

Shows R1 and R2.

## Scenario 6 — Actual Cost

Shows estimated vs actual margin.

These scenarios tell a stronger product story than one large estimate alone.

---

# 70. Production Acceptance Criteria

The generic system is production-ready when:

- company profile is configurable;
- no previous-client branding remains;
- all demo data is synthetic;
- users and roles work;
- rate UI works;
- work types price correctly;
- commercial totals reconcile;
- estimate revisions are immutable after issue;
- PDF is production quality;
- rate snapshots work;
- overrides are auditable;
- backup/restore is tested;
- quoted-vs-actual works;
- local deployment is documented;
- core workflows pass automated tests.

---

# 71. Generic Branch Refactoring Plan

## Phase 1 — Remove Client Identity

- rename app title;
- replace logos;
- replace company contact details;
- remove company URLs;
- replace real customers/sites;
- replace PDF header/footer;
- replace seed data.

## Phase 2 — Extract Company Configuration

- CompanyProfile entity;
- settings API;
- settings UI;
- quotation branding from database/config.

## Phase 3 — Genericise Domain Names

- remove client prefixes;
- generic estimate references;
- generic status labels;
- generic rate keys;
- generic work-type codes.

## Phase 4 — Generic Rate Administration

- rate CRUD;
- rate versions;
- synthetic sample data;
- margins;
- packages;
- travel;
- preliminaries.

## Phase 5 — Production Data Architecture

- PostgreSQL;
- migrations;
- audit;
- roles;
- customer/site/survey separation.

## Phase 6 — Commercial Lifecycle

- revisions;
- approvals;
- immutable quotation versions;
- acceptance.

## Phase 7 — Actual Costing

- cost entry;
- variance;
- reporting.

## Phase 8 — Production Hardening

- backup;
- logs;
- security;
- testing;
- deployment guide.

---

# 72. Git / Branch Guidelines

For the generic branch:

## Do

- use generic names;
- use synthetic data;
- document generic product behaviour;
- use configuration for branding;
- isolate vertical-specific demo modules.

## Do Not

- merge real client credentials;
- merge real rate lists;
- include real addresses/customer names;
- include proprietary quotation wording;
- hard-code client branding into components.

A client-specific implementation can later branch/configure from the generic product.

---

# 73. Recommended Naming Strategy

Avoid a name tied to damp proofing or one trade unless deliberately targeting that niche.

Recommended project-title styles:

- **Trade Estimating & Quoting Platform**
- **Field Estimate & Margin Control Platform**
- **Contractor Estimating Engine**
- **Job Costing & Quotation Platform**
- **Specialist Trade Estimator**

A final commercial brand can be chosen later.

For repository/documentation purposes, a descriptive name is safer than an unverified trademarkable product name.

---

# 74. Portfolio Positioning

A strong portfolio description:

> Built a configurable production-grade estimating and quotation platform for specialist contractors. The system converts site measurements and service-specific inputs into deterministic job costs, applies controlled margin rules, supports central rate administration, quotation revisions, PDF generation, approval workflows, historical pricing snapshots, and quoted-vs-actual profitability analysis. Designed as a local-first React/TypeScript + FastAPI + PostgreSQL application with an architecture that can later support cloud and SaaS deployment.

This description demonstrates:

- AEC/construction workflow knowledge;
- full-stack engineering;
- domain modelling;
- commercial calculation logic;
- document generation;
- product architecture;
- production readiness.

---

# 75. Client Proposal Positioning

When using this project to market services, present it as evidence that you can build:

- custom estimating software;
- pricing engines;
- quotation automation;
- contractor field tools;
- rate-management systems;
- commercial approval workflows;
- job-costing platforms.

Do not present synthetic demo rates as industry-standard commercial rates.

---

# 76. Product Differentiators

The project should emphasize these differentiators.

## 76.1 Deterministic Pricing

No opaque AI-generated price.

## 76.2 True Margin Control

Commercially correct margin rather than accidental markup.

## 76.3 Rate Snapshots

Old quotations remain reproducible.

## 76.4 Configurable Service Modules

Supports different trades.

## 76.5 Survey-to-Quote Workflow

Captures field context rather than just accounting data.

## 76.6 Quoted-vs-Actual Feedback

Improves pricing quality over time.

## 76.7 Local-First

Suitable for companies that do not initially want public cloud deployment.

## 76.8 SaaS-Ready Architecture

Can evolve without rewriting the estimating engine.

---

# 77. Future Enhancements

Potential later features:

- offline field mode;
- mapping/distance calculation;
- email sending;
- e-signature;
- accounting integration;
- CRM integration;
- purchase orders;
- supplier price import;
- customer portal;
- scheduling;
- job management;
- photos and annotated plans;
- AI survey-note summarisation;
- AI scope-draft assistance;
- multi-tenant SaaS;
- analytics dashboards.

---

# 78. AI Strategy

AI is optional and should remain controlled.

Useful future AI:

- convert survey notes into draft work scope;
- summarise documents;
- classify uploaded reports;
- generate customer-friendly wording;
- highlight unusual estimates;
- search historical jobs.

AI must not independently:

- invent measurements;
- change commercial rates;
- override margin;
- issue quotations;
- approve jobs.

---

# 79. Recommended Next Implementation Milestone

The next milestone on the generic branch should be:

```text
Generic Branding
      ↓
Company Settings
      ↓
Synthetic Demo Data
      ↓
Rate Administration
      ↓
PostgreSQL
      ↓
Authentication / Roles
      ↓
Production Estimate Revision
      ↓
Quotation Versioning
```

This milestone creates the reusable core before expanding further into job costing and integrations.

---

# 80. Definition of the Generic Product

The generic project should ultimately be understandable in one sentence:

> **A configurable estimating, margin-control and quotation platform that helps specialist contractors turn structured site measurements into consistent commercial prices, professional quotations, and reliable profitability data.**

The product should stand on its own technically and commercially.

It should not require knowledge of the company or project from which the original proof of concept evolved.

---

# 81. Final Recommendation

This generic branch should become the **master reusable product foundation**.

Future client work should follow the pattern:

```text
Generic Platform
       ↓
Industry / Trade Configuration
       ↓
Client Commercial Discovery
       ↓
Client Rates & Work Rules
       ↓
Client Branding
       ↓
Production Deployment
```

This approach delivers two important benefits.

### For Engineering

Features such as pricing, quotations, rate history, audit, approvals, backup and job costing are developed once and reused.

### For Business Development

The product can be demonstrated to many prospective clients without exposing a previous client's identity or proprietary information.

The branch therefore becomes more than a portfolio clone of one contractor's system.

It becomes a reusable **construction and specialist-trade estimating product architecture** that can support future freelance projects, consultancy engagements, custom deployments, and eventually a commercial software offering.

---

*End of document*
