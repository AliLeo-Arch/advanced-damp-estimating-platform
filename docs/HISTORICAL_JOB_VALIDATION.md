# Historical Job Validation

Before go-live, Advanced Damp should re-estimate **5–10 real issued jobs** and compare against agreed commercial pricing. Seed/demo scenarios prove the engine works; this step proves **live rates and policy** match how the company actually quotes.

## Tolerance policy (recommended)

| Comparison | Suggested tolerance |
|---|---|
| Seed demo scenarios (automated) | ±£1.00 ex VAT |
| Real historical jobs (initial pass) | ±3–5% or ±£50–£200 (agree with owner) |
| After sign-off | Zero drift on re-run unless rates intentionally changed |

Document the agreed tolerance in writing before validation starts.

---

## Worksheet (copy per job)

| Field | Value |
|---|---|
| Historical reference | e.g. AD-00421 |
| Survey date | |
| Work types | |
| Validator | |
| Date validated | |

### Measurements entered

Paste or summarise the measurements used (wall lengths, areas, packages, prelims, travel band).

### Results

| Metric | Historical issued | New engine | Variance | Within tolerance? |
|---|---:|---:|---:|---|
| Sell ex VAT | | | | |
| Materials cost (internal) | | | | |
| Labour cost (internal) | | | | |
| Margin % | | | | |

### Notes / reasons for variance

- Rate changes since original quote
- Scope difference
- Rounding or minimum job rule
- Manual discount on original

### Sign-off

| Role | Name | Date | Approved |
|---|---|---|---|
| Commercial owner | | | ☐ |
| Surveyor | | | ☐ |

---

## Adding jobs to automated validation

1. Open `backend/data/benchmark_jobs.json`
2. Add a scenario under `scenarios` with the same shape as `demo_scenarios` in `sample_seed.json`
3. Set `expect.sell_price` to the agreed historical sell (or `min_sell` / `max_sell` range)
4. Run:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts/validate_benchmarks.py --tolerance 100
```

Example entry:

```json
{
  "id": "HIST-00421",
  "title": "Mrs Smith — Bromley DPC 2025",
  "reference": "AD-00421",
  "travel_band": "TRV-LOCAL",
  "waste": "WS-ALLOW-SMALL",
  "preliminaries": ["PRE-STD", "PRE-ULEZ"],
  "work_items": [
    {
      "work_type": "dpc_replastering",
      "walls": 1,
      "wall_length_lm": 10.5,
      "replaster_height_m": 1.2
    }
  ],
  "expect": {
    "sell_price": 1845.00
  }
}
```

---

## Current seed benchmarks (illustrative rates only)

| ID | Title | Expected sell (ex VAT) |
|---|---|---:|
| DEMO-01 | Rising damp + ventilation | £2,152.67 |
| DEMO-02 | Cavity drain + twin sump | £13,152.65 |
| DEMO-03 | Timber treatment | £2,351.46 |
| DEMO-04 | PIV + extractors | £1,607.64 |
| DEMO-05 | Minimum job floor | £750.00 |

These values **will change** when real Advanced Damp rates replace seed data. Re-run `validate_benchmarks.py` after rate import and update expected figures.

---

## Gate

Do not mark the platform production-ready until:

- [ ] 5–10 historical jobs validated within agreed tolerance
- [ ] Variances explained and accepted by commercial owner
- [ ] Sample PDFs signed off
- [ ] Live rates loaded (not seed placeholders)

See also `docs/RELEASE_CHECKLIST.md` and `docs/ACCEPTANCE_TEST_SCENARIOS.md`.
