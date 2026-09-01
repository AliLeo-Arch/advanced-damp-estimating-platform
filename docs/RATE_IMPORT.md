# Rate CSV Import & Export

Bulk edit rates in Excel before go-live: **export → edit → validate → import**.

## CSV format

Required columns: `code`, `name`, `category`, `cost_per_unit`  
Optional: `unit`, `waste_percent`, `notes`, `active` (`true`/`false`)

Template: `backend/data/rates_import_template.csv`

Categories include: `materials`, `labour`, `travel`, `waste_skip`, `preliminaries`, `sump_package`, and work-type categories from seed data.

## Recommended workflow

1. **Export** current rates to CSV  
2. Edit costs/names in Excel (keep `code` unchanged unless adding new lines)  
3. **Dry-run import** to validate  
4. **Import** live file  
5. Spot-check in **Rates** UI (search by code / category; use pagination if the list is long)  
6. Re-run benchmarks with updated tolerance  

```powershell
.\scripts\export-rates.ps1
# Edit backend\data\rates_export.csv in Excel

.\scripts\import-rates.ps1 backend\data\rates_export.csv -DryRun
.\scripts\import-rates.ps1 backend\data\rates_export.csv
```

## In-app rate table

Owner/admin **Rates** page also supports:

- Debounced text search (code, name, category, unit, notes)
- Category filter and inactive toggle
- Sort and page size
- Inline edit and activate/deactivate

HTTP API for the grid: `docs/API_REFERENCE.md` (`GET /api/rates/`).  
Bulk CSV remains the recommended path for large commercial updates.
## Export

```powershell
.\scripts\export-rates.ps1
.\scripts\export-rates.ps1 -OutputPath "D:\Rates\advanced_damp_live.csv"
.\scripts\export-rates.ps1 -IncludeInactive
```

Default output: `backend/data/rates_export.csv`

## Import rules

- **Upsert by `code`** — existing codes updated; new codes inserted  
- Invalid rows abort the whole import (no partial save)  
- Use **`-DryRun`** to validate without writing  

```powershell
.\scripts\import-rates.ps1 backend\data\rates_import_template.csv -DryRun
.\scripts\import-rates.ps1 path\to\advanced_damp_rates.csv
```

From `backend/`:

```powershell
.\.venv\Scripts\python.exe scripts\export_rates.py
.\.venv\Scripts\python.exe scripts\import_rates.py data\rates_export.csv --dry-run
```

## After rate changes

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\validate_benchmarks.py --tolerance 100
```

Update expected sells in `backend/data/benchmark_jobs.json` once live rates are agreed.

See `docs/HISTORICAL_JOB_VALIDATION.md` for commercial sign-off.
