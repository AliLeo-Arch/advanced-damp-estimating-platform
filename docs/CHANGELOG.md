# Changelog — Advanced Damp Estimating Platform

**Current version:** 1.0.0-local-prod  
**Document date:** 31 August 2026

This changelog covers post–foundation enhancements delivered after Phases A–G. For phase completion status, see `docs/IMPLEMENTATION_STATUS.md`.

---

## 1.0.0-local-prod — UX & operational polish (August 2026)

### Demo estimates for testing

On first database init (and whenever demo references are missing), three priced estimates are seeded from `backend/data/sample_seed.json`:

| Reference | Customer | Status | Notes |
|---|---|---|---|
| `AD-DEMO-01` | Mrs Helen Carter | Ready to quote | Bromley DPC scenario (DEMO-01) |
| `AD-DEMO-05` | Mr David Patel | Priced | Minimum job £750 (DEMO-05) |
| `AD-DEMO-04` | Greenfield Lettings Ltd | Priced | Ventilation mid-size (DEMO-04) |

Seeding is idempotent by reference — existing user estimates are not overwritten.

### Estimate exports

| Format | Where | Contents |
|---|---|---|
| PDF | Quotation step | Branded customer quotation |
| CSV | Quotation step | Quotation lines + VAT totals |
| Excel (`.xlsx`) | Quotation step | Sheet 1: Quotation · Sheet 2: Internal costs/margins |
| CSV list | Estimates dashboard | Filtered list of estimates |

Excel export requires `openpyxl` (listed in `backend/requirements.txt`).

### Estimates dashboard — advanced search & pagination

- Text by reference, customer, company, site, postcode, surveyor, notes
- Filter by status (multi-select chips), surveyor, survey date range, sell price range
- Sort and page size (10 / 20 / 50)
- URL-persisted filters (bookmarkable)
- CSV export respects active filters

### Rate table — search, sort & pagination

- Server-side search across code, name, category, unit, notes
- Category filter, inactive toggle, sort options
- Paginated data grid (default 25 / page)
- Sticky header, category pills, inline edit row
- Collapsible “Add rate” form

### Estimate editor UX

- Command bar with status, sell, margin, and grouped actions
- Clickable workflow stepper (jump between accessible steps)
- Segmented PDF / CSV / Excel export on quotation
- Colour-coded status pills

### Auth & loading

- Guest-only login redirect when already signed in
- Session validation via `/api/auth/me` on boot
- Shared loading skeletons and loading buttons

### Automated tests

`.\scripts\verify-delivery.ps1` now expects **34 tests** (was 26), including:

- `test_estimate_export.py` — CSV list / filename helpers
- `test_estimate_search.py` — estimate search & pagination
- `test_rate_search.py` — rate search & pagination

Plus **6 benchmark scenarios** unchanged.

---

## Earlier foundation (Phases A–G)

Auth/JWT, CRM, rate admin, pricing engine, lifecycle/approvals/revisions, quotation PDF, job actuals, backups, logging, health, admin UI, mobile UX, rate CSV import/export, production single-port mode.

See `docs/CLIENT_HANDOFF.md` and `docs/IMPLEMENTATION_STATUS.md`.
