# Acceptance Test Scenarios

Use these scenarios before calling the platform commercially production-ready. They map to section 58 of the production blueprint.

**Automated seed scenarios:** DEMO-01 … DEMO-05 in `backend/data/sample_seed.json` are validated by `pytest` and `scripts/validate_benchmarks.py`.

**Real historical jobs:** add to `backend/data/benchmark_jobs.json` and re-run validation after live rates are loaded.

---

## Scenario A — DPC & replastering

**Seed reference:** DEMO-01 (Bromley rising damp + extractor)

| Step | Action | Expected |
|---|---|---|
| 1 | Create estimate with 12 lm DPC, 1.2 m replaster + 1 extractor | Priced without errors |
| 2 | Review internal summary | Waste, travel, prelims visible |
| 3 | Check sell vs seed benchmark | ~£2,152.67 ex VAT (±£1 on seed rates) |
| 4 | Download PDF | Line amounts sum to subtotal; no cost/margin shown |

---

## Scenario B — Cavity drain + pump

**Seed reference:** DEMO-02 (Greenwich basement package)

| Step | Action | Expected |
|---|---|---|
| 1 | 48 m² wall + 22 m² floor membrane, battens, boarding, channel | Membrane + labour calculated |
| 2 | Twin sump package + battery + alarm | Package pricing applied |
| 3 | Builder's skip + London prelims | Job-level costs allocated to lines |
| 4 | Sell benchmark | ~£13,152.65 ex VAT (±£1 on seed rates) |

---

## Scenario C — Timber treatment

**Seed reference:** DEMO-03 (Tunbridge Wells wet rot)

| Step | Action | Expected |
|---|---|---|
| 1 | 28 m² treatment + 4 joist repairs + 6 m² floor renewal | Timber pricer runs |
| 2 | Band 2 travel + restricted access prelim | Travel £120 band applied |
| 3 | Sell benchmark | ~£2,351.46 ex VAT |

---

## Scenario D — Ventilation (multi-unit)

**Seed reference:** DEMO-04 (Hackney PIV + 2 extractors)

| Step | Action | Expected |
|---|---|---|
| 1 | 1× PIV + 2× bathroom extractors with install | Multi-line ventilation quote |
| 2 | 28% ventilation margin | Margin at target (unless min job applies) |
| 3 | Sell benchmark | ~£1,607.64 ex VAT |

---

## Scenario E — Minimum job value

**Seed reference:** DEMO-05 (small localised DPC)

| Step | Action | Expected |
|---|---|---|
| 1 | 2.5 lm DPC only | Calculated sell below £750 |
| 2 | Price review | Final sell lifted to **£750.00** |
| 3 | Internal summary | `min_job_applied` flag shown |

---

## Scenario F — Difficult London access

**Manual test** (extend DEMO-02 or create historical job):

- Parking, ULEZ/congestion, protection, carrying/access prelims selected
- Prelim costs appear in breakdown and allocate to work lines

---

## Scenario G — Override & approval

| Step | Action | Expected |
|---|---|---|
| 1 | Override sell downward with reason | Status → `review_required` |
| 2 | Surveyor cannot mark quoted | Blocked until approval |
| 3 | Owner/admin approves | Status → `approved` / `ready_to_quote` |
| 4 | Margin below minimum permitted (20%) | Quotation blocked |

---

## Scenario H — Rate update (historical snapshot)

| Step | Action | Expected |
|---|---|---|
| 1 | Issue quotation for estimate A | PDF stored with line amounts |
| 2 | Change a rate in **Rates** | New rate active |
| 3 | Create new estimate B with same measurements | Uses new rate |
| 4 | Re-open estimate A PDF | Amounts unchanged from issue time |

---

## Scenario I — Quotation revision

| Step | Action | Expected |
|---|---|---|
| 1 | Mark estimate quoted | Locked for edit |
| 2 | Create revision R2 | Reference `AD-00001-R2` |
| 3 | Modify scope on R2 | Original R1 still accessible |

---

## Scenario J — Actual cost variance

| Step | Action | Expected |
|---|---|---|
| 1 | Mark estimate accepted | Job actuals step available |
| 2 | Enter actual materials/labour | Variance table populated |
| 3 | Accounts edits actuals | Permission enforced |

---

## Scenario K — Demo seed estimates

| Step | Action | Expected |
|---|---|---|
| 1 | Fresh DB / restart backend | `AD-DEMO-01`, `AD-DEMO-04`, `AD-DEMO-05` appear on Estimates |
| 2 | Open `AD-DEMO-01` | Ready to quote; sell ~£2,152.67 on seed rates |
| 3 | Open `AD-DEMO-05` | Min job applied; sell £750.00 |

---

## Scenario L — Estimate search, pagination & list export

| Step | Action | Expected |
|---|---|---|
| 1 | Search `Greenfield` on Estimates | Matching cards only |
| 2 | Filter status **Accepted** | List narrows; URL contains `status=` |
| 3 | Change per page to 10; add enough estimates | Previous / Next appear |
| 4 | Export results (CSV) | File contains filtered rows |

---

## Scenario M — Quotation multi-format export & rate table

| Step | Action | Expected |
|---|---|---|
| 1 | On `AD-DEMO-01` Quotation step | Export control shows PDF / CSV / Excel |
| 2 | Download CSV and Excel | Files open; Excel has Quotation + Internal sheets |
| 3 | Rates → search a known code | Matching row on current page |
| 4 | Change category / sort / page size | Table updates without full-page reload of unrelated data |

---

## Run automated checks

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/ -q
.\.venv\Scripts\python.exe scripts/validate_benchmarks.py
```

Or full delivery pack:

```powershell
.\scripts\verify-delivery.ps1
```

For real historical jobs after live rates are loaded:

```powershell
.\.venv\Scripts\python.exe scripts/validate_benchmarks.py --tolerance 100
```

See `docs/HISTORICAL_JOB_VALIDATION.md` for the sign-off worksheet.  
See `docs/CHANGELOG.md` for feature details.