# Local Production Assumptions

Assumed credentials for local development (replace in real deployment):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@northbridge-demo.example` | `DemoAdmin1!` |
| Owner | `owner@northbridge-demo.example` | `DemoOwner1!` |
| Surveyor | `james.whitaker@northbridge-demo.example` | `Surveyor1!` |
| Office | `office@northbridge-demo.example` | `DemoOffice1!` |

## Assumed commercial defaults (Phase B)

These are professional UK placeholders until the deploying contractor supplies live policy. Editable in **Rates** (owner/admin):

| Setting | Assumed value |
|---|---|
| Survey fee | **£195** (creditable against works) |
| Minimum job value | **£750** |
| Minimum permitted margin | **20%** |
| Quote validity | **30 days** |
| VAT | **20%** |
| Payment terms | 50% deposit on acceptance; balance due on completion |

### Target margins by work type (assumed)

| Work type | Target margin |
|---|---|
| Injection treatment & replastering | 35% |
| Membrane waterproofing | 32% |
| Pump / drainage package | 30% |
| Timber remedial treatment | 33% |
| Ventilation equipment | 34% |

Material / labour / travel / waste / prelim rate lines are seeded from `backend/data/sample_seed.json` (illustrative costs — replace via Rates UI).

### Deferred (still Phase B backlog)

- Effective-dated rate versions (history of cost changes over time)

## Job-level allowance policy (Phase C — assumed)

**Option A — allocate by direct cost weight** (assumed until the deploying contractor confirms):

1. Price each work type on materials + labour only.  
2. Allocate waste / travel / preliminaries across work lines by each line’s share of direct cost.  
3. Apply that work type’s target margin to (direct + allocated job cost).  
4. Job sell = sum of line sells; then apply minimum job value / sell override.  
5. Reconcile line sells so they always sum **exactly** to the final job sell (PDF-safe).

## Commercial control (Phase D — assumed)

Lifecycle: `draft → priced | review_required → approved → ready_to_quote → quoted → accepted | declined | expired → closed`

Approval rules (assumed):

- Sell-price override → `review_required` (owner/admin must approve)
- Actual margin below target → `review_required`
- Margin below minimum permitted (default 20%) → quotation blocked until sell is raised
- Quoted / accepted / declined / expired / closed estimates are **locked**; use **Create revision** (`EST-00001-R2`) to continue

## Quotation / PDF (Phase E — assumed)

- Issue date + validity date (default validity **30 days**)
- VAT rate snapshotted when marked **quoted**
- Work-type line amounts always reconcile to subtotal
- Configurable terms: payment, assumptions, exclusions, guarantee, survey-fee credit, acceptance
- PDF filename: `EST-00001-Mrs-Smith-Quotation.pdf`
- No cost/margin leakage on customer PDF

## Actual cost (Phase F — assumed)

Available when estimate is **quoted**, **accepted**, or **closed**:

- Enter actual materials, labour, waste, travel, prelims, other
- Revenue defaults to quoted sell (optional override)
- Variance table: estimated vs actual vs variance for cost, revenue, margin £/%
- Editable by owner/admin/accounts (`manage_actuals` permission)

Database file: `backend/data/trade_estimating_local_prod.db`

## Production hardening (Phase G / product Phase 8 — assumed)

- **Backups:** Online SQLite backups in `backend/data/backups/` (`trade_estimating-YYYYMMDD-HHMMSS.db`); auto-prunes to latest 30
- **Pre-restore safety copy:** created automatically before any restore
- **Admin UI / API:** owner/admin with `backup` permission (`/admin` page or `POST /api/admin/backups`)
- **PowerShell:** `scripts/backup.ps1`, `scripts/restore.ps1`, `scripts/register-daily-backup.ps1`
- **Logs:** `backend/data/logs/app.log` (rotating)
- **Login throttle:** in-process lockout after repeated failed logins
- **Health:** `GET /health` returns version, environment, `database_ok`
- **Policy:** daily backup while in use; test restore monthly; keep off-machine copies
