# Screenshot kit (standalone)

Separate Playwright utility for capturing **Trade Estimating & Quoting** product screenshots.

Not imported by `frontend/` or `backend/`. Safe to delete without affecting the app.

## Prerequisites

1. Backend on port `8000`
2. Frontend Vite on `5173` or `5174` (or set `BASE_URL`)
3. Seeded demo users/data
4. Google Chrome or Microsoft Edge installed

## Setup (once)

```powershell
cd tools\screenshot-kit
npm install
```

Bundled Chromium download is optional. The kit defaults to the system Chrome channel (`BROWSER_CHANNEL=chrome`).

## Capture

```powershell
# From repo root (recommended)
.\tools\screenshot-kit\run-capture.ps1

# Or manually
cd tools\screenshot-kit
$env:BASE_URL = "http://localhost:5174"
$env:BROWSER_CHANNEL = "chrome"
node src/capture.mjs
```

Screenshots are written to:

- `tools/screenshot-kit/output/` (working copy, gitignored)
- `docs/demos/trade-estimating/v1.0.0/screenshots/` (versioned demo pack)

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | auto `localhost:5173` / `5174` | App URL |
| `BROWSER_CHANNEL` | `chrome` | `chrome` or `msedge` |
| `DEMO_EMAIL` | admin demo user | Login (full feature access) |
| `DEMO_PASSWORD` | admin demo password | Password |
| `VIEWPORT_WIDTH` | `1440` | Capture width |
| `VIEWPORT_HEIGHT` | `900` | Capture height |
| `OUT_DIR` | kit `output/` | Working output |
| `DOCS_OUT` | `docs/demos/trade-estimating/v1.0.0/screenshots` | Versioned docs copy |
