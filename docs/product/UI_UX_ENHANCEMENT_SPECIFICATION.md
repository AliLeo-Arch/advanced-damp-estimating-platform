# Trade Estimating & Quoting Platform
## Professional UI/UX Enhancement Specification

**Document type:** UI/UX review, design-system specification, and implementation roadmap  
**Version:** 1.0  
**Product:** Generic specialist-trade estimating, margin-control, quotation, and job-costing platform  
**Primary environments:** Local production, desktop/laptop, tablet-friendly field use  
**Primary users:** Surveyors/estimators, commercial managers, administrators, office staff, job-cost users  
**Reviewed visual baseline:** Screenshots `01`–`20` supplied on 2026-09-07  
**Purpose:** Transform the current functional production foundation into a professional, consistent, trustworthy product suitable for real contractor operations and portfolio/client demonstrations.

---

# 1. Executive Summary

The current interface already has a strong functional foundation. It demonstrates a coherent end-to-end workflow:

```text
Sign in
  ↓
Estimate dashboard
  ↓
Customer / Site
  ↓
Work Scope
  ↓
Measurements & Allowances
  ↓
Price Review
  ↓
Quotation
  ↓
Lifecycle / Revision
  ↓
Job Actuals
```

It also contains several production-oriented capabilities that are often missing from estimating POCs:

- authentication;
- saved estimate search/filtering;
- lifecycle statuses;
- customer records;
- company and commercial settings;
- versioned rate data;
- rate history;
- backups;
- estimate revisions;
- locked quoted estimates;
- multiple quotation export formats;
- post-job actual costing.

The visual language is also already recognizable and reasonably consistent: dark navy for authority and text, orange for primary action, blue for active/navigation state, light grey application canvas, white content surfaces, and green for positive commercial status.

However, the current UI still behaves visually like a **functional internal application under active development**, rather than a polished production estimating product. The main issues are not a lack of features; they are:

1. **Action hierarchy is too dense**, especially inside the estimate lifecycle.
2. **The information architecture mixes configuration, operations, and developer/system details.**
3. **The estimate wizard and estimate lifecycle are visually competing with one another.**
4. **Several screens expose implementation or demo concepts that should not appear in a production UI.**
5. **Some commercial states can be misleading**, especially the actual-cost variance view before actual costs have been entered.
6. **Rates administration is too dense and vertically long for efficient real-world use.**
7. **Customer creation and estimate creation duplicate data-entry concepts.**
8. **Read-only/locked states are not visually differentiated strongly enough.**
9. **Responsive/tablet behaviour needs a deliberate field-use design rather than simple shrinking.**
10. **Component behaviour, spacing, typography, status colours, labels, and empty/loading/error states need a formal design system.**

The UI/UX enhancement should therefore focus on **clarity, commercial trust, field speed, decision hierarchy, and consistency**.

The product should feel like professional contractor operations software—not a marketing website and not an engineering admin panel.

---

# 2. Product UX Principles

Every future UI decision should be checked against the following principles.

## 2.1 Commercial Truth First

The application handles prices, margins, revisions, and quoted-vs-actual profitability.

The UI must make it difficult to misunderstand:

- what is editable;
- what is calculated;
- what has been issued;
- what is historical;
- what has been overridden;
- what is awaiting approval;
- what is customer-facing;
- what is internal-only.

Numbers should never appear more certain than the underlying data.

## 2.2 One Primary Task at a Time

Orange is currently used successfully as a strong call-to-action colour, but there are screens where several orange actions compete.

Each screen or card should normally have **one dominant action**.

Examples:

```text
Measurements:
Primary → Calculate price

Price review:
Primary → Generate quotation

Quotation:
Primary → Issue quotation

Job actuals:
Primary → Save actual costs
```

Global actions such as `New estimate` should visually step down while a user is already editing an estimate.

## 2.3 Surveyor Speed

A field user should be able to move through an estimate without searching for controls.

Design for:

- obvious next action;
- clear units;
- predictable field order;
- large touch targets;
- saved-state confidence;
- minimal repeated entry;
- fast keyboard use on laptop;
- sensible tablet layout.

## 2.4 Progressive Disclosure

Do not present every available action simultaneously.

Show:

- common actions immediately;
- advanced actions only when relevant;
- destructive or uncommon lifecycle transitions inside an overflow/action menu;
- detailed commercial breakdown only when requested.

This is especially important for estimate lifecycle actions and rate administration.

## 2.5 System Status Should Be Quiet

The current dashboard displays information such as:

`System connected · Trade Estimating & Quoting · v1.0.0-local-prod`

This is useful diagnostic information but not a core estimating task.

Production UX should keep operational health available without competing with business content.

Recommended locations:

- Admin > System;
- user/account menu;
- small non-intrusive status indicator in application footer if required.

## 2.6 Read-Only Must Look Read-Only

When an estimate is quoted and locked, users should not merely be told that it is locked.

Editable controls should visually become:

- read-only text;
- disabled controls;
- lock indicators;
- muted cards;
- explicit revision CTA.

A user should not see an apparently clickable `Add to estimate` card on a locked commercial version.

## 2.7 Configuration Should Look Like Configuration

Rates, margins, company details, VAT, and quote terms should be presented separately from operational estimating screens.

This reduces accidental changes and cognitive load.

---

# 3. Current Visual Strengths

The existing baseline contains several strong decisions that should be retained.

## 3.1 Brand / Product Identity

The `TE` mark and `Trade Estimating / Quoting` lockup are simple, clean, and appropriate for a generic platform.

The navy/orange combination communicates:

- reliability;
- construction/commercial seriousness;
- clear action emphasis.

The blue horizontal rule gives the shell a recognizable identity without overwhelming the workspace.

## 3.2 Surface Hierarchy

The application uses:

- light grey canvas;
- white cards;
- subtle borders;
- dark text;
- colored state chips.

This is appropriate for a business application and should remain.

## 3.3 Estimate Step Navigation

The step navigation is understandable and compact:

```text
Customer & Site
Work Scope
Measurements
Price Review
Quotation
```

It communicates progress effectively.

The production redesign should improve state styling rather than replace the concept.

## 3.4 Internal / Customer Separation

The `INTERNAL ONLY` marker on the price review is excellent.

The customer quotation avoids exposing:

- material cost;
- labour cost;
- target margin;
- internal cost build-up.

This separation should remain a core design rule.

## 3.5 Status Chips

Statuses such as:

- READY TO QUOTE;
- PRICED;
- QUOTED;

are useful visual anchors.

They need a formal semantic colour system, but the current concept is correct.

## 3.6 Locked Quotation Behaviour

The banner:

> This estimate is locked (quoted). Create a revision to make commercial changes.

is exactly the right commercial concept.

The next improvement is ensuring every downstream control visually respects that state.

---

# 4. Global Information Architecture

The current top navigation is:

```text
Estimates
Customers
Rates
Admin
```

This is a good compact foundation, but production growth requires clearer separation between operational work and administration.

## 4.1 Recommended Primary Navigation

For the current feature set:

```text
Estimates
Customers
Rates
Job Costing
Reports
Admin
```

If `Job Costing` and `Reports` are not yet broad enough for dedicated modules, keep them inside Estimates initially.

### Role Visibility

Surveyor:

```text
Estimates
Customers
```

Commercial manager:

```text
Estimates
Customers
Rates
Job Costing
Reports
```

Administrator:

```text
Estimates
Customers
Rates
Reports
Admin
```

Navigation should be permission-driven.

---

# 5. Application Header

## Current State

The header contains:

- logo;
- navigation;
- text such as `System Administrator · admin`;
- Sign out;
- New estimate.

## Problems

1. The user identity appears as plain text in the navigation row.
2. Role + username consume space.
3. `Sign out` is too visually prominent.
4. `New estimate` remains an orange primary CTA even while a user is actively editing another estimate.
5. On narrower layouts, this row will become crowded quickly.

## Recommended Design

```text
[Logo]   Estimates  Customers  Rates  Reports

                         [+ New estimate]   [AK ▾]
```

User menu:

```text
Alex King
System Administrator
----------------------
Profile
System status
Sign out
```

### Behaviour

- On dashboard/list screens, `New estimate` can remain primary.
- Inside an active estimate, render it as a secondary button or move it into the user/global create menu.
- `Sign out` belongs inside the account menu.
- Do not display technical usernames in the primary navigation.

---

# 6. Page Container & Layout System

The current desktop pages sometimes feel narrow inside very large screens, while the Rates table becomes extremely long.

Adopt standard content widths.

## 6.1 Recommended Containers

```text
--content-narrow:  760px   // login, simple settings forms
--content-default: 1120px  // estimates, customers, editors
--content-wide:    1360px  // rate tables, reports, dense data
```

Use the correct width by task rather than one global maximum.

---

# 7. Spacing System

Use a consistent 4/8-based scale.

```text
4   micro gap
8   inline control gap
12  compact content gap
16  default internal spacing
24  section spacing
32  card block spacing
48  major page section
64  top/bottom page breathing room
```

Avoid arbitrary spacing values.

Cards should normally use:

- 24px padding desktop;
- 20px tablet;
- 16px mobile.

---

# 8. Typography System

The current typography is clean but needs explicit hierarchy.

Recommended semantic scale:

| Token | Size | Weight | Use |
|---|---:|---:|---|
| Display | 36–40 | 700 | Major estimate title |
| H1 | 32 | 700 | Page title |
| H2 | 22–24 | 700 | Major card title |
| H3 | 18 | 650/700 | Section title |
| Body L | 16–17 | 400 | Intro / important prose |
| Body | 15–16 | 400 | Default UI |
| Label | 13–14 | 600 | Forms |
| Small | 12–13 | 400/500 | Metadata |
| Numeric | 16–20 | 650/700 | Cost/margin values |

Commercial values should use tabular numerals where supported.

Avoid all-caps except:

- small status chips;
- compact metadata labels.

---

# 9. Colour System

Retain the current identity but formalise meaning.

## 9.1 Core

```text
Navy 900     Primary text / authority
Blue 500     Active navigation / focus / links
Orange 500   Primary CTA
Grey 25      App background
White        Surfaces
Grey 200     Borders
Grey 600     Secondary text
```

## 9.2 Semantic

### Success

Use for:

- accepted;
- healthy margin;
- completed backup.

### Warning

Use for:

- review required;
- margin near threshold;
- unsaved changes;
- expiring quote.

### Danger

Use for:

- margin below permitted floor;
- destructive actions;
- restore database;
- irreversible state.

### Informational Blue

Use for:

- locked estimate banner;
- system information;
- pricing notes.

Do not communicate status by colour alone. Pair colour with text/icon.

---

# 10. Buttons

## Primary

Orange filled.

Use for one key forward action.

Examples:

- Continue
- Calculate price
- Generate quotation
- Issue quotation
- Save actual costs

## Secondary

White / navy outline.

Examples:

- Back
- Create revision
- Export
- Add rate

## Tertiary

Text or subtle ghost.

Examples:

- Cancel
- Clear filters
- View history

## Destructive

Red or danger-styled confirmation action.

Examples:

- Deactivate
- Restore backup
- Delete draft (if allowed)

### Important

`Deactivate` should not look like a normal neutral row action because it changes commercial configuration availability.

---

# 11. Forms

## 11.1 Labels

Keep labels permanently visible.

Never rely on placeholder-only labels.

## 11.2 Units

Show units:

```text
Wall area
[ 20.0 ] m²
```

rather than forcing users to infer from label text.

## 11.3 Helper Text

Use helper text only for business rules.

Example:

> Override reason is required when final sell differs from the calculated price.

## 11.4 Errors

Show field-level error below the input and a summary when required.

## 11.5 Dates

For a UK-oriented default deployment, use:

```text
dd/mm/yyyy
```

or a locale-aware formatted picker.

Several current screens show `mm/dd/yyyy`, which conflicts with the product's UK trade context.

Generic product architecture should make date format locale-configurable.

---

# 12. Tables

Tables are appropriate for:

- estimates;
- rate data;
- cost history;
- variance.

Production table rules:

- sticky header for long lists;
- row hover;
- row click for main object;
- explicit selected state;
- tabular numbers;
- currency right-aligned;
- status center/left-aligned;
- action menu at right;
- sortable columns indicated clearly;
- responsive column priority.

Do not force dense desktop tables directly onto mobile.

---

# 13. Screenshot-by-Screenshot Review

## 13.1 `01-login-page(2).png` — Login

### Strengths

- very clear single task;
- good centered card;
- strong logo;
- clean primary button;
- low cognitive load.

### Issues

#### Exposed Demo Credentials

The page visibly includes demo account credentials/password guidance below the login form.

This is acceptable for a controlled portfolio/demo build but should **never appear in production mode**.

#### Excessive Empty Space

The large canvas makes the login panel feel isolated.

#### No Password Utility

No obvious:

- show/hide password;
- forgot/reset flow;
- Caps Lock warning;
- error region.

For a local application, password reset may be administrator-driven, but the UI should explain the process.

### Recommendation

Use environment-aware behaviour:

```text
DEMO MODE:
Show "Demo accounts" expandable panel.

PRODUCTION:
No demo credentials.
Show:
"Contact your system administrator if you cannot sign in."
```

Add:

- show password button;
- loading state;
- incorrect credential message;
- account disabled message.

---

## 13.2 `02-estimates-dashboard(2).png` — Estimates Dashboard

### Strengths

- clear page title;
- search/filter section;
- useful status filters;
- sell and margin visible;
- compact operational table;
- export exists.

### Issues

#### Duplicate Primary Action

`New estimate` exists in both:

- global header;
- page content.

Choose one dominant placement.

#### System Diagnostic Text Is Too Prominent

`System connected · ... · v1.0.0-local-prod`

does not need to sit beside primary business actions.

#### Table Row Readability

Site/address data wraps heavily.

Survey dates also wrap over multiple lines.

#### `Edit` Is Not Always the Correct Action

For:

- quoted;
- closed;
- accepted;

the correct action is often:

- Open;
- View;
- Review;

not Edit.

### Recommendation

Use:

```text
Reference | Customer | Site | Surveyor | Date | Status | Sell | Margin | ⋯
```

Make row/reference clickable.

Replace `Edit` with contextual primary row action:

```text
Open
```

and use overflow for:

- create revision;
- download quote;
- view history.

---

## 13.3 `03-estimates-advanced-filters(2).png` — Advanced Filters

### Strengths

- filters are hidden by default;
- advanced controls are useful;
- date, surveyor, min/max value are practical.

### Issues

- `Apply filters` becomes a large orange button that competes with New Estimate.
- No clear `Clear all`.
- Filter state is not summarized once the advanced panel is collapsed.
- Surveyor is free text rather than a user selector.

### Recommendation

Advanced filter footer:

```text
[Clear filters]                     [Apply filters]
```

After apply, display active filters as removable chips:

```text
Surveyor: James Whitaker ×
Survey date: 01/08–31/08 ×
Min sell: £750 ×
```

Use an actual active-user dropdown for Surveyor.

---

## 13.4 `05-customers(2).png` — Customers & Surveys

### Strengths

- introduces customer → site → survey concept;
- simple customer creation form.

### Major Issue: List/Data Consistency

The screenshot shows `No customers yet`, while estimates elsewhere contain named customers.

Even if this is only seeded/demo-state behaviour, the UI creates the impression that customer records and estimate customer data are disconnected.

In production this would seriously reduce trust.

### Structural Issue

The page is called `Customers & surveys`, but the entire first section is a large New Customer form.

For normal daily use, users will usually search/open existing customers more often than creating new ones.

### Recommendation

Use a list-first architecture:

```text
Customers                         [Add customer]

[Search customers...]

Customer list / table
```

`Add customer` opens a drawer/modal.

Customer detail:

```text
Customer
├── Details
├── Sites
├── Surveys
└── Estimates
```

This better expresses the relationship model.

---

## 13.5 `06-rates-company-and-settings(1).png` — Rates & Commercial Settings

### Strengths

- company profile configurable;
- commercial settings centralized;
- margins by work type visible;
- rates separated from code;
- production concept is strong.

### Problems

This page currently combines too many different administrative concepts:

1. company identity;
2. quotation configuration;
3. VAT;
4. minimum job rules;
5. margins;
6. rate table.

The result is a very long page with mixed risk levels.

A company-address edit is not the same type of task as changing a labour rate or minimum permitted margin.

### Recommended Information Architecture

`Rates` should become:

```text
Rates
├── Materials
├── Labour
├── Packages
├── Waste & Disposal
├── Travel
└── Preliminaries
```

`Settings` should contain:

```text
Settings
├── Company
├── Commercial Rules
├── Work Types & Margins
└── Quotation Defaults
```

If keeping only the current navigation, use tabs:

```text
Rate Library | Commercial Rules | Company & Quote
```

---

## 13.6 `07-rates-add-form(1).png` — Add Rate

### Strengths

- rate add form exists;
- rate code, name, category, unit, cost, waste and notes are captured.

### Issues

The add form expands inline above a huge table.

This causes:

- vertical jump;
- context loss;
- long-page fatigue.

### Recommendation

Use a right-side drawer:

```text
Add rate
----------------
Code
Name
Category
Unit
Cost
Waste %
Effective date
Notes
----------------
[Cancel] [Add rate]
```

Advantages:

- table remains visible;
- less page movement;
- easier edit/add parity;
- mobile can present the drawer as a full-screen sheet.

---

## 13.7 `08-rates-cost-history(1).png` — Rate History

### Strengths

Rate history is an excellent production feature.

### Issue

History expands directly inside the row/table.

This breaks table rhythm and makes a dense page harder to scan.

### Recommendation

Use a side panel:

```text
Rate: LAB-BOARD-M2
Current: £22.00 / m²

History
01 Sep 2026   £22.00   Alex King   Supplier update
01 Jun 2026   £20.50   Admin       Quarterly review
```

Provide:

- effective date;
- changed by;
- reason;
- old/new value.

---

## 13.8 `09-admin-backups(1).png` — Admin / Backups

### Strengths

- backup is visible;
- connection state shown;
- create backup CTA;
- restore warning exists.

### Critical Production UX Issues

#### Implementation Detail Leakage

The interface says:

> Restore replaces the live SQLite database.

and instructs the user to restart the backend and references a Markdown guide.

This is developer/operator language, not polished product UX.

#### No Backup Confidence Information

The user needs:

- last backup;
- status;
- size;
- location;
- verification;
- restore capability;
- schedule.

### Recommendation

Admin backup screen:

```text
Backup status
Last successful backup: Today, 02:00
Automatic backup: Daily
Storage: D:\TradeEstimating\Backups
Last verification: Passed
```

Actions:

```text
[Create backup now]
[Backup settings]
```

Backup list:

```text
Date | Size | Verification | Created by | Actions
```

Restore must use:

1. select backup;
2. warning;
3. type/confirm;
4. automatic safety snapshot;
5. progress;
6. clear success/failure result.

Use database-agnostic wording in UI.

---

## 13.9 `10-estimate-new-customer(1).png` — New Estimate / Customer & Site

### Strengths

- simple first step;
- clear progression;
- fields are understandable.

### Major Production Issue: Free-Text Duplication

The form asks for:

- Customer name;
- Surveyor;
- Site address;

as free text even though the application now has:

- customer records;
- user accounts;
- survey records.

This creates duplicate data and inconsistent history.

### Recommendation

Replace with relational selection.

```text
Customer
[Search or select customer...] [Add new]

Site
[Select site...] [Add site]

Survey
[Select survey / Create survey]

Surveyor
[Sarah Okonkwo ▼]

Survey date
[07/09/2026]
```

Allow a rapid `Quick estimate` mode later if a business truly needs it, but the production default should use structured records.

---

## 13.10 `11-estimate-editor-overview.png`

### Strengths

This screenshot introduces a strong estimate-context header:

- status;
- sell;
- margin;
- quotation action;
- revision action.

This is the correct direction.

### Issue

The context bar becomes crowded as lifecycle grows.

It is currently trying to represent:

- commercial state;
- financial summary;
- lifecycle actions;
- revision actions.

### Recommendation

Separate context from actions.

#### Left

```text
READY TO QUOTE
Sell £1,607.64
Margin 28.0%
```

#### Right

Only the most relevant action:

```text
[Issue quotation] [More ▾]
```

More:

```text
Create revision
View history
Close estimate
```

After quoted:

```text
[Record acceptance] [More ▾]
```

---

## 13.11 `12-estimate-customer.png` — Customer & Site Step

### Strengths

- easy to scan;
- two-column desktop layout;
- notes field separated.

### Improvements

- convert free text to structured customer/site references;
- include customer contact summary;
- show `Change customer/site` rather than editing identifying fields directly after quotation;
- locale-aware date;
- add save state indicator.

For an existing structured estimate:

```text
Customer
Cedar Property Management Ltd
[View customer]

Site
Flat 4, 8 Market Place, Reading RG1 2DE
[View site]
```

Use forms only while the record is editable.

---

## 13.12 `13-estimate-scope.png` — Work Scope

### Strengths

- strong card selection;
- selected state is obvious;
- current work types demonstrate configuration well.

### Generic UX Language

The helper text says:

> Select one or more treatment types identified on site.

For a generic trade platform, use:

> Select one or more work types for this estimate.

or:

> Select the services included in the proposed works.

`Treatment` is still remediation-specific.

### Future Scalability

Five cards work well.

With 15–30 work types, add:

- category grouping;
- search;
- favorites/recent;
- collapse sections.

### Selected State

Add a visible checkmark:

```text
✓ Ventilation Equipment
Selected
```

For locked quotes:

```text
🔒 Ventilation Equipment
Included in quoted revision
```

No interactive hover or `Add to estimate`.

---

## 13.13 `14-estimate-measurements.png` — Measurements & Allowances

### Strengths

- supports multiple ventilation items;
- job allowances are centralized;
- travel and waste are clear;
- main CTA is obvious.

### Problems

#### Repeated Item Rows Lack Controls

Two equipment entries are shown, but there is no obvious:

- row number;
- remove item;
- add another item.

#### Allowances Are Visually Flat

Parking, ULEZ, protection, access, and preliminaries appear in one checkbox area.

### Recommendation

Use repeatable line items:

```text
Ventilation equipment

1. Positive Input Ventilation (PIV)     Qty 1     [Remove]
2. Extractor fan 100 mm                 Qty 2     [Remove]

[+ Add equipment]
```

Group allowances:

#### Travel & Disposal

```text
Travel band
Waste / skip
```

#### Site Access & Preliminaries

```text
☐ Restricted access / carrying
☑ Parking
☐ Enhanced protection
☐ Tower / access equipment
☑ Standard preliminaries
☑ ULEZ / congestion
```

Add a short calculated allowance subtotal if useful.

---

## 13.14 `15-estimate-pricing.png` — Price Review

### Strengths

This is one of the strongest screens.

It communicates:

- materials;
- labour;
- waste;
- travel;
- preliminaries;
- total cost;
- target margin;
- calculated sell;
- final sell;
- margin value;
- actual margin;
- override;
- work-type breakdown.

### Main UX Issue: Cost Context

The work-type line displays:

```text
Cost £925.00
Sell £1,607.64
```

while total job cost is:

```text
£1,157.50
```

The explanatory text states that work-type sells include allocated waste, travel, and preliminaries.

This is mathematically valid, but a user may interpret `Cost £925` as total cost for the work type and wonder where the other costs went.

### Recommendation

Rename:

```text
Direct work cost      £925.00
Allocated allowances  £232.50
Total priced cost     £1,157.50
Target sell           £1,607.64
```

For multiple work types, show an expandable breakdown.

### Margin Health

Create a consistent indicator:

```text
28.0%  ✓ On target
```

or:

```text
22.4%  ⚠ Below target
```

Do not rely only on green text.

### Override

The current blank-field approach is good.

Add:

- `Restore calculated price` after an override;
- explicit approval indicator if required;
- audit metadata after save.

---

## 13.15 `16-estimate-quotation.png` — Quotation

### Strengths

- issue and valid-until date included;
- line amount reconciles;
- VAT correct;
- guarantee / survey fee / acceptance / assumptions / exclusions are shown;
- customer quotation is clearly separated.

### Important UX Problems

#### Internal Reconciliation Message

The sentence:

> Line amounts reconcile to subtotal (£1,607.64).

is an internal validation statement and should not appear in a customer-facing quotation.

Keep reconciliation as a hidden validation check or internal badge.

#### CSV / Excel Beside PDF

PDF is a natural customer-document export.

CSV and Excel are data exports and represent a different intent.

Recommended:

```text
Export quotation
[PDF]

More exports ▾
CSV
Excel
```

or move data exports to an internal estimate menu.

#### `Mark as quoted`

This wording sounds like manually setting a database state.

Use a business action:

```text
Issue quotation
```

On click:

```text
Issue quotation EST-DEMO-04?

Issue date: 07/09/2026
Valid until: 07/10/2026

[Cancel] [Issue quotation]
```

Optionally capture:

- Email
- Printed
- Other

without requiring email integration.

#### `Done`

`Done` is ambiguous.

Use:

```text
Back to estimates
```

or:

```text
Save & return
```

depending on behaviour.

---

## 13.16 `17-estimate-actuals.png` / `20-estimate-actuals-detail.png` — Job Actuals

This area has the highest-priority UX/data-trust issue in the supplied baseline.

### Strengths

- quoted-vs-actual concept is excellent;
- estimated categories map cleanly to actual categories;
- revenue can be overridden;
- variance table is useful.

### Critical Problem: Zero Actuals Producing 100% Margin

The variance table currently shows:

```text
Actual materials      £0
Actual labour         £0
...
Actual total cost     £0
Actual revenue        £1,607.64
Actual margin         £1,607.64
Actual margin %       100%
```

before real actual costs have been entered.

This is commercially misleading.

`No actual cost data` must not be interpreted as `actual cost = £0`.

### Required Redesign

Actuals need data completeness state:

```text
Actuals status:
Not started
Partial
Complete
```

Before any actuals are entered:

```text
Actual cost       —
Actual margin     —
Variance          —
```

Display:

> No actual costs have been recorded yet.

### Input Design

Do not visually prefill actual inputs with estimated values unless they are truly saved actual data.

Better:

```text
Materials
Actual cost [            ]
Estimated: £640.00
```

If the current grey numbers are placeholders, make that distinction much stronger.

### Partial Actuals

If only some values are recorded:

```text
Actuals status: Partial
3 of 6 cost categories entered
```

Variance rows with missing values should show:

```text
Not entered
```

not zero.

### Completion

Add:

```text
[Save draft actuals]
[Mark actuals complete]
```

Only after complete should final actual margin be presented as a definitive commercial KPI.

---

## 13.17 `18b-estimate-marked-quoted.png` / `18-estimate-lifecycle-actions.png`

### Strengths

- quoted state visible;
- estimate locked banner;
- create revision;
- lifecycle transitions;
- job actuals access.

### Major Issue: Too Many Peer Actions

Current toolbar includes combinations of:

- Mark as accepted;
- Declined;
- Expired;
- Close;
- Job actuals;
- Create revision.

These are not equivalent actions and should not appear as a flat button row.

### Recommended Lifecycle Header

```text
QUOTED
Sell £1,607.64
Margin 28.0%

[Record acceptance] [More ▾]
```

More menu:

```text
Mark declined
Mark expired
Create revision
Close estimate
View quotation history
```

`Job actuals` should be available when:

- accepted;
- work started;
- job costing permitted;

not necessarily as a lifecycle peer to `Declined`.

If the business allows actual costing before formal acceptance, define that explicitly.

---

## 13.18 `19-estimate-quotation-detail.png`

### Strengths

- locked state remains visible;
- quotation read-only view is clear.

### Enhancement

Once quoted, the quotation view should become a historical artifact.

Display:

```text
Quotation EST-DEMO-04-R1
Issued 07/09/2026
Status: Quoted
PDF generated
```

and provide:

```text
[Download PDF]
[Create revision]
```

Avoid controls that imply editing the issued commercial document.

---

# 14. Estimate Editor: Redesign the Mental Model

The current estimate editor combines two different concepts:

## Concept A — Estimate Construction

```text
Customer & Site
Work Scope
Measurements
Price Review
Quotation
```

## Concept B — Estimate Lifecycle

```text
Draft
Priced
Ready to Quote
Quoted
Accepted
Declined
Expired
Closed
```

These should not compete visually.

## Recommended Structure

### Header

Identity + commercial status:

```text
Estimate EST-DEMO-04
Cedar Property Management Ltd · RG1 2DE

QUOTED
Sell £1,607.64
Margin 28.0%
```

### Context Action

```text
[Record acceptance] [More ▾]
```

### Estimate Tabs

```text
Details | Scope | Measurements | Pricing | Quotation | Actuals
```

Before quotation, the same tabs can behave like a guided workflow.

After quotation, they become navigational tabs in read-only state.

This avoids calling `Job actuals` Step 6 of the original estimating wizard.

---

# 15. Wizard State Design

Use four visual states:

## Completed

```text
✓ Customer & Site
```

Blue text/check; clickable.

## Current

Filled/subtle active background + underline.

## Available Next

Normal muted text; clickable only when valid.

## Locked / Unavailable

Muted with lock icon and explanation tooltip.

Do not use disabled-looking light text for steps users are actually allowed to navigate to.

---

# 16. Lifecycle Status System

Recommended semantic statuses:

| Status | Meaning | Colour |
|---|---|---|
| Draft | Incomplete estimate | Neutral |
| Priced | Pricing calculated | Blue |
| Review required | Commercial review needed | Amber |
| Approved | Commercially approved | Teal/Blue |
| Ready to quote | Ready for customer document | Green/Teal |
| Quoted | Issued | Indigo/Blue |
| Accepted | Customer accepted | Green |
| Declined | Customer declined | Red/Neutral danger |
| Expired | Quote validity ended | Amber/Neutral |
| Closed | No further active workflow | Grey |

Use icons + labels where helpful.

---

# 17. Customer Module Redesign

Recommended customer list:

```text
Customers                                  [Add customer]

[Search by name, company, phone, postcode...]

Name                    Type            Sites   Open estimates
Cedar Property Mgmt     Property Mgr    8       2
Emma Thompson           Homeowner       1       1
```

Customer detail:

```text
Cedar Property Management Ltd

[Overview] [Sites] [Surveys] [Estimates]
```

Site:

```text
Flat 4, 8 Market Place
Reading RG1 2DE

Site notes
Parking/access
Surveys
Estimates
```

This turns `Customers & surveys` into a genuine operational module rather than a single add form.

---

# 18. Rates Module Redesign

The current Rates functionality is powerful but the UI should be reorganized.

## 18.1 Rates Home

```text
Rate Library

Materials      18 active
Labour          9 active
Packages        4 active
Waste           4 active
Travel          4 active
Preliminaries   8 active
```

Below:

```text
Recent rate changes
```

## 18.2 Rate Table

Desktop:

```text
Code | Name | Category | Unit | Cost | Waste | Effective | Status | ⋯
```

Actions menu:

```text
Edit / new version
View history
Deactivate
```

## 18.3 Filtering

Use:

- search;
- category;
- status;
- effective date;
- sort.

## 18.4 Add/Edit

Use drawer.

## 18.5 History

Use side panel or dedicated detail page.

---

# 19. Settings Module

Move non-rate configuration away from Rate Library.

Recommended:

```text
Admin / Settings

Company profile
Commercial rules
Work types & target margins
Quotation defaults
Users & roles
Backup & restore
System
```

This gives each setting an understandable ownership boundary.

---

# 20. Quotation Preview UX

The in-app quotation should approximate the PDF structure without trying to be an exact browser replica of A4.

Recommended card:

```text
Customer quotation                   [Download PDF]

Company
Quote reference
Issue / validity

Customer / site

Scope of works
-------------------------------------
Ventilation Equipment       £1,607.64
1 × PIV
2 × Extractor fan

Subtotal                    £1,607.64
VAT                           £321.53
Total                       £1,929.17

Payment terms
Guarantee
Acceptance
Assumptions
Exclusions
```

Remove internal diagnostic notes.

Add `Preview PDF` if exact print appearance matters.

---

# 21. Actual Costing UX

The current post-job module should evolve from a basic cost form into a confidence-aware costing experience.

## 21.1 Status

```text
Actual costing
Status: Not started
```

or:

```text
Status: Partial · 4 of 6 categories entered
```

## 21.2 Summary

Before completion:

```text
Estimated cost   £1,157.50
Actual cost      —
Variance         —
```

After completion:

```text
Estimated cost   £1,157.50
Actual cost      £1,298.20
Variance         +£140.70
Actual margin    19.2%
```

## 21.3 Variance Language

Positive cost variance is usually bad:

```text
+£140.70 over estimate
```

Negative cost variance:

```text
£80.00 under estimate
```

Do not rely on mathematical +/- colour alone.

---

# 22. Empty States

Every module should have deliberate empty states.

## Customers

```text
No customers yet
Add your first customer to create sites, surveys, and estimates.

[Add customer]
```

## Estimates

```text
No estimates match these filters.

[Clear filters]
```

## Backups

```text
No backups have been created yet.
Create a backup before using this system for live commercial work.

[Create first backup]
```

## Actuals

```text
No actual costs recorded.
Add job costs when work begins or after completion.

[Enter actual costs]
```

---

# 23. Loading States

Use skeletons for:

- dashboard table;
- customer detail;
- estimate header;
- rate table.

For calculations:

```text
Calculating price…
```

Disable duplicate submission.

For PDF:

```text
Generating PDF…
```

---

# 24. Save States

Users should always know whether commercial work is saved.

Add a compact state in estimate header:

```text
Saved 20:43
```

or:

```text
Unsaved changes
```

For auto-save:

- debounce form save;
- explicit calculation/save event for pricing;
- never silently issue a quotation.

---

# 25. Confirmation Dialogs

Require confirmation for:

- issue quotation;
- record acceptance;
- mark declined;
- mark expired;
- close;
- create revision from quoted estimate;
- deactivate rate;
- restore backup.

Dialog text must describe business effect.

Example:

```text
Create revision?

A new editable revision will be created from the
quoted estimate. The issued quotation will remain unchanged.

[Cancel] [Create revision]
```

---

# 26. Accessibility

Target WCAG 2.2 AA where practical.

Requirements:

- keyboard navigation;
- visible focus ring;
- labels associated with inputs;
- error text linked to fields;
- minimum 44px touch targets on tablet/mobile;
- sufficient contrast;
- status not conveyed by colour only;
- table headers correctly marked;
- buttons named by action;
- dialogs focus-trapped;
- screen-reader announcements for calculation/save success.

---

# 27. Responsive Strategy

Do not simply scale the desktop UI down.

## Desktop ≥ 1200px

- full navigation;
- multi-column forms;
- full tables;
- estimate summary in one row where readable.

## Tablet 768–1199px

Priority environment for field estimation.

- two-column forms where appropriate;
- action footer sticky;
- tables use fewer columns;
- status + sell + margin stay visible;
- large scope cards;
- navigation may collapse.

## Mobile < 768px

- single-column form;
- horizontal stepper becomes compact progress indicator;
- data tables become cards;
- lifecycle actions in menu;
- sticky bottom primary CTA;
- avoid dense rate administration if possible.

---

# 28. Tablet Estimate Editor

Recommended tablet structure:

```text
Estimate EST-00125
READY TO QUOTE
£3,850 · 31.2%

[3 of 5 · Measurements]

--------------------------------
Measurement fields
--------------------------------

[Back]        [Calculate price]
```

This is more usable on site than trying to preserve every desktop header element.

---

# 29. Design Tokens

Recommended token model:

```css
/* Core */
--color-navy-900
--color-blue-500
--color-orange-500

/* Neutral */
--color-grey-25
--color-grey-50
--color-grey-100
--color-grey-200
--color-grey-500
--color-grey-700

/* Semantic */
--color-success-600
--color-warning-600
--color-danger-600
--color-info-600

/* Radius */
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px

/* Shadow */
--shadow-card
--shadow-popover

/* Spacing */
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
```

Use tokens everywhere. Avoid per-page colour/spacing exceptions.

---

# 30. Component Library

The production UI should standardize these components:

## Navigation

- AppHeader
- UserMenu
- PrimaryNav
- MobileNav

## Data Entry

- TextField
- MoneyField
- NumberWithUnit
- SelectField
- DateField
- Checkbox
- RadioGroup
- TextArea
- RepeatableLineItems

## Commercial

- CurrencyValue
- MarginIndicator
- CommercialSummary
- CostBreakdown
- ApprovalBadge
- OverridePanel

## Status

- StatusChip
- LockBanner
- WarningBanner
- SavedState

## Workflow

- EstimateTabs / Stepper
- ContextActionBar
- LifecycleMenu

## Data

- DataTable
- FilterBar
- FilterChip
- EmptyState
- Pagination

## Overlays

- Drawer
- Modal
- ConfirmationDialog
- Toast

## Documents

- QuotationPreview
- ExportMenu

---

# 31. Microcopy Guidelines

Use business language, not implementation language.

## Replace

`Mark as quoted`

with:

`Issue quotation`

## Replace

`Edit`

with:

`Open`, `Review`, or `Edit draft` depending on state.

## Replace

`Done`

with:

`Back to estimates`

## Replace

`System connected`

with quiet system status outside the business workflow.

## Replace

`Restore replaces the live SQLite database`

with:

> Restoring a backup replaces current application data with the selected backup.

Implementation specifics belong in technical admin documentation.

---

# 32. Commercial Warning Language

Good warning:

> Final sell price is below the 28% target margin. Manager approval is required before issuing this quotation.

Poor warning:

> Invalid margin.

Warnings should explain:

1. what happened;
2. commercial consequence;
3. what the user must do.

---

# 33. Error Prevention

Critical operations should use constraints rather than warnings after the fact.

Examples:

- cannot issue with missing rates;
- cannot issue with required approval pending;
- cannot edit a quoted revision;
- cannot save negative quantities;
- cannot mark actuals complete with required categories missing;
- cannot restore backup without confirmation.

---

# 34. Dashboard Enhancement

Avoid turning the dashboard into a decorative analytics page.

Useful compact operational summaries:

```text
Review required   3
Ready to quote    7
Quoted            12
Accepted          5
```

Then immediately show the work list.

These are action-oriented, not vanity KPIs.

---

# 35. Search UX

Global estimate search should support:

- reference;
- customer;
- site;
- postcode.

Search results should highlight matches where useful.

Persist filters while user opens an estimate and returns.

This is important for office users processing many records.

---

# 36. Rate Administration: Efficiency Enhancements

For production rate maintenance:

- keyboard-friendly editing;
- copy/duplicate rate;
- bulk import later;
- bulk export;
- effective date;
- reason for change;
- compare old/new;
- inactive visibility toggle;
- rate dependencies / usage count later.

Do not add spreadsheet-style inline editing until audit/version behaviour is well-defined.

---

# 37. Quote Revision UX

When a quotation is revised:

```text
Estimate EST-00125
Revision R2

Based on quoted revision R1
Created 08/09/2026 by Alex King
```

Provide history:

```text
R1  Quoted       £3,800   07/09/2026
R2  Draft        £4,050   08/09/2026
```

This helps commercial users understand current vs historical truth.

---

# 38. Customer-Facing vs Internal UI

Maintain a strict separation.

## Internal UI may show:

- cost;
- labour;
- margins;
- approval;
- rate IDs;
- warnings;
- variance.

## Customer-facing outputs may show:

- scope;
- quantity;
- commercial price;
- VAT;
- terms;
- assumptions;
- exclusions;
- acceptance.

Never leak:

- target margin;
- actual margin;
- internal notes;
- rate history.

---

# 39. Footer

The current footer includes:

- fictional company;
- `Local production foundation`;
- phone/email.

`Local production foundation` reads like development/demo metadata and should not appear in a finished production deployment.

Recommended application footer:

```text
© 2026 Company Name
```

Optional:

```text
Support
Privacy
Version (admin only)
```

Company contact information belongs strongly in:

- login;
- quotation/PDF;

but is not necessary on every internal application screen.

---

# 40. Demo vs Production Mode

The project is both a generic product and a marketing/portfolio asset.

Use explicit application modes.

## Demo Mode

Can show:

- demo users;
- fictional seed data;
- version/build badge;
- sample company.

## Production Mode

Must hide:

- demo credentials;
- developer labels;
- sample instructions;
- synthetic-data disclaimers in workflow.

This prevents production UX from looking like a demonstration build.

---

# 41. UX Priority Matrix

## P0 — Commercial Trust / Must Fix

1. **Job actuals: do not treat missing actual costs as £0 / 100% margin.**
2. Ensure quoted/locked estimates are visibly read-only.
3. Remove customer-visible reconciliation/debug text from quotation.
4. Replace free-text customer/site duplication with structured references.
5. Hide demo credentials in production.
6. Remove implementation-specific backup instructions from production UI.
7. Confirm all displayed quote amounts reconcile.
8. Use confirmation for quotation issuance and lifecycle state changes.

## P1 — High-Value Professionalisation

9. Simplify lifecycle action bar.
10. Split Rates from Company/Commercial Settings.
11. Redesign Rate add/history as drawer/panel.
12. Redesign Customers as list → detail → sites/surveys.
13. Formalize status colour/label system.
14. Add explicit save/unsaved state.
15. Improve measurements repeatable-item controls.
16. Improve price-review cost allocation labels.
17. Replace ambiguous labels (`Done`, `Mark as quoted`, generic `Edit`).
18. Locale-aware UK date display.

## P2 — Production Polish

19. Responsive/tablet-specific layouts.
20. User account dropdown.
21. Operational dashboard counts.
22. Active filter chips.
23. Better empty/loading states.
24. Sticky table headers.
25. Accessibility pass.
26. Design-token cleanup.
27. Backup schedule/status UX.
28. Quotation history panel.

## P3 — Advanced Product UX

29. Work-type search/category grouping.
30. Reports workspace.
31. Detailed actual-cost entries.
32. Role-specific dashboards.
33. Bulk rate import/update.
34. Saved filter presets.
35. Offline field-mode design.

---

# 42. Recommended UI/UX Implementation Phases

## Phase 1 — Design-System Foundation

Implement:

- tokens;
- typography;
- spacing;
- buttons;
- form fields;
- status chips;
- banners;
- cards;
- tables;
- dialogs;
- drawers.

Goal:

> stop page-specific styling divergence before deeper redesign.

## Phase 2 — Global Shell

Update:

- header;
- user menu;
- global CTA hierarchy;
- footer;
- container widths;
- responsive navigation.

## Phase 3 — Estimate Editor

Refactor:

- context header;
- workflow tabs;
- lifecycle actions;
- read-only state;
- save indicator;
- status semantics.

This is the highest-value workflow redesign.

## Phase 4 — Estimating Screens

Enhance:

- customer/site selection;
- scope selection;
- repeatable measurements;
- allowance grouping;
- price-review clarity;
- override/approval UX.

## Phase 5 — Quotation & Revision

Implement:

- `Issue quotation`;
- confirmation;
- historical quotation state;
- revision history;
- customer-only preview;
- export hierarchy.

## Phase 6 — Actual Costing

Correct:

- missing-vs-zero semantics;
- completion status;
- variance presentation;
- final margin logic.

## Phase 7 — Customers

Build:

- searchable list;
- customer detail;
- site list;
- survey records;
- estimate relationships.

## Phase 8 — Rates & Settings

Split:

- rate library;
- add/edit drawer;
- rate history panel;
- company settings;
- commercial rules;
- work-type margins.

## Phase 9 — Admin

Improve:

- backup health;
- backup history;
- restore confirmation;
- users/roles;
- system status.

## Phase 10 — Responsive & Accessibility

Test:

- 1440 desktop;
- 1280 laptop;
- 1024 tablet landscape;
- 768 tablet portrait;
- mobile reference sizes;
- keyboard-only;
- high zoom;
- contrast.

---

# 43. Definition of UI/UX Completion

The redesign is successful when a new user can understand the following without training:

1. where to create an estimate;
2. which customer/site is being priced;
3. which work types are included;
4. what measurement is required;
5. what the estimated cost is;
6. what sell price is recommended;
7. whether margin is healthy;
8. whether approval is required;
9. whether a quotation has been issued;
10. whether the current estimate can still be edited;
11. how to create a revision;
12. whether actual job costs have been entered;
13. whether actual margin is final or incomplete;
14. where rates are maintained;
15. how historical rate/quotation data is protected.

---

# 44. Final Design Direction

The product should feel like:

> **a calm, trustworthy commercial operating system for specialist contractors.**

It should not feel like:

- a marketing website;
- a spreadsheet recreated in HTML;
- an engineering console;
- a generic admin template;
- a prototype with all actions exposed at once.

The correct visual character is:

```text
Professional
+ Field-efficient
+ Commercially precise
+ Quietly branded
+ Auditable
+ Consistent
+ Production-safe
```

The current baseline is already strong enough to preserve. The enhancement should therefore be evolutionary rather than a cosmetic rebuild.

The most important design work is not changing colours or adding decoration. It is improving the relationship between:

```text
Estimate workflow
      +
Commercial lifecycle
      +
Permissions
      +
Historical truth
      +
Customer-facing output
      +
Post-job actual data
```

When those relationships are expressed clearly in the interface, the product will look and behave significantly more mature and will be much stronger both for real contractor use and for demonstrating production-level construction software engineering capability.

---

# 45. Recommended Immediate Next Screen Set

Before implementing every recommendation, create one polished vertical UX baseline covering:

1. Estimates dashboard
2. Existing estimate header / context bar
3. Customer & Site
4. Work Scope
5. Measurements
6. Price Review
7. Quotation
8. Quoted locked state
9. Job Actuals

Use this as the master interaction and component baseline.

After those screens are consistent, apply the same design system to:

- Customers;
- Rates;
- Settings;
- Admin.

This minimizes rework and ensures the product's core revenue workflow defines the design system rather than the administrative pages.

---

*End of UI/UX Enhancement Specification*
