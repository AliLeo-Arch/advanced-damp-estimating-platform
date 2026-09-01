# Advanced Damp Estimating — User Guide (Local Production)

For surveyors and office staff using the estimating tool day to day.

## Sign in

Use your Advanced Damp email and password. Demo accounts are listed in `docs/LOCAL_PRODUCTION_ASSUMPTIONS.md` for local testing.

After sign-in you land on **Estimates**. If you are already signed in and open `/login`, you are redirected to the dashboard.

## Find an estimate (search & filters)

On the **Estimates** dashboard:

1. Type in **Search** — matches reference, customer, site, postcode, surveyor, notes (results update as you type)
2. Click **status chips** to filter (e.g. Ready to quote, Quoted, Accepted)
3. Use **Sort by** and **Per page** as needed
4. Open **Advanced filters** for surveyor name, survey date range, and min/max sell price
5. Use **Previous / Next** when there is more than one page
6. **Export results (CSV)** downloads the filtered list (not just the current page)
7. **Clear all** removes filters

Filters are stored in the browser URL — you can bookmark or share a search.

### Demo estimates (local testing)

On a fresh database you should see seeded demo estimates such as:

| Reference | Purpose |
|---|---|
| `AD-DEMO-01` | Full DPC job — ready to quote / PDF |
| `AD-DEMO-05` | Minimum job (£750) example |
| `AD-DEMO-04` | Mid-size ventilation example |

Open one to walk through price review and quotation without creating data from scratch.

## Create an estimate

1. **Estimates → New estimate**
2. **Customer & site** — enter or confirm details (prefilled if opened from a survey)
3. **Work scope** — select treatment types found on site
4. **Measurements** — enter survey quantities
5. **Price review** — check cost, sell, margin; override only with a reason
6. **Quotation** — preview and download

The step strip at the top is **clickable** once a step is available — use it to jump back to an earlier step.

### Command bar

When an estimate is open, the top bar shows:

- Status (and revision number)
- Sell price and margin
- Actions grouped by purpose: **Quotation**, **Revision**, **Approval**, **Post-job**

## Quotation downloads

On the **Quotation** step, use the **Export** control:

| Format | Use for |
|---|---|
| **PDF** | Customer-facing branded quotation |
| **CSV** | Spreadsheet / email attachment of quote lines |
| **Excel** | Quotation sheet + internal cost/margin sheet |

Then **Mark as quoted** when the customer has received the quotation.

## From a survey

**Customers → select customer → site → survey → New estimate** opens the editor with customer/site details prefilled.

## Mobile / tablet

Use the menu (top right on phone) for navigation. Forms stack in one column; primary actions stay at the bottom of long steps.

## Overrides and approval

If you override the sell price or margin is below target, the estimate moves to **review required**. A manager (owner/admin) must **Approve for quotation** before the customer PDF (or CSV/Excel export) can be issued.

## After quoting

- **Mark as quoted** when the customer receives the quotation
- **Mark as accepted** when they proceed
- **Create revision** if commercial changes are needed after lock
- **Job actuals** — enter actual job costs after completion (accounts/owner/admin can edit; others can view variance)

## Need help?

Contact your office administrator or commercial manager for rates, margins, and quotation wording changes. See also `docs/CHANGELOG.md` for recent features.
