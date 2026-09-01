# API Reference — Estimates & Rates (search / export)

Local FastAPI base: `http://127.0.0.1:8000`  
Interactive docs: `http://127.0.0.1:8000/docs`  
Auth: `Authorization: Bearer <JWT>` (download links also accept `?access_token=`).

---

## Estimates

### `GET /api/estimates/`

Paginated list with search and filters.

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Search reference, customer, company, site, postcode, surveyor, notes |
| `status` | string (repeatable) | — | e.g. `priced`, `ready_to_quote`, `quoted` |
| `surveyor` | string | — | Partial match |
| `survey_from` / `survey_to` | date string | — | Survey date range (`YYYY-MM-DD`) |
| `sell_min` / `sell_max` | number | — | Sell price (ex VAT) range |
| `sort` | string | `created_at_desc` | See sort options below |
| `page` | int | `1` | Page number |
| `page_size` | int | `10` | Max 50 |

**Sort options:** `created_at_desc`, `created_at_asc`, `sell_price_desc`, `sell_price_asc`, `reference_asc`, `reference_desc`, `customer_asc`, `customer_desc`

**Response**

```json
{
  "items": [ /* EstimateRead */ ],
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "has_next": true,
  "has_prev": false
}
```

### `GET /api/estimates/export/list.csv`

CSV of matching estimates (same filters as list; not paginated — all matching rows).

### `GET /api/estimates/{id}/quotation.pdf`

Branded PDF. Requires estimate to pass quotation gates.

### `GET /api/estimates/{id}/export.csv`

Customer quotation export (CSV). Same gates as PDF.

### `GET /api/estimates/{id}/export.xlsx`

Excel workbook:

1. **Quotation** — customer-facing lines and totals  
2. **Internal** — costs, margins, line sell breakdown  

---

## Rates

### `GET /api/rates/`

Paginated rate table.

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Search code, name, category, unit, notes |
| `category` | string | — | Exact category filter |
| `include_inactive` | bool | `false` | Include deactivated rates |
| `sort` | string | `category_asc` | See below |
| `page` | int | `1` | |
| `page_size` | int | `25` | Max 200 |

**Sort options:** `category_asc`, `category_desc`, `code_asc`, `code_desc`, `name_asc`, `name_desc`, `cost_asc`, `cost_desc`

**Response** — same pagination shape as estimates (`items` are `RateItemRead`).

### `GET /api/rates/categories`

```json
{ "categories": ["labour", "materials", "..."] }
```

### Rate CSV (scripts, not HTTP)

Bulk import/export remains via PowerShell — see `docs/RATE_IMPORT.md`.

---

## Demo seed estimates

Created by `app.seed_estimates.seed_estimates_if_empty` during `init_db()`:

- `AD-DEMO-01`, `AD-DEMO-04`, `AD-DEMO-05`

See `docs/CHANGELOG.md`.
