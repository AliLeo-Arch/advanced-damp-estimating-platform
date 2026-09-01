# Advanced Damp Job Estimating & Quoting Tool — POC Project Overview

> **Document version note**  
> This file is **Version 1.0 — original proposal / planning overview**.  
> For the professional description of the **current implemented POC**, see:  
> [`Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview_v2.md`](./Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview_v2.md)

## 1. Project Overview

The **Advanced Damp Job Estimating & Quoting Tool** is a lightweight, mobile-friendly web application designed to help UK damp-proofing and structural-waterproofing surveyors create consistent, margin-controlled estimates and customer quotations directly from site survey measurements.

The Proof of Concept (POC) is intended to demonstrate how Advanced Damp Ltd can replace manual pricing with a structured estimating workflow that:

- reduces quotation preparation time;
- standardises pricing across surveyors;
- centralises materials and labour rates;
- protects target margins;
- makes pricing assumptions transparent;
- generates professional customer quotations;
- stores estimates for future quoted-vs-actual analysis; and
- provides a foundation that can be expanded into a larger estimating and operational platform.

The POC will be intentionally focused on the client's immediate requirements while using an architecture that supports future expansion without rebuilding the estimating engine from scratch.

---

## 2. Business Problem

Advanced Damp Ltd currently prices work manually. This creates several operational challenges:

- Estimating takes too long.
- Different surveyors may price similar work differently.
- Material and labour rates can become inconsistent.
- Margin is difficult to control across different job types.
- Pricing changes may require updating multiple spreadsheets or calculations.
- Surveyors may not immediately see the commercial impact of discounts or price overrides.
- Previous estimates are difficult to analyse systematically.
- Comparing quoted cost against actual project cost is harder than necessary.
- Producing consistent, branded customer quotations requires additional manual work.

The POC addresses these problems by introducing a structured, configurable estimating engine with a simple surveyor-facing workflow.

---

## 3. POC Objectives

The primary objective is to prove that Advanced Damp's estimating process can be converted into a practical digital workflow that is fast enough for on-site use and simple enough for a non-technical business owner to maintain.

The POC will demonstrate:

1. Creation of a new estimate.
2. Selection of one or more work types.
3. Entry of site measurements and job-specific options.
4. Automatic calculation of material, labour, waste, travel, access, and preliminary costs.
5. Application of job-specific target margins.
6. Immediate visibility of margin percentage and margin value.
7. Controlled manual price or margin override.
8. Enforcement of a minimum job value.
9. Generation of a customer-facing quotation.
10. PDF export.
11. Saving and reopening estimates.
12. Central maintenance of pricing rates.
13. An extensible architecture for future quoted-vs-actual costing and operational reporting.

---

## 4. Recommended POC Platform

### Lightweight Responsive Web Application

For the POC, the recommended solution is a **simple responsive web application** rather than a complex enterprise platform or a heavily formula-driven spreadsheet.

The main reasons are:

- Surveyors can use it on laptops, tablets, and mobile devices.
- Pricing logic can be protected from accidental formula changes.
- Rate tables can be maintained through a controlled administration screen.
- The estimating rules can grow without creating increasingly fragile spreadsheet formulas.
- Estimates can be saved in a structured database.
- PDF quotation generation can be automated.
- User permissions and authentication can be added later.
- Quoted-vs-actual reporting can be introduced without replacing the original estimating engine.
- The same foundation can eventually support CRM, job management, scheduling, document storage, dashboards, and integrations.

The POC should remain deliberately lightweight so it demonstrates value quickly without creating unnecessary infrastructure.

---

## 5. Proposed Technology Stack

### Frontend

- React
- TypeScript
- Responsive web interface
- Mobile/tablet-friendly forms

### Backend

- Python
- FastAPI

### Database

- SQLite for the local POC

### PDF Generation

Server-side or application-generated branded PDF quotation.

### Deployment for POC

The application will initially run locally for demonstration and evaluation.

The architecture will allow SQLite to be replaced later by PostgreSQL without redesigning the application.

### Future Production Options

A production deployment could later use:

- PostgreSQL
- Cloud object storage
- Docker
- AWS / Azure / another managed hosting platform
- Automated backups
- Role-based authentication
- Audit history
- Email and CRM integrations

---

## 6. POC Users

### Surveyor

The surveyor needs a fast workflow for:

- creating an estimate;
- entering survey measurements;
- selecting treatment options;
- adding job-specific allowances;
- reviewing calculated pricing;
- applying an authorised override;
- generating the quotation; and
- saving the estimate.

### Business Owner / Administrator

The business owner needs to:

- update material rates;
- update labour rates;
- configure travel bands;
- maintain waste and skip prices;
- define minimum job values;
- maintain target margins;
- review estimates; and
- eventually analyse quoted-vs-actual profitability.

For the POC, these roles can initially operate within the same application. Formal role-based permissions can be introduced during production development.

---

# 7. Core Functional Modules

## 7.1 Estimate Dashboard

The dashboard provides access to saved estimates.

### POC Functions

- Create new estimate
- View recent estimates
- Search by customer or reference
- View estimate status
- Reopen an estimate
- Duplicate an existing estimate
- Generate/re-generate quotation

### Example Estimate Statuses

- Draft
- Ready to Quote
- Quoted
- Accepted
- Declined

Additional operational statuses can be added later.

---

## 7.2 Customer & Site Information

Each estimate will contain basic customer and project information.

### Suggested Fields

- Estimate reference
- Customer name
- Company name, where applicable
- Email
- Telephone
- Site address
- Postcode
- Survey date
- Surveyor
- Project/job notes

Future versions may connect this information to a CRM or dedicated customer/project database.

---

# 8. Supported Work Types

The POC pricing architecture will use configurable work-type modules.

Each work type can define:

- required measurements;
- available specifications/options;
- material calculations;
- labour calculations;
- waste allowance;
- additional fixed costs;
- target margin;
- minimum charge rules; and
- quotation descriptions.

This makes it possible to add future trades or treatment systems without rewriting the entire application.

---

## 8.1 Chemical DPC Injection & Replastering

### Survey Inputs

- Number of walls
- Wall length in linear metres
- Replaster height
- Optional wall-specific measurements
- DPC treatment requirement
- Plaster/render specification
- Optional additional preparation

### Derived Quantities

The system can calculate:

- total DPC linear metres;
- total replastering area in m²;
- chemical requirement;
- plaster/render material allowance;
- labour requirement;
- waste allowance.

### Pricing Components

- DPC chemical
- Injection consumables
- Render/plaster materials
- Labour
- Waste
- Skip allowance where applicable
- Travel
- Access/preliminaries

---

## 8.2 Cavity Drain Membrane Systems

### Survey Inputs

- Wall area in m²
- Floor area in m²
- Membrane specification
- Fixing specification
- Battens
- Boarding specification
- Drainage components where applicable

### Pricing Components

- Wall membrane
- Floor membrane
- Fixings
- Sealing materials
- Battens
- Boarding
- Drainage channel / accessories
- Labour
- Waste
- Skip
- Travel
- Access/preliminaries

The configuration model will allow additional membrane systems and supplier products to be added later.

---

## 8.3 Sump & Pump Installations

Sump systems are primarily package-based rather than purely measurement-based.

### POC Package Options

- Standard sump package
- Twin pump package
- Battery backup
- Optional alarms/accessories

### Pricing Logic

Each package can contain:

- material package cost;
- expected labour allowance;
- installation consumables;
- waste/preliminaries;
- configurable margin.

Optional components can be added to the selected package.

---

## 8.4 Timber Treatment

### Survey Inputs

Depending on treatment type:

- area in m²;
- linear metres;
- joist quantity;
- floor area;
- treatment type.

### Example Pricing Components

- Timber treatment chemical
- Replacement timber
- Joist repair/replacement
- Floor works
- Labour
- Disposal/waste
- Access
- Travel

The POC will demonstrate a modular structure so additional timber repair types can be introduced later.

---

## 8.5 Condensation & Ventilation

### Example Items

- Extractor fan
- PIV unit
- Additional ventilation equipment

### Inputs

- Equipment type
- Quantity
- Installation option

### Pricing Logic

Typically:

**Unit Cost + Installation Labour + Associated Materials + Margin**

Each unit can have its own configurable installed-price logic.

---

# 9. Central Rate Management

One of the most important requirements is allowing a non-technical business owner to update rates safely.

The POC will therefore separate **pricing data** from **calculation logic**.

## Rate Categories

### Materials

Example fields:

- Item code
- Item name
- Supplier/reference
- Unit
- Cost per unit
- Waste percentage
- Active/inactive

### Labour

Supported methods:

#### Day Rate

Example:

`Estimated Labour Days × Labour Day Rate`

#### Output Rate

Examples:

`Wall Area × Labour Rate per m²`

or

`Wall Length × Labour Rate per linear metre`

### Waste & Skip

Examples:

- Small waste allowance
- Midi skip
- Builder's skip
- Large skip

### Travel Bands

Example configurable structure:

| Band | Distance | Charge |
|---|---|---:|
| Local | 0–10 miles | Configurable |
| Band 1 | 10–25 miles | Configurable |
| Band 2 | 25–50 miles | Configurable |
| Band 3 | 50+ miles | Configurable |

The exact bands and charges will be defined during discovery.

### Preliminaries

Examples:

- Standard preliminaries
- Parking
- Congestion/ULEZ allowance
- Restricted access
- Protection
- Additional setup
- Specialist access

---

# 10. Pricing Engine

The pricing engine is the core of the application.

It will calculate a structured internal job cost before applying the commercial pricing rules.

## 10.1 Base Cost

A simplified calculation is:

```text
Base Cost =
    Materials
  + Labour
  + Waste / Skip
  + Travel
  + Access
  + Preliminaries
  + Other Direct Costs
```

---

## 10.2 Target Margin

Margin should be calculated correctly rather than treated as a simple markup.

For example, where:

- Cost = £1,000
- Target Margin = 30%

The sell price is:

```text
Sell Price = Cost / (1 - Margin %)
```

Therefore:

```text
£1,000 / (1 - 0.30) = £1,428.57
```

The gross margin is:

```text
£1,428.57 - £1,000 = £428.57
```

Margin percentage:

```text
£428.57 / £1,428.57 = 30%
```

This distinction is important because applying a 30% markup to £1,000 would produce only a 23.08% margin.

The system will consistently calculate target margin using the agreed commercial definition.

---

## 10.3 Target Margin by Job Type

Different work categories can have different default margins.

Example:

| Work Type | Default Target Margin |
|---|---:|
| DPC / Replastering | Configurable |
| Cavity Drain Membrane | Configurable |
| Sump & Pump | Configurable |
| Timber Treatment | Configurable |
| Ventilation | Configurable |

Actual values will be entered by Advanced Damp Ltd.

---

## 10.4 Margin Override

An authorised user can change:

- target margin percentage; or
- final sell price.

When changed, the application immediately recalculates:

- revised sell price;
- revised margin £;
- revised margin %.

If margin falls below the configured target, the interface should clearly flag it.

Future production versions can require manager approval for low-margin quotations.

---

## 10.5 Minimum Job Value

The system will support a configurable minimum sell price.

Example logic:

```text
Calculated Sell Price = £620
Minimum Job Value = £750

Final Sell Price = £750
```

The application will still retain the calculated cost and show the resulting margin after the minimum price is applied.

Minimum values may later be configurable globally or by job type.

---

# 11. Estimate Summary

Before quotation generation, the surveyor will see a commercial summary.

### Internal Estimate Summary

- Materials cost
- Labour cost
- Waste / skip
- Travel
- Preliminaries
- Other costs
- Total estimated cost
- Target margin %
- Calculated sell price
- Final sell price
- Margin value (£)
- Actual margin %
- Minimum-job adjustment
- Manual override, if any

This is an **internal view** and does not need to expose detailed cost or margin information to the customer.

---

# 12. Customer-Facing Quotation

The system will generate a clean customer quotation using Advanced Damp branding.

## Proposed Quotation Content

- Advanced Damp logo and company details
- Quote reference
- Date
- Customer details
- Site address
- Scope of works
- Work descriptions
- Optional line-item grouping
- Total quotation value
- VAT treatment
- Assumptions
- Exclusions
- Payment terms
- Quote validity
- Acceptance/sign-off area where appropriate

The customer quotation will deliberately hide internal:

- material costs;
- labour costs;
- target margins;
- margin values; and
- internal commercial notes.

---

# 13. PDF Export

The POC will generate a professional PDF quotation.

The PDF should:

- use company branding;
- have consistent formatting;
- display correctly across common devices;
- contain the approved quotation total;
- show clear scope descriptions;
- be suitable for emailing directly to the customer.

Future enhancements can include automatic email delivery and electronic acceptance.

---

# 14. Estimate Storage

Every estimate will be stored in the database.

## Suggested POC Data

### Estimate Header

- Estimate ID
- Reference
- Customer
- Site
- Surveyor
- Date
- Status
- Total cost
- Sell price
- Margin value
- Margin percentage

### Estimate Work Items

- Work type
- Measurement
- Quantity
- Specification
- Calculated cost
- Sell value
- Notes

### Pricing Snapshot

An important architectural decision is to save a **snapshot of the rates used when an estimate is created**.

For example, if the cost of membrane changes next month, an estimate produced today should still show the original pricing assumptions.

This creates a reliable historical audit trail.

---

# 15. Quoted vs Actual — Future-Ready Design

The client specifically wants saved estimates so quoted-vs-actual performance can be compared later.

The POC will prepare the data model for this feature even if full project costing is not included in the first demonstration.

Future actual-cost inputs may include:

- actual material cost;
- actual labour days/hours;
- actual skip/waste cost;
- actual travel;
- additional site costs;
- variations;
- final invoice value.

This would allow reporting such as:

```text
Quoted Cost
vs
Actual Cost
```

and:

```text
Expected Margin
vs
Actual Margin
```

This can later identify:

- underpriced job types;
- inaccurate productivity assumptions;
- material-price changes;
- excessive waste;
- low-performing job categories;
- surveyor pricing differences.

---

# 16. Proposed Application Navigation

The POC can use a simple navigation structure:

```text
Dashboard
│
├── Estimates
│   ├── New Estimate
│   ├── Saved Estimates
│   └── Estimate Details
│
├── Rate Tables
│   ├── Materials
│   ├── Labour
│   ├── Waste & Skips
│   ├── Travel
│   └── Preliminaries
│
├── Pricing Rules
│   ├── Job Type Margins
│   └── Minimum Job Value
│
└── Company Settings
    └── Quotation Details / Branding
```

The objective is to keep the interface simple for users who are not software specialists.

---

# 17. Recommended Estimate Workflow

A typical surveyor workflow will be:

```text
1. Create Estimate
        ↓
2. Enter Customer & Site
        ↓
3. Select Work Type
        ↓
4. Enter Survey Measurements
        ↓
5. Choose Specification / Options
        ↓
6. Pricing Engine Calculates Cost
        ↓
7. Apply Target Margin
        ↓
8. Add Travel / Access / Preliminaries
        ↓
9. Review Internal Estimate
        ↓
10. Adjust Price if Authorised
        ↓
11. Check Final Margin
        ↓
12. Generate Customer Quotation
        ↓
13. Export PDF
        ↓
14. Save Estimate
```

---

# 18. POC Screens

The POC should demonstrate approximately the following screens.

## Screen 1 — Estimate Dashboard

Shows saved estimates and creates a new estimate.

## Screen 2 — Customer & Site Details

Captures the project and customer information.

## Screen 3 — Work Scope Builder

Allows users to add one or more work types.

Example:

```text
+ DPC & Replastering
+ Cavity Drain Membrane
+ Sump & Pump
+ Timber Treatment
+ Ventilation
```

## Screen 4 — Work Type Measurement Form

Dynamic fields change based on the selected work type.

## Screen 5 — Internal Pricing Summary

Displays costs, target margin, sell price, and override controls.

## Screen 6 — Rate Management

Allows safe editing of materials and other pricing inputs.

## Screen 7 — Quotation Preview

Displays the customer-facing quotation before export.

## Screen 8 — Saved Estimate Detail

Allows an existing estimate to be reviewed or duplicated.

---

# 19. POC Data Model

A modular relational model is recommended.

## Core Entities

```text
Customer
Site
Estimate
EstimateItem
WorkType
RateItem
MaterialRate
LabourRate
TravelBand
PreliminaryRate
PricingRule
Quotation
```

### Relationships

```text
Customer
   │
   └── Site
        │
        └── Estimate
             │
             ├── EstimateItem
             │     └── WorkType
             │
             ├── PricingSnapshot
             │
             └── Quotation
```

The design prevents business rules from being tightly coupled to the interface.

---

# 20. Architecture

The proposed POC architecture is:

```text
┌─────────────────────────────────────┐
│        React / TypeScript UI        │
│  Mobile + Tablet + Desktop          │
└─────────────────┬───────────────────┘
                  │
                  │ REST API
                  ▼
┌─────────────────────────────────────┐
│              FastAPI                │
│                                     │
│  Estimate Service                   │
│  Pricing Engine                     │
│  Rate Management                    │
│  Quotation Service                  │
│  Validation                         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│               SQLite                │
│                                     │
│ Customers                           │
│ Estimates                           │
│ Estimate Items                      │
│ Rate Tables                         │
│ Pricing Rules                       │
│ Quotations                          │
└─────────────────────────────────────┘
```

The frontend, business logic, and persistence layers will remain separated.

This is important because future production changes—such as replacing SQLite with PostgreSQL—will not require rewriting the estimating interface or business rules.

---

# 21. Extensibility Strategy

The POC should demonstrate future potential without over-engineering the first release.

## 21.1 Configurable Work Types

Pricing rules will not be embedded directly into individual UI pages wherever avoidable.

A work type can eventually define:

- measurement types;
- rate references;
- calculation rules;
- default margin;
- quotation descriptions;
- required options.

This enables future services to be added.

Examples:

- Basement waterproofing
- Structural repairs
- Dry rot treatment
- Wet rot treatment
- Mould remediation
- Drainage
- Plastering
- External waterproofing

---

## 21.2 Database Upgrade

POC:

```text
SQLite
```

Production:

```text
PostgreSQL
```

The domain and service layers should remain largely unchanged.

---

## 21.3 Authentication & Permissions

Future roles may include:

```text
Administrator
Estimator
Surveyor
Manager
Accounts
Read Only
```

Permissions could govern:

- rate editing;
- margin overrides;
- quotation approval;
- actual-cost entry;
- reporting.

---

## 21.4 Multi-User Operation

Future versions can allow multiple surveyors to work concurrently while maintaining individual estimate histories.

---

## 21.5 Cloud Deployment

The system could later be deployed securely as a cloud application accessible from any device.

---

## 21.6 CRM Integration

Possible future integrations include:

- HubSpot
- Salesforce
- Xero
- QuickBooks
- accounting systems;
- custom CRM;
- email services.

---

## 21.7 AI-Assisted Features

AI should **not** control final pricing.

Potential future AI functionality could include:

- converting survey notes into draft scopes;
- summarising uploaded reports;
- suggesting relevant work categories;
- generating customer-friendly scope wording;
- searching historical estimates;
- identifying unusual estimate values.

All prices, measurements, rate calculations, margins, permissions, and final approvals should remain deterministic and auditable.

---

# 22. POC Scope

## Included

The POC should demonstrate:

- Responsive web interface
- Estimate creation
- Customer/site information
- Multiple work types
- Measurement-driven calculations
- Fixed-price package calculations
- Material rates
- Labour rates
- Waste/skip costs
- Travel bands
- Access/preliminaries
- Job-specific target margin
- Margin override
- Immediate margin recalculation
- Minimum job value
- Estimate summary
- Customer quotation
- PDF export
- Saved estimates
- Central rate management
- Local SQLite database
- Architecture ready for expansion

---

# 23. Items Intentionally Deferred from the POC

The following should normally be treated as later phases unless required for demonstration:

- Full user authentication
- Advanced role permissions
- Cloud production hosting
- Full CRM
- Invoicing
- Online payment
- Scheduling
- Timesheets
- Purchase orders
- Supplier integrations
- Automated price-list imports
- Full actual-cost job tracking
- Advanced management dashboards
- Customer portal
- Electronic signatures
- Automated email delivery
- Offline-first synchronization
- Native mobile application

The architecture will allow these capabilities to be introduced progressively.

---

# 24. Example DPC Calculation

Assume:

```text
Wall Length:      10 lm
Replaster Height: 1.2 m
```

Calculated replastering area:

```text
10 × 1.2 = 12 m²
```

Example internal calculation:

```text
DPC Chemical             £XX
Plaster Materials        £XX
Labour                   £XX
Waste                    £XX
Travel                   £XX
Preliminaries            £XX
                        -----
Total Cost               £900
```

If target margin is 35%:

```text
Sell Price = £900 / (1 - 0.35)

Sell Price = £1,384.62
```

Margin:

```text
£1,384.62 - £900 = £484.62
```

If the user manually changes the quotation to £1,300:

```text
Margin Value = £400

Actual Margin % = £400 / £1,300
                = 30.77%
```

The interface immediately displays the reduced margin.

This live commercial feedback is one of the most valuable parts of the proposed tool.

---

# 25. Example Cavity Drain Calculation Structure

```text
Wall Membrane
    Wall Area × Material Rate

Floor Membrane
    Floor Area × Material Rate

Fixings
    Wall Area × Fixing Consumption × Fixing Rate

Battens
    Derived Quantity × Batten Rate

Boarding
    Board Area × Board Rate

Labour
    Total Area × Labour Output Rate

Waste
    Configured Percentage / Fixed Allowance

Travel
    Selected Distance Band

Preliminaries
    Selected Allowances
```

The individual rules can be refined during discovery using Advanced Damp's actual products, supplier prices, and productivity assumptions.

---

# 26. Validation Rules

The POC will include basic safeguards.

Examples:

- Measurements cannot be negative.
- Required fields cannot be omitted.
- Margin cannot silently become invalid.
- Inactive rate items cannot be selected.
- Missing rate values generate a clear warning.
- Sell price below the minimum job value is automatically corrected or flagged.
- Manual overrides are clearly identified.
- Customer quotation cannot expose internal margin information.

Future versions can add approval workflows and stronger commercial controls.

---

# 27. Discovery Inputs Required from Advanced Damp

To configure the POC accurately, the following information should be collected during discovery.

## Existing Commercial Information

- Sample quotations
- Current price lists
- Material supplier costs
- Labour day rates
- Labour productivity assumptions
- Waste allowances
- Skip costs
- Travel policy
- Access/preliminary allowances
- Target margins
- Minimum job value
- VAT requirements

## Work-Type Rules

For each treatment type:

- Measurement method
- Typical materials
- Material consumption
- Labour calculation
- Standard inclusions
- Optional extras
- Common exclusions
- Quotation wording

## Branding

- Company logo
- Company details
- Quote terms
- Terms and conditions
- Preferred quotation style

---

# 28. POC Success Criteria

The POC will be considered successful if a user can:

1. Open the application.
2. Create a customer estimate.
3. Enter survey measurements.
4. Select damp-proofing/work options.
5. Receive an automatic cost calculation.
6. See the target selling price.
7. See margin percentage and value.
8. Adjust price and immediately see the new margin.
9. Have the minimum job value enforced.
10. Generate a professional customer quotation.
11. Export it to PDF.
12. Save the estimate.
13. Reopen it later.
14. Change a central rate without modifying source code.
15. Produce a new estimate using the updated rate while retaining the historical rate snapshot on previous estimates.

---

# 29. Suggested POC Demonstration Scenario

A strong client demonstration should follow a realistic site-survey journey.

### Example

A surveyor visits a London property and identifies:

- 12 linear metres of rising damp;
- replastering to 1.2 m;
- one ventilation unit;
- local travel band;
- standard waste allowance.

The surveyor:

1. Creates the customer.
2. Enters the site.
3. Adds DPC & Replastering.
4. Enters 12 lm and 1.2 m height.
5. Adds one extractor/PIV option.
6. Selects the travel band.
7. Reviews material and labour calculation.
8. Sees total internal cost.
9. Reviews the recommended sell price.
10. Tests a lower price.
11. Immediately sees the margin reduction.
12. Restores/approves the final selling price.
13. Generates the Advanced Damp branded quotation.
14. Saves the estimate.

This scenario demonstrates the client's most important business requirement: **turning site measurements into a consistent, commercially controlled quotation quickly.**

---

# 30. Future Product Roadmap

## Phase 1 — POC

Validate:

- estimating workflow;
- pricing model;
- rate management;
- margin control;
- quotation generation.

## Phase 2 — Production Estimating Platform

Add:

- authentication;
- cloud database;
- permissions;
- audit trail;
- improved mobile UX;
- production backups;
- company configuration;
- richer quotation templates.

## Phase 3 — Job Costing

Add:

- accepted jobs;
- actual materials;
- actual labour;
- variations;
- actual cost;
- estimated-vs-actual margin reporting.

## Phase 4 — Operational Platform

Potential modules:

- survey scheduling;
- project/job management;
- field updates;
- photos;
- documents;
- customer communication;
- invoicing;
- CRM/accounting integrations.

## Phase 5 — Business Intelligence

Potential reporting:

- margin by job type;
- margin by surveyor;
- estimate win rate;
- average quotation;
- labour productivity;
- material variance;
- profitability by service;
- quoted-vs-actual trends.

---

# 31. Design Principles

The POC should follow six principles.

### 1. Simple for Surveyors

Site users should not need technical knowledge.

### 2. Safe for the Business Owner

Rates should be editable without exposing formulas or application code.

### 3. Deterministic Pricing

Core estimates should be based on transparent calculation rules.

### 4. Commercial Visibility

Users should immediately understand the margin consequence of pricing decisions.

### 5. Historical Accuracy

Existing quotations should not change when future rates are updated.

### 6. Extensible Architecture

The POC should be capable of becoming a production estimating and operational platform without requiring a complete rewrite.

---

# 32. Key Value Proposition

This project is not simply a digital calculator.

It creates a structured commercial estimating system that connects:

```text
Survey Measurements
        +
Standardised Rates
        +
Labour Productivity
        +
Job-Specific Rules
        +
Commercial Margin Controls
        ↓
Consistent Estimate
        ↓
Professional Quotation
        ↓
Historical Cost Data
        ↓
Future Profitability Analysis
```

For Advanced Damp Ltd, the immediate value is faster and more consistent estimating.

The longer-term value is the creation of reliable estimating data that can be used to understand true job profitability and continuously improve pricing decisions.

---

# 33. POC Deliverables

The proposed POC deliverables are:

1. Responsive estimating web application.
2. Customer/site entry workflow.
3. Five primary work-type estimating modules:
   - DPC injection & replastering
   - Cavity drain membrane
   - Sump & pump
   - Timber treatment
   - Condensation/ventilation
4. Central materials rate table.
5. Labour-rate configuration.
6. Waste/skip pricing.
7. Travel-band pricing.
8. Access/preliminaries.
9. Target-margin configuration.
10. Margin override and live recalculation.
11. Minimum-job-value logic.
12. Internal estimate summary.
13. Customer quotation preview.
14. Branded PDF quotation generation.
15. Saved estimate history.
16. Historical pricing snapshot.
17. SQLite database.
18. Extensible API/service architecture.
19. Local run instructions.
20. Technical documentation describing future production expansion.

---

# 34. Final POC Goal

The final POC should allow Advanced Damp Ltd to see a realistic version of its future estimating workflow—not a generic calculator.

It should demonstrate that a surveyor can move from:

**site measurements → structured costing → controlled margin → customer quotation**

within one simple application.

At the same time, the underlying architecture should provide a practical foundation for a future production platform supporting multi-user estimating, job costing, quoted-vs-actual analysis, reporting, CRM integration, and broader business operations.

The POC therefore serves two purposes:

1. **Solve and validate the client's immediate estimating problem.**
2. **Establish a clean technical foundation for a scalable commercial system.**
