# Advanced Damp Job Estimating & Quoting Platform
## Production-Level Local Deployment — Project Definition & Implementation Blueprint

**Client:** Advanced Damp Ltd  
**Document type:** Production upgrade project definition  
**Version:** 3.0  
**Target environment:** Local / company-controlled deployment only  
**Primary users:** Surveyors, estimators, business owner/manager, office/admin staff  
**Market:** United Kingdom  
**Currency:** GBP  
**Status:** Proposed production scope based on the implemented POC, client job brief, supplied project materials, and Advanced Damp's public business workflow

---

# 1. Executive Summary

The existing Proof of Concept has successfully demonstrated the core estimating journey:

```text
Customer & Site
    ↓
Work Scope
    ↓
Measurements
    ↓
Price Review
    ↓
Customer Quotation
    ↓
PDF
```

The next objective is to convert that POC into a **production-level estimating and quoting system that Advanced Damp Ltd can use in day-to-day business operations**, while continuing to run locally rather than being deployed as a public cloud SaaS application.

The production system should not simply be a more polished version of the POC. It must model the real commercial workflow surrounding an Advanced Damp survey:

```text
Enquiry / Customer
        ↓
Property / Site
        ↓
Survey
        ↓
Diagnosis & Recommended Works
        ↓
Structured Estimate
        ↓
Commercial Review
        ↓
Fixed-Price Quotation
        ↓
Quotation Revision / Acceptance
        ↓
Works Handover
        ↓
Actual Cost Capture
        ↓
Quoted-vs-Actual Review
```

Advanced Damp's public service workflow emphasizes **diagnosis first**, followed by a written report and fixed-price quotation. The company works across residential and commercial damp, timber and waterproofing work, and the production tool therefore needs to preserve the relationship between the **survey findings**, the **recommended treatment**, the **internal estimate**, and the **customer quotation**.

The system will continue to use deterministic pricing. AI is not required for the production estimating core. Measurements, material rates, labour productivity, travel, waste, preliminaries, margin, VAT, minimum job values and approvals must remain transparent, reviewable and auditable.

The recommended production upgrade therefore focuses on:

- converting sample commercial data into business-managed production data;
- introducing safe rate and pricing-rule administration;
- strengthening survey-to-estimate workflow;
- supporting quotation revisions and immutable commercial history;
- implementing production user roles and permissions;
- adding audit history;
- making local data backup and recovery reliable;
- supporting actual-cost entry and quoted-vs-actual analysis;
- improving quotation document quality;
- completing the work-type input models;
- hardening validation and pricing rules;
- improving tablet/laptop usability;
- retaining an architecture that can move to cloud deployment later without rewriting the pricing engine.

---

# 2. Basis of This Production Definition

This document is based on four information sources.

## 2.1 Client Job Brief

The client requires a system that:

- accepts site survey measurements;
- prices damp-proofing and waterproofing work;
- centralises rates;
- calculates materials, labour, waste, travel and preliminaries;
- applies target margin by job type;
- allows controlled overrides;
- enforces a minimum job value;
- creates a customer quotation;
- exports PDF;
- saves estimates;
- creates a foundation for quoted-versus-actual analysis;
- can be maintained by a non-technical business owner.

## 2.2 Existing Implemented POC

The current POC already provides:

- React / TypeScript frontend;
- FastAPI backend;
- SQLite persistence;
- estimate dashboard;
- five-step estimating workflow;
- five work-type modules;
- deterministic pricing;
- job-type margins;
- minimum job value;
- sell-price override;
- quotation preview;
- PDF generation;
- saved estimates;
- central seeded rates.

The production plan retains this foundation where it is sound and replaces POC-only shortcuts where necessary.

## 2.3 Supplied Demonstration Materials

The supplied screenshots and quotation demonstrate the current user flow and commercial calculations for estimate `AD-00001`.

Important POC observations that must be addressed before production include:

- rate administration is not yet available as a safe owner-facing UI;
- a minimum-job-value example is not visibly demonstrated;
- the quotation should include an issue date;
- quotation preview and exported PDF should use the same commercial presentation;
- the sample PDF displays work-type amounts that do not reconcile to the displayed subtotal because job-level allowances are not represented as customer line items;
- cavity-drain specification choices need stronger production inputs;
- timber treatment needs both area and linear-measure options where required;
- ventilation should support multiple equipment rows on one estimate;
- customer/site evidence should be fully included in the production UX;
- mobile/tablet behaviour needs explicit production testing.

## 2.4 Advanced Damp Public Business Workflow

Advanced Damp publicly describes a diagnosis-led process in which the property is surveyed first, the cause is identified, and the customer receives a written report and a fixed-price quotation.

The company serves multiple customer types, including:

- homeowners;
- property managers;
- commercial clients;
- architects and developers;
- solicitors and surveyors.

The public service offering is broader than the five work types in the original estimating brief. It includes damp proofing, basement/structural waterproofing, timber decay treatment, ventilation/condensation work, mould-related services and survey/diagnostic work.

This means the production architecture should support configurable work-type expansion without forcing a rewrite of the pricing engine.

---

# 3. Production Product Goal

The production product should become Advanced Damp's **single controlled estimating system**.

Its purpose is to ensure that two surveyors pricing the same surveyed condition using the same approved inputs produce the same base commercial result unless an authorised user deliberately overrides it.

The system should make it possible to answer:

- What was surveyed?
- What treatment was recommended?
- Which measurements were used?
- Which material and labour rates were applied?
- Which travel, waste and preliminaries were included?
- What margin was targeted?
- Who changed the sell price?
- What quotation version was sent?
- Was the quotation accepted?
- What did the job actually cost?
- How did actual margin compare with estimated margin?

This is the difference between a calculator and a production estimating system.

---

# 4. Scope Boundary

## 4.1 Included in Production Local v1

The production local version should include:

1. Local authentication
2. User roles and permissions
3. Customer records
4. Site/property records
5. Survey records
6. Estimate creation and revision
7. Five current estimating work types
8. Configurable rate administration
9. Configurable pricing rules
10. Materials and labour calculations
11. Waste and skip allowances
12. Travel rules
13. Access and preliminary allowances
14. Minimum job value
15. Target margin by work type
16. Controlled price overrides
17. Internal commercial review
18. Quotation versioning
19. Branded quotation preview
20. Correct PDF export
21. Estimate and quotation status tracking
22. Rate snapshots
23. Audit log
24. Actual-cost entry
25. Quoted-versus-actual comparison
26. Local backup and restore
27. Data export
28. Production validation and error handling
29. Local deployment documentation
30. User/admin operating documentation

## 4.2 Not Required in This Local Production Version

Unless Advanced Damp explicitly adds them to scope, the following should remain deferred:

- public cloud hosting;
- customer portal;
- online payments;
- full accounting;
- Xero / QuickBooks integration;
- CRM replacement;
- automated email sending;
- e-signature;
- live supplier API integrations;
- native iOS/Android applications;
- full workforce scheduling;
- timesheets;
- purchase-order management;
- inventory;
- AI-generated pricing;
- AI approval of quotations.

The data model should avoid blocking these capabilities later.

---

# 5. Real Business Workflow to Model

## 5.1 Workflow Overview

The recommended production workflow is:

```text
1. Customer enquiry / existing customer selected
              ↓
2. Property / site created or selected
              ↓
3. Survey appointment / survey record
              ↓
4. Surveyor records diagnosis and relevant measurements
              ↓
5. Recommended work scope selected
              ↓
6. Estimate generated from controlled rates
              ↓
7. Surveyor reviews commercial result
              ↓
8. Manager approval where required
              ↓
9. Fixed-price quotation version generated
              ↓
10. Quotation sent / status recorded
              ↓
11. Revision if scope or price changes
              ↓
12. Accepted / declined / expired
              ↓
13. Accepted estimate becomes job-cost baseline
              ↓
14. Actual costs entered after/during works
              ↓
15. Quoted-vs-actual margin reviewed
```

This workflow mirrors the company's survey-led approach without attempting to turn the estimating application into a complete CRM or project-management system.

---

# 6. User Roles

The POC has no formal permissions. Production use requires explicit roles.

## 6.1 Administrator

Can:

- create and disable users;
- maintain company settings;
- maintain rate tables;
- maintain work types and pricing rules;
- maintain quotation templates;
- configure VAT and minimum job rules;
- manage backups;
- view audit history;
- perform all manager functions.

## 6.2 Business Owner / Commercial Manager

Can:

- review all estimates;
- edit approved commercial rates where permitted;
- approve low-margin or overridden quotations;
- change final sell price;
- view cost and margin data;
- review quoted-vs-actual performance;
- reopen or supersede estimates;
- manage commercial settings if authorised.

## 6.3 Surveyor / Estimator

Can:

- create customers/sites where allowed;
- create survey records;
- create estimates;
- select work types;
- enter measurements;
- select allowances;
- calculate estimates;
- see internal cost and target price where policy allows;
- generate quotations that do not require manager approval;
- create revisions.

Cannot:

- silently modify central rates;
- delete historical commercial records;
- bypass minimum/approval rules;
- alter issued quotation history.

## 6.4 Office / Administration

Can:

- create customer/site records;
- update contact details;
- view quotation status;
- mark quotation as sent;
- record acceptance/decline;
- download quotations;
- enter administrative notes.

Cost/margin access should be configurable.

## 6.5 Accounts / Job Cost User

Can:

- view accepted quotation baseline;
- enter actual material/labour/waste/travel costs;
- record final invoice value if required;
- review estimated vs actual performance.

---

# 7. Customer and Site Model

A production system should separate **Customer** from **Site**.

One customer may have multiple properties. A property manager or commercial client may instruct work at many sites.

## 7.1 Customer Fields

Recommended fields:

- Customer ID
- Customer type
- Individual / company
- Title
- First name
- Last name
- Company name
- Contact email
- Telephone
- Alternative telephone
- Billing address
- Billing postcode
- Notes
- Active/inactive
- Created date
- Created by
- Updated date

## 7.2 Customer Types

Initial configurable values:

- Homeowner
- Landlord
- Property Manager
- Commercial Client
- Architect / Developer
- Solicitor / Surveyor
- Other

## 7.3 Site Fields

- Site ID
- Customer ID
- Property name/number
- Address lines
- Town/city
- County
- Postcode
- Site contact
- Site telephone
- Access notes
- Occupancy type
- Parking/access notes
- ULEZ/congestion relevance
- General notes

## 7.4 Why Customer and Site Must Be Separate

This supports:

```text
Customer
  ├── Site A
  │     ├── Survey 1
  │     └── Estimate 1
  └── Site B
        ├── Survey 2
        └── Estimate 2
```

It prevents duplicated customer information and supports commercial/property-management work naturally.

---

# 8. Survey Record

The estimate should originate from a survey record rather than starting as an isolated price calculation.

## 8.1 Survey Header

Recommended fields:

- Survey reference
- Customer
- Site
- Survey date
- Surveyor
- Survey type
- Survey fee
- Survey fee creditable against works? yes/no
- Existing report reference
- General diagnosis
- Survey notes
- Photos/documents attachment references
- Status

## 8.2 Survey Types

Configurable values may include:

- Damp survey
- Damp & timber survey
- Waterproofing survey
- Condensation / ventilation assessment
- Commercial damp survey
- Other diagnostic survey

The exact production list should be confirmed with Advanced Damp.

## 8.3 Diagnosis and Recommendations

The estimating system does not need to become a full diagnostic expert system.

It should allow the surveyor to record:

- identified issue(s);
- affected area(s);
- recommended treatment(s);
- relevant measurements;
- constraints;
- assumptions;
- access issues;
- exclusions;
- report reference.

The surveyor remains responsible for the professional diagnosis.

---

# 9. Estimate Lifecycle

Production records must have explicit lifecycle states.

Recommended states:

```text
DRAFT
    ↓
PRICED
    ↓
REVIEW_REQUIRED (conditional)
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

## 9.1 Draft

Measurements and scope are incomplete.

## 9.2 Priced

All required rates are available and deterministic pricing has run successfully.

## 9.3 Review Required

Triggered by rules such as:

- sell-price override;
- margin below target;
- margin below minimum permitted threshold;
- unusual discount;
- missing standard allowance;
- manual custom item;
- commercial value above configurable approval threshold.

## 9.4 Approved

Commercial review is complete.

## 9.5 Ready to Quote

Customer document may be generated.

## 9.6 Quoted

At least one immutable quotation version has been issued.

## 9.7 Accepted

Customer has accepted a specific quotation version.

## 9.8 Declined

Customer declined.

## 9.9 Expired

Quotation validity elapsed.

## 9.10 Job Costing / Closed

Actual costs are being captured or the commercial comparison is complete.

---

# 10. Estimate Revision Model

A production system must never silently overwrite a previously issued quotation.

Example:

```text
Estimate AD-00125
    ├── Revision 1
    │     └── Quote Q-AD-00125-R1
    ├── Revision 2
    │     └── Quote Q-AD-00125-R2
    └── Revision 3
          └── Quote Q-AD-00125-R3  ← accepted
```

Each issued quotation version should preserve:

- customer/site snapshot;
- scope wording;
- quantities;
- rates snapshot;
- cost build-up;
- sell price;
- VAT;
- terms;
- assumptions;
- exclusions;
- issue date;
- validity date;
- creator;
- approver;
- override reason.

Historical issued versions must be read-only.

---

# 11. Work Type Architecture

The initial production system will fully support the five work types from the client brief.

The architecture should allow future work types to be added without restructuring the estimate database.

Each work type should define:

- code;
- name;
- active/inactive;
- measurement schema;
- available specification options;
- required materials;
- labour rules;
- optional additions;
- default quote wording;
- target margin;
- minimum charge if applicable;
- validation rules.

---

# 12. Chemical DPC Injection & Replastering

## 12.1 Production Inputs

At minimum:

- number of walls;
- individual wall measurements where required;
- total wall length (lm);
- DPC treatment length;
- replaster height;
- derived replaster area;
- plaster/render specification;
- substrate/preparation option where commercially relevant;
- disposal/skip option;
- access allowance;
- notes.

## 12.2 Calculation Structure

```text
DPC length = sum(wall lengths requiring DPC)

Replaster area =
    sum(wall length × replaster height)

Material quantities =
    measurement × configured consumption factor

Labour =
    output-rate method
    OR
    day-rate method
    according to configured rule
```

## 12.3 Example Cost Components

- DPC chemical;
- injection plugs/consumables;
- render/plaster;
- primers/additives;
- labour for injection;
- labour for hacking-off/preparation;
- labour for replastering;
- waste;
- protection/preliminaries.

All production rate names and consumption values must be confirmed using Advanced Damp's real supplier and labour data.

---

# 13. Cavity Drain Membrane Systems

The POC needs to be expanded from generic area inputs into production specification-aware pricing.

## 13.1 Production Inputs

- wall area (m²);
- floor area (m²);
- membrane system/specification;
- wall membrane type;
- floor membrane type;
- fixing specification;
- fixing consumption;
- drainage channel length;
- inspection/maintenance access components;
- battens yes/no and specification;
- boarding yes/no and specification;
- sump connection required;
- sealing/tape accessories;
- access constraints;
- notes.

## 13.2 Production Pricing Components

- wall membrane;
- floor membrane;
- plugs/fixings;
- sealing tape;
- corner/detail components;
- perimeter drainage channel;
- access/inspection components;
- battens;
- board;
- labour;
- waste;
- preliminaries.

## 13.3 Waterproofing Design Context

Advanced Damp's public workflow includes structural waterproofing and Type C cavity-drain systems.

The software should therefore store system/specification information explicitly rather than treating every square metre of membrane work as commercially identical.

The estimating system is not responsible for deciding technical compliance. The qualified surveyor/designer selects the appropriate specification; the application prices that approved specification.

---

# 14. Sump & Pump Installations

## 14.1 Package-Based Model

Sump/pump pricing should be driven by configurable packages.

Example structure:

```text
Package
├── equipment/material bundle
├── installation labour allowance
├── standard consumables
├── default margin
└── standard quote description
```

## 14.2 Production Inputs

- package;
- single/twin pump configuration;
- battery backup;
- alarm/telemetry;
- extra discharge requirements if applicable;
- additional drainage connection;
- excavation/installation complexity allowance;
- electrical assumptions;
- access;
- notes.

## 14.3 Package Administration

An administrator should be able to:

- create package;
- change package material cost;
- change labour allowance;
- enable/disable add-ons;
- set effective date;
- set target margin;
- change customer description.

---

# 15. Timber Treatment

The production version should support both area and linear measurement where relevant.

## 15.1 Inputs

- treatment basis: m² / linear metre / item;
- affected area;
- affected length;
- treatment type;
- joist repairs count/length;
- replacement timber dimensions where used;
- floorboard/floor renewal area;
- access difficulty;
- disposal;
- notes.

## 15.2 Production Components

- timber treatment chemical;
- replacement timber;
- floorboarding;
- fixings/consumables;
- treatment labour;
- joist repair labour;
- flooring labour;
- waste/disposal;
- preliminaries.

---

# 16. Condensation & Ventilation

The production form should support multiple ventilation items rather than a single equipment selector.

Example:

| Equipment | Qty | Installation | Notes |
|---|---:|---|---|
| Extractor fan 100 mm | 2 | Standard | Bathrooms |
| PIV unit | 1 | Loft | Hall/landing |

## 16.1 Inputs

- equipment type;
- quantity;
- install type;
- duct/grille requirements;
- electrical assumption;
- additional core drilling/access;
- notes.

## 16.2 Pricing

```text
Equipment supply
+ associated materials
+ install labour
+ selected extras
= line cost
```

Then apply the work-type target margin.

---

# 17. Future Work Types

Advanced Damp's public service range is broader than the five initial work types.

The production architecture should be able to add future modules such as:

- penetrating damp remedial work;
- mould remediation;
- dry rot;
- wet rot;
- woodworm;
- external damp/waterproofing work;
- structural waterproofing variants;
- drainage work;
- specialist survey-only services.

These should not be hard-coded into production v1 until Advanced Damp supplies the associated estimating rules and rates.

---

# 18. Central Rate Administration

This is a mandatory production feature.

The business owner must be able to maintain commercial data without editing source code, JSON or database tables.

## 18.1 Rate Categories

### Materials

Fields:

- code;
- item;
- supplier/reference;
- category;
- unit;
- cost per unit;
- default waste percentage;
- VAT treatment where needed;
- effective from;
- active/inactive;
- notes.

### Labour

Support:

- day rate;
- hourly rate if required;
- per m²;
- per lm;
- per item;
- package labour;
- minimum labour allowance.

### Waste / Skip

- allowance code;
- description;
- fixed cost;
- optional location adjustment;
- active/inactive.

### Travel

Travel must be **office-aware** because Advanced Damp operates across more than one geographic base/coverage region.

Production structure:

```text
Office / Origin
    ↓
Travel Band
    ↓
Distance Range
    ↓
Charge
```

The exact travel origins, bands and charges must be confirmed by the business.

### Preliminaries

Examples:

- standard setup;
- parking;
- congestion/ULEZ;
- floor/fixture protection;
- restricted access/carrying;
- access tower;
- specialist access;
- occupied-premises allowance;
- other.

### Packages

For sump/pump and other bundled items.

---

# 19. Rate Change Control

Simply allowing a user to overwrite a rate is not sufficient.

Production rate changes should record:

- old value;
- new value;
- effective date;
- changed by;
- changed date;
- reason/note.

Existing estimates must never recalculate automatically because a central rate changed.

New rate behaviour:

```text
Central rate changed today
        ↓
New estimate uses new rate
        ↓
Previously priced estimate retains its rate snapshot
```

If an old draft is deliberately repriced, the system should explicitly tell the user that newer rates are available and require confirmation.

---

# 20. Pricing Engine

The production pricing engine remains deterministic.

## 20.1 Cost Structure

```text
Direct Materials
+ Direct Labour
+ Waste / Skip
+ Travel
+ Access / Preliminaries
+ Other approved direct allowances
= Total Estimated Cost
```

## 20.2 Margin Formula

Margin is calculated as margin on selling price:

```text
Target Sell =
    Cost / (1 - Target Margin)
```

Example:

```text
Cost = £1,000
Target margin = 30%

Sell = £1,000 / 0.70
     = £1,428.57
```

## 20.3 Job-Type Margin

Each work type may have a different margin.

For a multi-work-type estimate, each line should first receive its own target sell value.

Job-level costs that are not naturally attributable to a work type require an explicit production policy.

Recommended choices:

### Option A — Distribute Job-Level Cost

Allocate waste/travel/preliminaries across work types according to their base cost, then apply the relevant line margin.

### Option B — Separate Commercial Allowance Line

Treat job-level cost as its own internal pricing component with a configured margin.

The final production rule must be agreed with Advanced Damp.

The important requirement is that the internal calculation and customer total always reconcile exactly.

---

# 21. Minimum Job Value

The minimum job floor should be configurable.

The engine should display:

- calculated sell;
- minimum job value;
- whether minimum value applied;
- final sell;
- resulting actual margin.

Example:

```text
Calculated sell:    £485
Minimum job value:  £750
Final sell:         £750
Minimum applied:    Yes
```

The system should never hide this adjustment from internal users.

---

# 22. Price Override and Approval

A sell-price override is a commercial decision and must be auditable.

Required fields:

- calculated sell;
- override sell;
- actual margin £;
- actual margin %;
- target margin;
- variance from target;
- override reason;
- user;
- timestamp.

## 22.1 Approval Rules

Configurable examples:

- no approval if actual margin >= target;
- manager approval if below target;
- block quotation if below minimum permitted margin;
- manager approval for discounts greater than X%;
- manager approval for custom/manual pricing lines.

The exact thresholds must be confirmed by the company.

---

# 23. Survey Fee / Credit Rule

Advanced Damp's public workflow states that survey fees may be deducted from works if the customer proceeds.

The production system should support this as a configurable commercial rule rather than hard-coding it.

Fields:

- survey fee;
- credit against works: yes/no;
- amount creditable;
- credit applied to quotation: yes/no;
- VAT treatment;
- customer wording.

This feature should be enabled only according to Advanced Damp's confirmed current policy.

---

# 24. VAT

VAT must be configuration-driven.

Initial expected default:

```text
VAT rate: 20%
```

Production requirements:

- system setting for default VAT rate;
- quotation-level VAT applicability;
- VAT shown separately;
- VAT calculations performed with consistent currency rounding;
- historical quotation stores VAT rate snapshot.

Do not assume every future commercial scenario follows the same VAT treatment without business confirmation.

---

# 25. Internal Price Review

The production internal review should show:

## 25.1 Summary

- materials;
- labour;
- waste/skip;
- travel;
- preliminaries;
- other;
- total cost;
- target sell;
- override;
- final sell;
- target margin;
- actual margin;
- margin value;
- minimum-job adjustment;
- approval status.

## 25.2 Work-Type Detail

For each work type:

- calculated quantities;
- material breakdown;
- labour basis;
- internal cost;
- target margin;
- target sell;
- warnings.

## 25.3 Commercial Warnings

Examples:

- rate missing;
- inactive rate referenced;
- measurement incomplete;
- override below target;
- minimum job value applied;
- custom line present;
- outdated rate snapshot;
- approval required.

---

# 26. Customer Quotation

The customer quotation must be generated from an immutable approved estimate version.

## 26.1 Quotation Header

- logo;
- company legal/trading details;
- quote number;
- quote version/revision;
- issue date;
- validity date;
- customer;
- site;
- surveyor/reference where appropriate.

## 26.2 Scope

For each work type:

- customer-facing title;
- clear scope wording;
- relevant quantities where useful;
- relevant specification where approved;
- inclusions.

## 26.3 Commercial Presentation

Recommended default:

- scope descriptions;
- one agreed subtotal ex VAT;
- VAT;
- total inc VAT.

Avoid exposing internal material/labour/margin data.

If Advanced Damp wants work-type prices shown, the calculation engine must allocate every job-level cost so all displayed line prices exactly reconcile to the subtotal.

## 26.4 Terms

Configurable:

- payment terms;
- validity;
- assumptions;
- exclusions;
- guarantee wording;
- survey-fee credit wording;
- acceptance instructions.

## 26.5 POC Correction

The current POC PDF should not be carried into production unchanged because the visible work-type amounts do not add up to the displayed subtotal.

The production quotation must enforce:

```text
Sum(displayed customer line amounts)
    =
Displayed subtotal
```

or display only the overall subtotal.

---

# 27. Quotation PDF

Production PDF requirements:

- true A4 layout;
- logo at print quality;
- consistent company typography/branding;
- issue date;
- unique quotation/reference;
- page numbering for multi-page quotations;
- repeating header/footer where appropriate;
- no clipping;
- no internal pricing leakage;
- correct VAT;
- accurate subtotal;
- clear assumptions/exclusions;
- stable rendering across machines;
- generated filename convention.

Example:

```text
AD-00125-R2-Mrs-Smith-Quotation.pdf
```

---

# 28. Quotation Status

Recommended states:

- Draft
- Approved
- Ready to Send
- Sent
- Viewed/unknown (manual unless integrated)
- Accepted
- Declined
- Expired
- Superseded

Since local production v1 does not include automated email, "Sent" can be recorded manually with:

- sent date;
- sent by;
- method (email / printed / other);
- note.

---

# 29. Acceptance

Acceptance may initially be entered manually.

Record:

- accepted quotation version;
- acceptance date;
- accepted by;
- acceptance method;
- purchase order/reference if applicable;
- deposit/payment note;
- acceptance evidence attachment if available.

Only one quotation version should be designated as the accepted commercial baseline.

---

# 30. Quoted-versus-Actual Job Costing

Because the original business requirement explicitly anticipates comparing quoted and actual performance, the production system should implement at least a practical actual-cost module.

## 30.1 Actual Material Cost

Record:

- category/work type;
- item;
- quantity;
- actual unit cost;
- actual total;
- note.

## 30.2 Actual Labour

Record:

- work type;
- crew/user description;
- days/hours;
- actual cost;
- note.

## 30.3 Actual Other Costs

- waste/skip;
- travel;
- parking;
- ULEZ/congestion;
- access equipment;
- variations;
- other.

## 30.4 Comparison

Display:

| Metric | Estimated | Actual | Variance |
|---|---:|---:|---:|
| Materials | £x | £x | £x |
| Labour | £x | £x | £x |
| Waste | £x | £x | £x |
| Travel | £x | £x | £x |
| Prelims | £x | £x | £x |
| Total cost | £x | £x | £x |
| Sell / revenue | £x | £x | £x |
| Margin £ | £x | £x | £x |
| Margin % | x% | x% | x% |

This creates the data required to improve future productivity rates and margins.

---

# 31. Reporting

Production-local reporting should remain practical.

Recommended initial reports:

- estimates by date;
- estimates by surveyor;
- quotes by status;
- average quote value;
- accepted/declined value;
- estimated margin by work type;
- actual margin by work type;
- estimated vs actual variance;
- override report;
- below-target-margin report;
- rate-change report.

Advanced business intelligence can remain a later phase.

---

# 32. Search and Dashboard

The production dashboard should support:

- reference search;
- customer search;
- postcode/site search;
- surveyor filter;
- status filter;
- date range;
- quote value range if useful;
- open estimate;
- create revision;
- download latest quotation;
- view accepted version.

Dashboard summary widgets can include:

- Draft
- Review Required
- Ready to Quote
- Quoted
- Accepted
- Expired

Avoid excessive KPI dashboards that do not improve the daily workflow.

---

# 33. Notes and Attachments

Production records should support attachments/references for:

- survey report;
- photos;
- sketches;
- specification sheets;
- customer correspondence;
- acceptance evidence.

For a local deployment, files can be stored in a controlled local document directory with database metadata.

Recommended structure:

```text
data/
  documents/
    customers/
    surveys/
    estimates/
    quotations/
    acceptance/
```

Do not store large binary files directly inside PostgreSQL unless there is a specific reason.

---

# 34. Audit Trail

The audit log is mandatory for production commercial data.

Track:

- login;
- customer changes;
- site changes;
- survey updates;
- estimate creation;
- measurement changes;
- recalculation;
- rate changes;
- pricing-setting changes;
- override;
- approval;
- quotation generation;
- quotation status;
- acceptance;
- actual-cost changes.

Audit records should include:

- timestamp;
- user;
- entity type;
- entity ID;
- action;
- previous value where appropriate;
- new value where appropriate.

Normal users should not be able to delete audit history.

---

# 35. Data Deletion Policy

Production commercial records should generally be archived rather than physically deleted.

Use:

- active/inactive;
- cancelled;
- archived.

Issued quotations, accepted quotations and audit history should not be hard-deleted through the normal UI.

The company should confirm its final retention policy.

---

# 36. Production Database

## 36.1 Upgrade from SQLite

SQLite is suitable for the POC but PostgreSQL is recommended for production use even when everything remains local.

Reasons:

- stronger concurrent access;
- transactional reliability;
- safer multi-user operation;
- better backup/restore tooling;
- migration support;
- future production/cloud portability.

Recommended:

```text
PostgreSQL 16+
SQLAlchemy
Alembic migrations
```

SQLite may remain available for development/testing.

---

# 37. Proposed Core Data Model

```text
User
Role
Permission

Customer
Site

Survey
SurveyAttachment

Estimate
EstimateRevision
EstimateWorkItem
EstimateMeasurement
EstimateAllowance

RateItem
RateVersion
LabourRate
TravelRule
PreliminaryRate
PackageDefinition
PricingRule
WorkTypeDefinition

PricingSnapshot
PricingSnapshotItem

Approval
AuditEvent

Quotation
QuotationVersion

Acceptance

ActualCostEntry
ActualLabourEntry
ActualMaterialEntry

CompanySetting
QuotationTemplate
```

---

# 38. Key Relationships

```text
Customer
   │
   └── Site
        │
        └── Survey
             │
             └── Estimate
                  │
                  ├── Estimate Revision
                  │     ├── Work Items
                  │     ├── Measurements
                  │     ├── Allowances
                  │     ├── Pricing Snapshot
                  │     └── Approval
                  │
                  ├── Quotation Versions
                  │
                  └── Accepted Version
                         │
                         └── Actual Costs
```

---

# 39. Local Production Architecture

Recommended architecture:

```text
┌──────────────────────────────────────────┐
│             Browser UI                   │
│ React + TypeScript                       │
│ Desktop / Laptop / Tablet                │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│ Local Application Service                │
│ FastAPI                                  │
│ Authentication                           │
│ Estimate Service                         │
│ Pricing Engine                           │
│ Rate Administration                     │
│ Quotation Service                        │
│ Job Cost Service                         │
│ Audit Service                            │
└───────────────────┬──────────────────────┘
                    │
             ┌──────┴──────┐
             ▼             ▼
┌───────────────────┐  ┌───────────────────┐
│ PostgreSQL        │  │ Local File Store  │
│ production data   │  │ PDFs/attachments  │
└───────────────────┘  └───────────────────┘
```

---

# 40. Local Deployment Modes

"Production" and "local only" create an important operational choice.

## 40.1 Mode A — Single Workstation

Everything runs on one company laptop/desktop.

Suitable when:

- one user at a time;
- surveyor can carry the same machine on site;
- simplest production setup required.

Advantages:

- no external network;
- easy to install;
- simple backup.

Limitation:

- not suitable for multiple simultaneous users.

## 40.2 Mode B — Company Local Server / LAN

Application runs on one local company computer/server and users access it in their browsers over the company network.

Suitable when:

- several office users/surveyors;
- central database required;
- concurrent access required.

Advantages:

- one controlled data source;
- central rates;
- centralized backup;
- no public cloud hosting.

Limitation:

- a surveyor away from the office cannot access it unless a secure company-managed remote-access/VPN solution is provided.

## 40.3 Recommended Initial Production Mode

For real company use with multiple staff, **Mode B** is recommended.

If strict offline use at customer properties is required, that should be treated as a separate offline-sync design problem rather than allowing multiple disconnected database copies to become the commercial source of truth.

---

# 41. Local Docker Deployment

A practical production-local deployment can use Docker Compose:

```text
docker-compose.yml
    ├── frontend
    ├── api
    └── postgres
```

Benefits:

- reproducible installation;
- isolated dependencies;
- easier upgrades;
- easier backup procedure;
- consistent environment.

The file/document folder should be mounted to a persistent local directory.

---

# 42. Authentication

Production data includes commercially sensitive pricing.

Minimum requirements:

- local username/password;
- secure password hashing;
- role-based authorisation;
- inactive-user control;
- session timeout;
- failed-login handling;
- logout;
- password change.

A local-only deployment does not remove the need for authentication.

---

# 43. Security Principles

Even without public cloud deployment:

- never store plaintext passwords;
- never expose database credentials in frontend code;
- restrict rate editing by role;
- restrict margin overrides;
- validate every API request;
- prevent path traversal in document downloads;
- sanitize filenames;
- use server-side authorization;
- do not trust client-calculated prices;
- calculate final prices on backend only;
- record approvals and overrides;
- back up production data.

If accessed over a LAN, local HTTPS is preferable where practical.

---

# 44. Backend as Source of Commercial Truth

The browser must never be authoritative for pricing.

Correct model:

```text
Frontend:
    captures inputs
    displays results

Backend:
    validates inputs
    loads approved rates
    performs calculations
    applies margin
    applies minimum job rule
    stores snapshot
    returns result
```

This prevents a frontend bug or manipulation from becoming an issued quotation.

---

# 45. Validation Rules

Production validation should include:

## General

- required customer/site fields;
- valid postcode/string lengths;
- valid dates;
- active surveyor;
- no negative money values.

## Measurements

- no negative lengths/areas;
- zero allowed only where commercially meaningful;
- required specification selected;
- quantity > 0 for selected equipment;
- replaster height within configured reasonable bounds or flagged;
- missing rate blocks pricing.

## Commercial

- margin < 100%;
- negative margin handled explicitly;
- override reason required when policy says so;
- minimum job value applied consistently;
- issued quotation cannot be modified;
- VAT rounded consistently;
- customer total reconciles exactly.

---

# 46. Currency and Rounding

All monetary values should use decimal arithmetic.

Recommended:

- store money as `NUMERIC(12,2)` or integer pennies;
- never use binary floating point for final commercial values;
- round customer amounts to two decimals;
- define where rounding occurs in line and total calculations;
- test reconciliation.

Required invariant:

```text
Subtotal + VAT = Total
```

and, if customer line amounts are shown:

```text
Sum(customer line amounts) = Subtotal
```

---

# 47. Production Quotation Numbering

Recommended configurable convention:

```text
AD-00001
AD-00002
AD-00003
```

Quotation revision:

```text
AD-00003-R1
AD-00003-R2
```

Numbers should be allocated centrally by the backend to avoid duplicates.

---

# 48. Company Settings

Admin-managed settings should include:

- company name;
- trading/legal details;
- addresses/offices;
- telephone;
- email;
- logo;
- VAT number if required on documents;
- default VAT rate;
- quotation validity;
- default payment terms;
- default assumptions;
- default exclusions;
- guarantee text;
- minimum job value;
- approval thresholds;
- file export location.

---

# 49. Multiple Office / Travel Origin Support

Advanced Damp publicly operates across multiple geographic regions.

Therefore travel should not be modeled as one global "distance from office" value.

Recommended:

```text
Office
├── Name
├── Address/postcode
├── Active
└── Travel bands
```

An estimate can use:

- surveyor's default office;
- manually selected origin;
- company-defined route/band.

Automatic mapping/distance APIs are not required for local production v1. A surveyor can select the correct configured band.

---

# 50. Responsive UX

Primary production devices:

1. laptop;
2. tablet;
3. desktop.

Mobile-phone support is useful, but the measurement and commercial-review screens should not sacrifice accuracy merely to fit a small display.

Production requirements:

- large input targets;
- numeric keyboard friendly fields;
- sticky save/continue actions on smaller screens;
- unsaved-change protection;
- visible calculation status;
- fast keyboard navigation;
- clear units beside every measurement;
- no horizontal scrolling for core workflows;
- accessible focus states;
- confirmation before destructive actions.

---

# 51. Autosave and Draft Protection

A field survey may be interrupted.

Recommended:

- save draft after important step changes;
- explicit Save button remains available;
- show "Saved at HH:MM";
- warn before leaving with unsaved changes;
- server-side persistence after each workflow step.

Do not rely solely on browser local storage for commercial records.

---

# 52. Error Handling

Production messages should be actionable.

Bad:

```text
500 Internal Server Error
```

Good:

```text
Cannot calculate this estimate because the selected
wall membrane has no active unit cost.

Rate: MEM-WALL-08
Ask an administrator to update the rate.
```

All unexpected server errors should be logged locally.

---

# 53. Logging

Store local operational logs for:

- application startup;
- failed database migrations;
- failed PDF generation;
- failed calculations;
- authentication failures;
- unhandled exceptions.

Do not write passwords or other unnecessary sensitive data into logs.

---

# 54. Backup and Recovery

Local-only production makes backups especially important.

## 54.1 Backup Contents

- PostgreSQL database;
- quotations;
- attachments;
- application configuration;
- logo/template assets.

## 54.2 Recommended Backup Policy

At minimum:

- automatic daily backup;
- timestamped backup;
- retain configurable number of daily copies;
- regular copy to a second company-controlled storage location;
- documented restore procedure;
- periodic restore test.

A backup that has never been restored should not be considered proven.

---

# 55. Export

Provide business-readable exports for:

- estimates;
- quotations;
- quoted vs actual;
- rate tables;
- customers.

CSV/XLSX exports should not replace the production database, but they provide portability and management reporting.

---

# 56. Database Migrations

Production database changes must use migrations.

Recommended:

```text
Alembic
```

Each release should:

1. back up data;
2. run migration;
3. start application;
4. run health check;
5. preserve historical records.

Manual editing of production database tables should not be part of normal operations.

---

# 57. Testing Strategy

## 57.1 Pricing Unit Tests

Every work type should have deterministic tests.

Examples:

- DPC 12 lm × 1.2 m;
- cavity drain wall + floor;
- sump package + battery;
- timber area + joist repairs;
- multiple ventilation units;
- travel + waste + preliminaries;
- minimum job floor;
- override above target;
- override below target;
- mixed work-type blended estimate.

## 57.2 Reconciliation Tests

Automatically assert:

- line costs equal component costs;
- subtotal equals expected sell;
- VAT calculation;
- total;
- PDF values match quotation data.

## 57.3 Permission Tests

Confirm:

- surveyor cannot edit rates;
- office user cannot see margin if restricted;
- only manager can approve required override;
- issued version cannot be edited.

## 57.4 Migration Tests

Production data survives database upgrades.

## 57.5 UI Tests

Critical flow:

```text
Login
→ customer/site
→ survey
→ scope
→ measurements
→ price
→ approval
→ quotation
→ PDF
```

---

# 58. Production Acceptance Test Scenarios

Before go-live, Advanced Damp should validate real jobs.

Recommended test set:

### Scenario A — DPC & Replastering

Use a real historical job and compare the new engine against the company's agreed commercial pricing.

### Scenario B — Cavity Drain + Pump

Validate membrane, fixings, boarding, channel, sump package and labour.

### Scenario C — Timber

Validate area/linear treatment and joist/floor repair.

### Scenario D — Ventilation

Validate multiple units.

### Scenario E — Small Job

Confirm minimum job value.

### Scenario F — Difficult London Access

Confirm parking, ULEZ/congestion, protection, carrying and access allowances.

### Scenario G — Override

Reduce sell and confirm approval/margin warning.

### Scenario H — Rate Update

Change a current rate and verify:
- new estimate uses it;
- historical issued quotation does not change.

### Scenario I — Quotation Revision

Issue R1, modify scope, issue R2, confirm both remain accessible.

### Scenario J — Actual Cost

Enter actual materials/labour and verify variance/margin reporting.

---

# 59. Production Data Required from Advanced Damp

The software cannot become commercially production-ready using demonstration rates.

Advanced Damp must provide or confirm:

## Materials

- supplier price lists;
- product codes;
- units;
- product consumption assumptions;
- waste percentages.

## Labour

- day rates;
- output rates;
- crew assumptions;
- minimum labour allowances.

## Work-Type Rules

For each work type:

- measurement method;
- specification options;
- mandatory materials;
- optional extras;
- labour rule;
- quote wording;
- target margin;
- minimum charge.

## Waste

- bagged waste;
- skip types;
- current charges.

## Travel

- operating origins;
- distance bands;
- charges.

## Preliminaries

- parking;
- congestion/ULEZ;
- access;
- protection;
- towers;
- standard setup.

## Commercial Rules

- target margins;
- minimum job value;
- approval thresholds;
- override permissions;
- VAT policy;
- payment terms;
- quotation validity;
- survey-fee credit rule;
- guarantees.

## Documents

- current quotation examples;
- current survey/report examples;
- approved logo;
- legal/company details;
- standard assumptions;
- standard exclusions;
- guarantee wording.

---

# 60. Discovery Workshops Before Production Configuration

The recommended production discovery should be practical rather than theoretical.

## Workshop 1 — Survey Workflow

Walk through:

- enquiry;
- survey;
- diagnosis;
- measurements;
- report;
- quotation.

Use 3–5 real historical examples.

## Workshop 2 — Rate and Labour Rules

For every work type, identify:

- what the surveyor measures;
- how material quantity is derived;
- how labour is estimated;
- what allowances are standard;
- what is optional.

## Workshop 3 — Commercial Controls

Confirm:

- margins;
- minimum job;
- override authority;
- approval rules;
- travel;
- waste;
- VAT;
- terms.

## Workshop 4 — Quotation

Review real quotations and agree:

- detail level;
- line-price visibility;
- standard wording;
- assumptions;
- exclusions;
- guarantees;
- validity;
- acceptance process.

## Workshop 5 — Actual Cost

Confirm what data the company can realistically capture after works.

Do not design an actual-cost process that staff will not maintain.

---

# 61. Production Upgrade from Current POC

## 61.1 Keep

- React/TypeScript frontend structure;
- FastAPI service architecture;
- deterministic backend pricing;
- five-step concept;
- current branding direction;
- work-type modularity;
- quotation generation concept.

## 61.2 Replace / Upgrade

### SQLite
→ PostgreSQL production database

### JSON seed as rate-maintenance method
→ owner/admin Rate Management UI

### POC status handling
→ formal estimate/quotation state model

### mutable estimate-only history
→ revision/version model

### sample PDF
→ production quotation template and reconciliation

### simple override
→ reason + permissions + approval + audit

### sample rate snapshot
→ complete immutable pricing snapshot

### no users
→ local authentication / roles

### basic saved estimate
→ customer/site/survey hierarchy

### future quoted-vs-actual only
→ practical actual-cost module

---

# 62. Recommended Production Screens

## Core

1. Login
2. Dashboard
3. Customers
4. Customer Detail
5. Site Detail
6. Survey Detail
7. New Estimate / Customer & Site
8. Work Scope
9. Measurements
10. Internal Price Review
11. Approval
12. Quotation Preview
13. Quotation History
14. Estimate History / Revisions

## Administration

15. Rate Management
16. Labour Rates
17. Waste / Skip
18. Travel
19. Preliminaries
20. Sump/Equipment Packages
21. Work-Type Margins
22. Minimum Job / Commercial Rules
23. Company / Quotation Settings
24. Users / Roles
25. Audit Log
26. Backup / Export

## Costing

27. Actual Costs
28. Quoted-vs-Actual Review
29. Basic Reports

---

# 63. Rate Management UX

The rate UI must be designed for a non-technical owner.

Example:

```text
Materials
----------------------------------------------------
Search: [ membrane ]

Code        Description          Unit   Cost    Active
MEM-001     Wall membrane       m²     £8.40   Yes
MEM-002     Floor membrane      m²     £9.10   Yes

[Add rate] [Export]
```

Editing:

```text
Description: Wall membrane
Unit:        m²
Cost:        £8.40
Effective:   01/09/2026
Reason:      Supplier September price list

[Save new rate]
```

The user should never see database IDs, JSON or source-code terminology.

---

# 64. Configuration vs Code

Business data should be configurable.

Examples that should **not** require a code release:

- material cost;
- labour rate;
- travel charge;
- waste cost;
- prelim cost;
- target margin;
- minimum job value;
- package cost;
- quotation validity;
- payment wording;
- assumptions/exclusions.

Code changes should be reserved for:

- new calculation behaviour;
- new measurement types;
- new workflow;
- new integrations.

---

# 65. Production Performance Targets

For a local deployment:

- dashboard response under ~2 seconds for normal data volume;
- estimate calculation effectively immediate;
- PDF generation within a few seconds;
- no page reload required for normal wizard navigation;
- graceful handling of at least several years of estimate history.

Exact scale requirements should be confirmed, but the architecture should not assume only a few dozen records.

---

# 66. Accessibility and Usability

Recommended minimum:

- labels for every input;
- visible units;
- sufficient contrast;
- keyboard access;
- focus indicators;
- clear validation messages;
- no colour-only warning meaning;
- responsive tables/cards;
- large buttons for tablet use.

---

# 67. Operational Rules

## Rule 1
No issued quotation changes silently.

## Rule 2
No historical estimate changes because rates changed.

## Rule 3
No quotation generated if a required rate is missing.

## Rule 4
No internal costs/margins appear on customer documents.

## Rule 5
Every override records who/why.

## Rule 6
Every acceptance refers to a specific quote revision.

## Rule 7
Customer-visible totals always reconcile.

## Rule 8
Backup is part of production operation, not an optional feature.

---

# 68. Suggested Implementation Phases

## Phase A — Production Foundation

- PostgreSQL;
- migrations;
- authentication;
- roles;
- customer/site/survey model;
- audit framework;
- backup framework.

## Phase B — Commercial Data Administration

- material rates;
- labour;
- travel;
- waste;
- preliminaries;
- packages;
- margins;
- minimum job;
- effective-dated rates.

## Phase C — Production Estimating Engine

- complete five work types;
- missing measurement/specification inputs;
- multi-item ventilation;
- job-level allowance policy;
- rounding/reconciliation;
- validation;
- complete rate snapshots.

## Phase D — Commercial Control

- override reasons;
- approval rules;
- estimate lifecycle;
- revisions;
- quote versioning.

## Phase E — Production Quotation

- final branding;
- issue/validity dates;
- correct totals;
- assumptions/exclusions;
- guarantee/terms configuration;
- PDF regression testing.

## Phase F — Actual Cost

- accepted baseline;
- actual material;
- labour;
- other cost;
- variance;
- quoted-vs-actual reporting.

## Phase G — Production Hardening

- UX refinement;
- tablet testing;
- error logging;
- backup/restore test;
- security review;
- historical job validation;
- user documentation;
- release checklist.

---

# 69. Go-Live Gate

The application should not be called commercially production-ready until all of the following are true:

- real rates loaded;
- labour rules approved;
- five work types validated;
- target margins approved;
- minimum job policy approved;
- travel/prelim rules approved;
- quotation wording approved;
- PDF reconciliation passes;
- rate management works;
- permissions tested;
- audit tested;
- backup restored successfully;
- at least 5–10 historical jobs reproduced within expected commercial tolerance;
- Advanced Damp signs off the output.

---

# 70. Local Production Release Checklist

```text
[ ] Production database created
[ ] Default admin account secured
[ ] Real users created
[ ] Company settings verified
[ ] VAT settings verified
[ ] Real rates imported
[ ] Work-type margins confirmed
[ ] Travel rules confirmed
[ ] Waste/skip rules confirmed
[ ] Minimum job confirmed
[ ] Payment terms confirmed
[ ] Assumptions/exclusions confirmed
[ ] Logo installed
[ ] PDF tested
[ ] Historical quotes validated
[ ] Backup created
[ ] Restore tested
[ ] User guide provided
[ ] Admin guide provided
[ ] Version recorded
```

---

# 71. Future Cloud Readiness

Although the first real deployment remains local, production architecture should not depend on local-only implementation shortcuts.

The following separation should remain:

```text
UI
↓
API
↓
Domain / Pricing Services
↓
Persistence
```

This means a future move from:

```text
Local PostgreSQL
```

to:

```text
Managed PostgreSQL
```

does not require rebuilding the pricing logic.

Similarly, local file storage can later be replaced by object storage behind a document-storage interface.

---

# 72. AI Position

AI is not necessary to make this production tool valuable.

Future AI could assist with:

- summarising survey notes;
- drafting customer-friendly scope wording;
- extracting measurements from structured reports for review;
- searching previous estimates;
- flagging unusual estimates.

AI should not:

- invent quantities;
- decide the treatment without professional review;
- change rates;
- calculate final commercial prices outside deterministic rules;
- approve margin overrides.

---

# 73. Production Success Metrics

After go-live, Advanced Damp should be able to measure:

- average time from survey to quote;
- number of quotations per surveyor;
- percentage of estimates requiring override;
- average target margin;
- average actual margin;
- rate of minimum-job adjustments;
- estimated-vs-actual labour variance;
- material variance;
- accepted/declined quotation value;
- margin by work type.

These metrics should emerge from normal workflow rather than requiring duplicate administration.

---

# 74. Primary Business Value

The production system should create the following sequence:

```text
Qualified Survey
        ↓
Structured Measurements
        ↓
Approved Rate Rules
        ↓
Consistent Cost Estimate
        ↓
Controlled Commercial Margin
        ↓
Fixed-Price Customer Quotation
        ↓
Accepted Commercial Baseline
        ↓
Actual Job Cost
        ↓
Variance & Margin Learning
```

Immediate benefit:

- quicker estimating;
- fewer pricing inconsistencies;
- stronger margin control;
- consistent quotations;
- safer rate changes.

Longer-term benefit:

- Advanced Damp begins building a reliable commercial dataset showing which work types, assumptions and productivity rates are genuinely profitable.

---

# 75. Recommended Next Development Objective

The next development target should **not** be another visual POC.

It should be the first production vertical slice using real company data:

```text
Login
→ Customer / Site
→ Survey
→ DPC or Cavity Drain estimate
→ Real central rates
→ Price review
→ Approval
→ Production quotation
→ PDF
→ Saved immutable revision
```

Once that vertical slice has been signed off against historical Advanced Damp jobs, the remaining work types can be migrated to the same production architecture.

This reduces commercial risk because the company validates the underlying data model, rate management, approval process and quotation output before all treatment rules are expanded.

---

# 76. Information Still Requiring Client Confirmation

The following should be treated as **production discovery items**, not assumptions:

1. Exact operating office/travel origins
2. Current material suppliers and price lists
3. Labour day/output rates
4. Material consumption rules
5. Target margin per work type
6. Minimum job value
7. Minimum permissible margin
8. Price override authority
9. Approval thresholds
10. Waste/skip charges
11. Parking/ULEZ/access rules
12. Exact membrane/fixing specifications
13. Timber linear-measure rules
14. Sump package definitions
15. Ventilation equipment catalogue
16. Survey-fee credit policy
17. Payment terms
18. Quote validity
19. VAT edge cases
20. Guarantee wording
21. Standard assumptions
22. Standard exclusions
23. Quotation line-price policy
24. Actual-cost data the company can reliably capture
25. Required local deployment mode: single workstation or central LAN server
26. Number of simultaneous users

The system should not encode guessed commercial values for any of these.

---

# 77. Source / Research Notes

This production definition was prepared from:

- `Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview.md`
- `Advanced_Damp_Job_Estimating_Quoting_POC_Project_Overview_v2.md`
- supplied POC screenshots
- supplied quotation PDF for `AD-00001`
- supplied project README/demo index
- Advanced Damp's public Services page
- Advanced Damp's public Commercial Services page
- Advanced Damp's public Contact page
- Advanced Damp's public Locations page
- Advanced Damp's public Damp Survey information
- Advanced Damp's public case-study/service material describing survey-first diagnosis, fixed-price quotations and structural-waterproofing workflows

Public website research is used to understand the broad operational context. Exact commercial policies, rates, internal approvals and job procedures must still be confirmed directly with Advanced Damp before go-live.

---

# 78. Final Recommendation

The existing POC has already proven that the core idea works.

The production upgrade should now focus on **commercial reliability and operational truth**, not simply additional interface polish.

The highest-priority production capabilities are:

1. real rate administration;
2. survey/customer/site data model;
3. PostgreSQL local production database;
4. complete work-type input rules;
5. deterministic pricing reconciliation;
6. quotation revisions;
7. margin override approval;
8. audit trail;
9. production PDF;
10. quoted-versus-actual costing;
11. backup/restore;
12. local authentication and permissions.

With those capabilities implemented and validated using Advanced Damp's real historical jobs and live price data, the application can move from a demonstration into a practical company estimating system while remaining entirely within a local/company-controlled deployment environment.

---

*End of document*
