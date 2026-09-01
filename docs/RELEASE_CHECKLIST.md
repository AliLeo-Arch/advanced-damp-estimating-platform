# Local Production Release Checklist

Version: **1.0.0-local-prod**  
Use before handing off to Advanced Damp for live commercial use.

## Environment

- [ ] Production database created (`backend/data/advanced_damp_local_prod.db`)
- [ ] Default admin password changed
- [ ] Real user accounts created (surveyor, office, owner)
- [ ] JWT secret changed from default (`backend/app/config.py` or env)
- [ ] Backend and frontend start cleanly on target PC

## Commercial data

- [ ] Real rates imported / verified in **Rates**
- [ ] Work-type target margins confirmed
- [ ] Travel rules confirmed
- [ ] Waste/skip rules confirmed
- [ ] Minimum job value confirmed (£750 assumed)
- [ ] Payment terms confirmed
- [ ] Assumptions / exclusions / guarantee wording approved
- [ ] VAT rate confirmed (20%)

## Functional validation

- [ ] End-to-end estimate on phone-width viewport
- [ ] Survey → estimate prefill works
- [ ] Override → review → approve → quote flow works
- [ ] PDF line amounts reconcile to subtotal
- [ ] CSV and Excel quotation downloads open correctly
- [ ] Estimates search / status filter / pagination work
- [ ] Rate table search / sort / pagination work (owner/admin)
- [ ] Demo estimates (`AD-DEMO-*`) available for walkthrough (optional after live data)
- [ ] Quoted → accepted → job actuals variance works
- [ ] Permissions tested per role
- [ ] Audit events recorded on create/update/approve/backup

## Backup & ops

- [ ] Backup created (`Admin` or `scripts/backup.ps1`)
- [ ] Restore tested (`scripts/restore.ps1` or Admin restore + backend restart)
- [ ] Log file writing to `backend/data/logs/app.log`
- [ ] `/health` returns `database_ok: true`

## Documentation

- [ ] `docs/USER_GUIDE.md` provided to staff
- [ ] `docs/ADMIN_GUIDE.md` provided to owner/admin
- [ ] `docs/CHANGELOG.md` reviewed for recent features
- [ ] `docs/LOCAL_PRODUCTION_ASSUMPTIONS.md` reviewed and updated
## Historical validation (before go-live)

- [ ] 5–10 past jobs re-estimated within agreed commercial tolerance
- [ ] Scenarios added to `backend/data/benchmark_jobs.json` (template provided)
- [ ] `scripts/validate_benchmarks.py` passes with live rates
- [ ] Advanced Damp sign-off on sample PDFs

## Automated tests (developer)

```powershell
.\scripts\verify-delivery.ps1
```

Or manually:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/ -q
```

Expected: all tests pass (**34** on seed data as of August 2026 — see `docs/CHANGELOG.md`).
