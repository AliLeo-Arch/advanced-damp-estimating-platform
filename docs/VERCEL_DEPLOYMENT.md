# Vercel Deployment Guide

This project can run as **two Vercel projects** (frontend + backend API).

> **Important:** SQLite on Vercel uses `/tmp` and is **ephemeral** (data can reset between cold starts). Fine for demos; for lasting production data use Postgres (`DATABASE_URL`).

---

## 1. Backend project

1. In Vercel → **Add New Project** → import the GitHub repo.
2. Set **Root Directory** to `backend`.
3. Framework: Other / no framework.
4. Environment variables:

| Name | Value |
|---|---|
| `JWT_SECRET` | Long random secret (required) |
| `CORS_ORIGINS` | Your frontend URL, e.g. `https://advanced-damp-estimating-platform.vercel.app` |
| `CORS_ALLOW_VERCEL_PREVIEWS` | `true` (optional; allows `*.vercel.app`) |
| `DATABASE_URL` | Optional. Default on Vercel: `sqlite:////tmp/advanced_damp_prod.db` |

5. Deploy. Note the backend URL, e.g. `https://advanced-damp-api.vercel.app`.
6. Smoke-test: open `https://YOUR-BACKEND.vercel.app/health` — should return JSON with `"status":"ok"`.

---

## 2. Frontend project

1. **Add New Project** → same repo.
2. Set **Root Directory** to `frontend`.
3. Framework: Vite. Build command `npm run build`, output `dist`.
4. Environment variables:

| Name | Value |
|---|---|
| `VITE_API_URL` | Backend URL from step 1, **no trailing slash** |

5. Redeploy after setting `VITE_API_URL` (Vite embeds env at build time).

---

## 3. CORS checklist

Backend `CORS_ORIGINS` must include the exact frontend origin (scheme + host, no path).

Example:

```
CORS_ORIGINS=https://advanced-damp-estimating-platform.vercel.app,http://localhost:5173
```

---

## 4. Why the serverless function crashed

Typical causes before this fix:

- No Python entrypoint (`api/index.py`) / wrong Root Directory
- SQLite path under a read-only directory (`backend/data/...` is not writable on Vercel)
- File logging to a non-writable path
- Frontend calling `/api/...` on the static host instead of the API project

---

## 5. Demo sign-in (after healthy `/health`)

| Role | Email | Password |
|---|---|---|
| Surveyor | james.whitaker@advanceddamp.co.uk | Surveyor1! |
| Owner | owner@advanceddamp.co.uk | OwnerDamp1! |

Change passwords and `JWT_SECRET` before real use.

---

## 6. Local still works

```powershell
.\scripts\start-local.ps1
```

Leave `VITE_API_URL` empty locally so Vite proxies `/api` and `/health` to port 8000.
