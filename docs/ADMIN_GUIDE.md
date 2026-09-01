# Advanced Damp Estimating — Admin Guide (Local Production)

For owner/admin users managing commercial settings, backups, and users.

## Roles

| Role | Typical use |
|---|---|
| Admin | Full access including backup |
| Owner | Rates, settings, approvals, backup |
| Surveyor | Estimates, customers, overrides |
| Office | Estimates, customers |
| Accounts | Actual costs, audit view |

See `docs/LOCAL_PRODUCTION_ASSUMPTIONS.md` for demo credentials.

## Rates & commercial settings

**Rates** (nav) — owner/admin only:

### Commercial settings (top of page)

- Edit target margins, minimum job, VAT, payment terms, survey fee

### Rate table (optimised grid)

- **Search** — code, name, category, unit, notes (debounced)
- **Category** filter and **Show inactive**
- **Sort** and **Per page** (10 / 25 / 50 / 100)
- Paginated results with sticky column headers
- **Edit** expands an inline form under the row
- **Activate / Deactivate** without leaving the grid
- **Add rate** — toggle the create form above the table

Assumed seed rates are placeholders until Advanced Damp supplies live costs.

### Bulk edit via CSV

See `docs/RATE_IMPORT.md`:

```powershell
.\scripts\export-rates.ps1
.\scripts\import-rates.ps1 backend\data\rates_export.csv -DryRun
```

After import, use the Rate table search to spot-check codes and costs.

## Estimates — search, export, demos

Staff can search and paginate estimates on the dashboard (see `docs/USER_GUIDE.md`).

**Exports available:**

- Dashboard: filtered estimate list as CSV
- Quotation step: PDF, CSV, Excel (`.xlsx` with Quotation + Internal sheets)

**Demo estimates** (`AD-DEMO-01`, `AD-DEMO-04`, `AD-DEMO-05`) are seeded for walkthrough testing. They do not replace live CRM data.

API details: `docs/API_REFERENCE.md`.

## User passwords

Reset from PowerShell (requires access to the office PC / database):

```powershell
.\scripts\reset-password.ps1 admin@advanceddamp.co.uk "NewSecurePassword1!"
```

Change all demo passwords before staff use.

## Quotation wording

Default assumptions, exclusions, guarantee, survey-fee credit, and acceptance text are stored in pricing settings (seeded on first run). Update via database or future settings UI; PDF pulls from these fields.

## Backups

### From the app

**Admin** page (owner/admin):

- **Create backup** — copies SQLite DB to `backend/data/backups/`
- **Download** — save a copy off the machine
- **Restore** — replaces live DB (creates a pre-restore safety copy first). **Restart the backend** after restore.

### From PowerShell

```powershell
.\scripts\backup.ps1
.\scripts\restore.ps1 advanced_damp-YYYYMMDD-HHMMSS.db
```

### Policy (recommended)

- Daily backup while in active use
- Keep copies on a second company-controlled location
- Test restore monthly

## Logs

Application log: `backend/data/logs/app.log`  
Unhandled API errors are logged with stack traces.

## Health check

`GET /health` returns app version, environment, and database connectivity. Dashboard shows **connected** when status is ok.

## Security notes (local deployment)

- Change default JWT secret and user passwords before live use
- Run backend on office LAN only unless hardened for remote access
- Do not commit `.env` or database files to git

## Release

Follow `docs/RELEASE_CHECKLIST.md` before calling the deployment production-ready.  
Recent feature list: `docs/CHANGELOG.md`.
