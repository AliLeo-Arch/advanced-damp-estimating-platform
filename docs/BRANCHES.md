# Git branch documentation policy

| Branch | Role | Living docs | Client / historical packs |
|---|---|---|---|
| `main` | Advanced Damp client delivery | Client-facing handoff as maintained on `main` | N/A (primary) |
| `feature/generic-branding` | Generic Trade Estimating product | `docs/product`, `docs/guides`, `docs/ops`, `docs/demos/trade-estimating` | `docs/clients/advanced-damp/v1.0.0` (frozen archive) |

## Exact versioning

1. Each pack has a `VERSION.md` stating the pack id and semver.
2. Client packs use immutable folders: `docs/clients/<client>/vX.Y.Z/`.
3. Do not edit published `vX.Y.Z` folders for content changes — add `vX.Y.(Z+1)` instead.
4. Product docs on this branch share pack version `1.0.0-trade-estimating` (`docs/VERSION.md`).

## Screenshots

- Generic product demos → `docs/demos/trade-estimating/vX.Y.Z/`
- Advanced Damp historical demos → `docs/clients/advanced-damp/v1.0.0/demos/`
