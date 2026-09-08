# Documentation pack version (this git branch)

**Branch:** `feature/generic-branding`  
**Product:** Trade Estimating & Quoting  
**Docs pack version:** `1.0.0-trade-estimating`  
**App version:** `1.0.0-local-prod`  
**Last updated:** 2026-09-07

## Layout

| Path | Contents |
|---|---|
| [`product/`](./product/) | Product definition + UI/UX enhancement specification |
| [`guides/`](./guides/) | User, admin, API, UX, acceptance guides |
| [`ops/`](./ops/) | Handoff, release, security, changelog, scripts |
| [`demos/trade-estimating/`](./demos/trade-estimating/) | Generic product demo assets (this branch) |
| [`clients/advanced-damp/`](./clients/advanced-damp/) | Frozen Advanced Damp client pack (separate versioning) |

## Branch policy

- **This branch** owns the Trade Estimating docs under `product/`, `guides/`, `ops/`, and `demos/trade-estimating/`.
- **Client-specific** Advanced Damp overviews, portfolio, job brief, and historical screenshots live under `clients/advanced-damp/vX.Y.Z/` and are versioned independently.
- **`main`** remains the Advanced Damp delivery line; do not mix root-level client blueprints back into this branch.
