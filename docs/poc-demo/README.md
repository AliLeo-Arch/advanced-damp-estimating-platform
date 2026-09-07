  POC Demo Assets — Advanced Damp Estimating

Organised screenshots and PDF export from the implemented Proof of Concept.

**Demo estimate:** `EST-00001` · Ms Emma Thompson · 24 Cedar Road, Reading RG1 4AB  
**Sell (ex VAT):** £10,554.21 · **Total (inc VAT):** £12,665.05  

---

   Folder layout

```text
docs/poc-demo/
├── README.md                          ← this index
├── screenshots/
│   ├── 01-estimates-dashboard.png
│   ├── 02-work-scope.png
│   ├── 03-measurements.png
│   ├── 04-price-review-internal.png
│   └── 05-customer-quotation.png
└── exports/
    └── EST-00001-Helen-Carter-quotation.pdf
```

---

   Screenshots

| File | Screen | What it shows |
|---|---|---|
| `01-estimates-dashboard.png` | Estimates dashboard | Saved estimate list, system connected, ready-to-quote estimate |
| `02-work-scope.png` | Work scope | Treatment types selected for the demo estimate |
| `03-measurements.png` | Measurements | Survey quantities plus travel/waste/prelims |
| `04-price-review-internal.png` | Price review | Internal cost build-up, margin, final sell, line-level cost/sell |
| `05-customer-quotation.png` | Quotation | Customer-facing quote (no costs/margins), VAT breakdown, Download PDF action |

   PDF export

| File | Description |
|---|---|
| `EST-00001-Helen-Carter-quotation.pdf` | Historical POC PDF filename (customer data since replaced with synthetic demo) |

---

   Workflow coverage

```text
Dashboard → Work scope → Measurements → Price review → Quotation (+ PDF)
```

Note: a dedicated **Customer & site** form screenshot was not included in the supplied set; that step is covered by the estimate header context on steps 02–05 and by the dashboard card for EST-00001.

**Post-POC production screenshots** (login, dashboard table, editor UX) are in [`../production-demo/README.md`](../production-demo/README.md).

---

   Original filenames (renamed from)

| Original | Renamed to |
|---|---|
| `Advanced Damp - Estimating0.png` | `01-estimates-dashboard.png` |
| `Advanced Damp - Estimating1.png` | `02-work-scope.png` |
| `Advanced Damp - Estimating.png` | `03-measurements.png` |
| `Advanced Damp - Estimating (1).png` | `04-price-review-internal.png` |
| `Advanced Damp - Estimating (2).png` | `05-customer-quotation.png` |
| `EST-00001-quotation.pdf` | `EST-00001-Helen-Carter-quotation.pdf` |
