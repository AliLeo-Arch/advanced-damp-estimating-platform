# Security Notes — Local Production Deployment

Review date: August 2026  
Scope: FastAPI backend + React frontend, office LAN deployment

This is a **local/company-controlled** system, not internet-hardened SaaS. Findings below assume deployment on a trusted office network unless otherwise noted.

---

## Summary

| Severity | Count | Notes |
|---|---:|---|
| High (fix before live) | 2 | Default secrets/passwords |
| Medium (accept or mitigate) | 2 | PDF token in URL, CORS |
| Low / informational | 4 | Health endpoint, logging, SQLite file ACLs |

**No SQL injection issues found** — SQLAlchemy ORM used throughout; backup filenames validated against path traversal.

---

## High — fix before live use

### H1 — Default JWT secret

**Location:** `backend/app/config.py`, `backend/.env.example`

Default `JWT_SECRET` is documented and logged at startup if unchanged. Anyone with the default can forge tokens.

**Mitigation:** Copy `backend/.env.example` → `backend/.env`, set a long random secret (32+ chars). Restart backend.

### H2 — Default demo passwords

**Location:** `backend/app/seed_users.py`, `docs/LOCAL_PRODUCTION_ASSUMPTIONS.md`

Seed users ship with known passwords for local testing.

**Mitigation:** Change all passwords before staff use; create real accounts; disable unused demo users in the database.

---

## Medium — accept or mitigate

### M1 — JWT passed in query string for PDF download

**Location:** `backend/app/auth.py:109-122`, `frontend/src/api.ts` (`quotationPdfUrl`)

Browser PDF links use `?access_token=` because `<a href>` cannot send `Authorization` headers. Tokens may appear in server access logs, browser history, and referrer headers.

**Mitigation (local):** Acceptable on office LAN with short JWT expiry (12 h default). Prefer opening PDF from in-app preview where possible. `Referrer-Policy: no-referrer` response header added to reduce leakage.

**Future:** Short-lived download tokens scoped to a single estimate.

### M2 — Login rate limiting (in-process)

**Location:** `backend/app/login_throttle.py`, `backend/app/routers/auth.py`

Failed logins are throttled in-process (8 failures / 15 minutes → 15-minute lockout per IP+email). Resets on successful login. Suitable for a single office API process; not a distributed rate limiter.

**Mitigation (local):** Keep binding to office LAN. For multi-process or internet-facing deploy, add reverse-proxy rate limiting as well.

### M3 — CORS configuration

**Location:** `backend/app/main.py`, `backend/.env.example`

Dev defaults allow Vite origins. Production can set `CORS_ORIGINS` and optional Vercel preview regex. When `SERVE_FRONTEND=true`, UI and API share port 8000 — no CORS issue.

---

## Low / informational

### L1 — `/health` is unauthenticated

Returns version and DB status. Low risk on LAN; do not expose publicly without auth.

### L2 — SQLite database file on disk

**Location:** `backend/data/trade_estimating_local_prod.db`

File-system access = full data access. Restrict folder permissions to admin/owner OS accounts.

### L3 — Backup restore is destructive

**Location:** `backend/app/backup.py`, Admin UI

Requires `backup` permission; pre-restore safety copy created. Restart backend after restore.

### L4 — Audit log retention

Audit events written to DB; no automatic purge. Plan retention with client.

---

## Permission model (verified)

| Route group | Auth |
|---|---|
| Estimates, CRM, rates (read) | JWT required |
| Rates/settings write | `manage_rates` / `manage_settings` |
| Approve override | `approve_override` |
| Actuals edit | `manage_actuals` |
| Admin backup | `backup` |
| Login | Public |

Admin role receives all permissions in `ROLE_PERMISSIONS`.

---

## Pre-go-live security checklist

- [ ] `JWT_SECRET` set in `backend/.env` (not default)
- [ ] All demo passwords changed
- [ ] Backend not exposed to public internet without VPN/firewall
- [ ] `backend/data/` folder permissions restricted on target PC
- [ ] `.env` and `*.db` not committed to git (see `.gitignore`)
- [ ] Backup copies stored off-machine
- [ ] CORS updated if frontend served from production URL

See also `docs/ADMIN_GUIDE.md` and `docs/RELEASE_CHECKLIST.md`.
