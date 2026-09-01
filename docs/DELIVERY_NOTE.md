# Delivery Note — Advanced Damp Estimating Platform

**Version:** 1.0.0-local-prod  
**Date:** August 2026  
**For:** Advanced Damp Ltd (Ali)

---

## Summary

The **local production estimating foundation** is complete and ready for your review. This builds on the original POC into a full office-deployable system: CRM, estimating, commercial controls, quotation PDF/CSV/Excel, searchable estimates and rates, job actuals, rate admin, backups, and mobile-friendly UI.

The software runs on a **Windows office PC** (no cloud required). Sample commercial rates are included for testing — **live rates and sign-off are the remaining steps before day-to-day commercial use.**

---

## What to do first

1. Read **`docs/CLIENT_HANDOFF.md`** (main handoff document)  
2. Run setup on your PC (Python + Node.js — steps in handoff doc)  
3. Start the app:
   ```powershell
   .\scripts\start-production.ps1
   ```
4. Sign in as **owner** (`owner@advanceddamp.co.uk` / `OwnerDamp1!`)  
5. Open seeded estimate **AD-DEMO-01** (or create one) and walk through price review → quotation → PDF / CSV / Excel

---

## Verify installation

```powershell
.\scripts\verify-delivery.ps1
```

Expected: all checks pass (**34 tests** + 6 pricing benchmarks).

---

## Before staff use (important)

| Action | How |
|---|---|
| Change all passwords | `.\scripts\reset-password.ps1 email "NewPassword1!"` |
| Set JWT secret | Edit `backend/.env` (copy from `.env.example`) |
| Load real rates | Export → edit Excel → import (see `docs/RATE_IMPORT.md`) |
| Test backup | Admin page or `.\scripts\backup.ps1` |

---

## Go-live checklist

Complete **`docs/RELEASE_CHECKLIST.md`**, including:

- Real rates imported  
- 5–10 historical jobs validated (`docs/HISTORICAL_JOB_VALIDATION.md`)  
- Sample PDFs approved  
- Backup + restore tested on your PC  

---

## Documentation provided

| Document | Who it's for |
|---|---|
| `docs/CLIENT_HANDOFF.md` | You / office manager — **start here** |
| `docs/CHANGELOG.md` | What was added after foundation (search, exports, rates UI) |
| `docs/USER_GUIDE.md` | Surveyors and office staff |
| `docs/ADMIN_GUIDE.md` | Owner / admin (rates, backups, security) |
| `docs/API_REFERENCE.md` | Developer / IT — search & export endpoints |
| `docs/SCRIPTS_REFERENCE.md` | Quick command reference |
| `docs/RELEASE_CHECKLIST.md` | Go-live sign-off |
| `docs/IMPLEMENTATION_STATUS.md` | What's built vs what you still need to supply |

---

## Demo accounts (change passwords before live use)

| Role | Email | Password |
|---|---|---|
| Admin | admin@advanceddamp.co.uk | AdvancedDamp1! |
| Owner | owner@advanceddamp.co.uk | OwnerDamp1! |
| Surveyor | james.whitaker@advanceddamp.co.uk | Surveyor1! |
| Office | office@advanceddamp.co.uk | OfficeDamp1! |

---

## Out of scope (v1 — can be added later)

- Cloud hosting / remote multi-office sync  
- Full job scheduling or accounting integration  
- Customer e-signature portal  
- Rate history / effective-dated versions  

---

## Suggested next engagement (optional)

Once you have supplied live rates and sample historical quotations, a short follow-up pass can:

1. Import and tune live commercial data  
2. Validate 5–10 real jobs against issued quotes  
3. Adjust PDF wording and margins to your sign-off  
4. Train staff on-site or via screen share  

---

## Sign-off

Please confirm receipt and whether the install + walkthrough on your PC is successful. Acceptance can be recorded in the sign-off section of `docs/CLIENT_HANDOFF.md`.

---

*Advanced Damp Estimating · Local Production Foundation · v1.0.0-local-prod*
