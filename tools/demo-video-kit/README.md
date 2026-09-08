# Demo video kit (standalone)

Separate Playwright utility for recording a **professional product demo video** of Trade Estimating & Quoting.

Not imported by `frontend/` or `backend/`. Safe to delete without affecting the app.

## Prerequisites

1. Backend on port `8000`
2. Frontend Vite on `5173` or `5174` (or set `BASE_URL`)
3. Seeded demo users/data
4. Google Chrome or Microsoft Edge installed
5. Optional: `ffmpeg` on PATH to also export MP4 (H.264)

## Setup (once)

```powershell
cd tools\demo-video-kit
npm install
```

## Record

```powershell
# From repo root (recommended)
.\tools\demo-video-kit\run-record.ps1

# Or manually
cd tools\demo-video-kit
$env:BASE_URL = "http://127.0.0.1:5173"
$env:BROWSER_CHANNEL = "chrome"
node src/record.mjs
```

Videos are written to:

- `tools/demo-video-kit/output/` (working copy, gitignored)
- `docs/demos/trade-estimating/v1.0.0/video/` (versioned demo pack)

Default deliverable:

- `trade-estimating-product-demo.webm`
- `trade-estimating-product-demo.mp4` (only if ffmpeg is available)

## What the walkthrough covers

1. Sign-in
2. Estimates dashboard + advanced filters
3. Customers / CRM detail tabs
4. Reports
5. Rates library, add drawer, cost history
6. Settings
7. Admin backups
8. New estimate
9. Full estimate workflow (customer → scope → measurements → pricing → quotation → actuals)
10. Lifecycle / More menu
11. Field mode (user menu)

Chapter title cards are rendered between sections for a presentation-style demo.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | auto `localhost:5173` / `5174` | App URL |
| `BROWSER_CHANNEL` | `chrome` | `chrome` or `msedge` |
| `DEMO_EMAIL` | admin demo user | Login |
| `DEMO_PASSWORD` | admin demo password | Password |
| `VIEWPORT_WIDTH` | `1920` | Capture width |
| `VIEWPORT_HEIGHT` | `1080` | Capture height |
| `SLOW_MO` | `85` | Playwright action delay (ms) |
| `HOLD_MS` | `1400` | Dwell time after key actions |
| `TITLE_MS` | `2400` | Chapter title card duration |
| `OUT_DIR` | kit `output/` | Working output |
| `DOCS_OUT` | `docs/demos/trade-estimating/v1.0.0/video` | Versioned docs copy |
