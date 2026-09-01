# Advanced Damp Estimating — UI/UX Design Principles & Rules

**Source of brand truth:** [https://advanceddamp.co.uk/](https://advanceddamp.co.uk/)  
**Product:** Internal estimating & quoting tool (surveyors + business owner)  
**Goal:** Familiar Advanced Damp brand language adapted for a fast, field-usable work tool — not a marketing clone.

---

## 1. Product context (how this differs from the website)

| Website | Estimating platform |
|---|---|
| Persuade homeowners & commercial clients | Help surveyors price jobs accurately |
| Marketing hero, stories, trust logos | Dense forms, numbers, margin visibility |
| Browse & enquire | Create → calculate → quote → save |
| Public audience | Internal / semi-internal users |

**Rule:** Borrow brand identity (logo, colour, type, tone). Do **not** copy marketing layout patterns (full-bleed heroes, review carousels, service grids) into the app shell.

---

## 2. Brand identity extracted from the website

### 2.1 Colour tokens

| Token | Hex | Website use | App use |
|---|---|---|---|
| `--ad-navy` | `#0C1644` | Dark overlays, authority | Header text, primary headings, nav |
| `--ad-orange` | `#FF5F14` | Primary CTA buttons | Primary actions (New estimate, Generate PDF, Save) |
| `--ad-orange-hover` | `#E55512` | — | Hover / pressed primary |
| `--ad-blue` | `#2C93F5` | Accent border / links | Focus rings, secondary links, info states |
| `--ad-white` | `#FFFFFF` | Surfaces | Cards, panels, inputs |
| `--ad-ink` | `#0C0D0E` | Body near-black | Body copy |
| `--ad-muted` | `#706F6F` | Secondary text | Labels, hints, meta |
| `--ad-line` | `#E0E0E0` | Dividers | Borders, table lines |
| `--ad-canvas` | `#F5F7FA` | Soft page ground | App background (cooler than cream) |
| `--ad-success` | `#2F532E` | Positive cues | On-target margin |
| `--ad-success-bg` | `#D4E9D6` | Soft success | Margin OK chips |
| `--ad-danger` | `#870000` | Errors | Below-target margin, validation |
| `--ad-danger-bg` | `#FFDEDE` | Soft error | Warning banners |

**Do not use** the previous POC teal/cream palette (`#0d5c4d`, warm paper `#f3f0e8`). It fights the live Advanced Damp brand.

### 2.2 Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / brand / page titles | **Red Hat Display** | 700 | Matches website CTAs and headlines |
| UI / body / forms / tables | **Montserrat** | 400–600 | Matches website body stack |
| Tabular numbers (money, %) | Montserrat | 600 | `font-variant-numeric: tabular-nums` |

**Forbidden for this product:** Instrument Serif, DM Sans, Inter-as-brand, generic system-only stacks as the primary identity.

### 2.3 Logo & naming

- Wordmark / logo asset (from site):  
  `https://advanceddamp.co.uk/wp-content/uploads/2026/05/Advanced-Damp-1-copy.png`  
  Prefer a local copy under `frontend/public/brand/` for offline POC reliability.
- Product label in chrome: **Advanced Damp** + muted subtitle **Estimating** (not a competing product name).
- Customer-facing PDFs: full company details from site  
  - Phone: `0300 373 7251`  
  - Email: `info@advanceddamp.co.uk`  
  - London office: `45 Fitzroy St, London W1T 6EB`  
  - Site: `https://advanceddamp.co.uk/`

### 2.4 Voice & microcopy

Align with site principles: diagnose clearly, no guesswork, no pressure, plain English.

| Do | Don't |
|---|---|
| “Create estimate”, “Generate quotation”, “Margin below target” | “Awesome!”, emoji-heavy toasts |
| “Site measurements”, “Scope of works” | Vague “Stuff”, “Items” |
| Short instructional leads under titles | Marketing slogans in the app (“Done Right First Time” as page chrome) |
| Flag commercial risk calmly | Alarmist or gamified language |

---

## 3. Core UX principles (product)

### P1 — Survey-first workflow
Mirror the company’s process: survey inputs → clear specification → commercial outcome.  
The estimate flow must feel like: **Customer & site → Work scope → Measurements → Price review → Quotation**.

### P2 — Speed on site
Tablet/phone usable. Large tap targets (≥44px). Minimal typing. Sticky primary actions. Avoid multi-column dense desktop-only forms on small screens.

### P3 — Commercial clarity
Internal users must always see **cost, sell, margin £, margin %** before PDF. Overrides recalculate immediately. Below-target margin is visually obvious (danger tokens), never silent.

### P4 — Safe for the owner
Rate admin is clearly separated from estimating. Destructive or global rate changes need confirmation. Never expose internal cost/margin on customer PDFs.

### P5 — Familiar, not decorative
Brand familiarity comes from **logo, orange CTA, navy type, fonts, tone** — not from recreating the marketing homepage inside the tool.

### P6 — One job per screen region
Each view has one primary purpose and one primary CTA. Secondary actions stay visually quieter (outline / text).

### P7 — Deterministic trust
Numbers are exact (£0.00). Show units (lm, m²). Explain adjustments (minimum job value, override) in plain labels.

---

## 4. Layout & composition rules

1. **App shell:** White/light header with logo left, nav right; optional 4px `#2C93F5` bottom accent (website header cue). Soft `#F5F7FA` page canvas.
2. **Content width:** Main estimating content `max-width: 960–1040px`. Rate tables may go wider.
3. **No marketing heroes** inside the app. Page title (Red Hat Display) + one short lead sentence only.
4. **Cards sparingly:** Use bordered panels for interactive groups (forms, summaries). Avoid card grids for decoration.
5. **Primary CTA = orange filled.** Secondary = navy outline or quiet text. Never two competing orange buttons in one region.
6. **Radius:** ~5px (matches website button radius). Avoid large pill CTAs.
7. **Shadows:** Minimal or none. Prefer 1px `#E0E0E0` borders (trade-tool clarity over soft marketing depth).
8. **Density:** Comfortable for field use — not spreadsheet-cramped, not landing-page sparse.
9. **Status:** Draft / Ready / Quoted use calm pills; success/danger reserved for margin health.
10. **Motion:** Subtle only (150–200ms fade/slide on step change). No decorative parallax or glow.

---

## 5. Component rules

### Buttons
- Primary: `background #FF5F14`, `color #fff`, Red Hat Display 700, padding ~12–16px × 20–24px, radius 5px.
- Secondary: transparent/white, border `#0C1644` or `#E0E0E0`, navy text.
- Disabled: 55% opacity, no pointer.

### Forms
- Labels: Montserrat, muted, above field.
- Inputs: white, 1px `#E0E0E0`, focus ring `#2C93F5`.
- Errors: text `#870000`, field border danger; message under field.
- Measurement fields always show unit suffix (lm, m², each).

### Internal pricing summary
- Distinct “Internal only” treatment (navy label or blue accent bar).
- Customer quote preview must not inherit internal cost rows.

### Tables (rates / estimates)
- Sticky header on long lists.
- Right-align currency and percentages.
- Row hover: light `#F5F7FA`.

### Empty states
- One sentence + single orange CTA. No illustrations that compete with the logo.

---

## 6. Screen-specific guidance

| Screen | UX priority |
|---|---|
| Dashboard | Scan recent estimates; one orange “New estimate” |
| Customer & site | Fast identity capture; postcode + surveyor visible |
| Work scope builder | Clear work-type list matching company services language |
| Measurement forms | Dynamic fields; progress of required inputs |
| Pricing summary | Margin health dominant; override controls grouped |
| Quotation preview | Looks like an Advanced Damp document |
| Rate admin | Owner-safe editing; codes + units obvious |
| PDF | Logo, navy headings, orange used sparingly for headers/rules only |

**Work-type labels** should match the website vocabulary where possible:
- Chemical DPC / Rising damp & replastering  
- Cavity drain membrane  
- Sump & pump  
- Timber treatment (dry rot / wet rot / woodworm as specs later)  
- Condensation & ventilation  

---

## 7. Accessibility & device rules

- Contrast: navy/orange on white must meet WCAG AA for text/UI.
- Do not rely on colour alone for margin warnings — include text (“Below target”).
- Support thumb reach on mobile: primary actions bottom-sticky on small viewports when in long forms.
- Prefer `localhost` / responsive breakpoints: 640 / 900 / 1200.
- **Phone/tablet behaviour:** see `docs/MOBILE_UI_UX_PRINCIPLES.md` (hamburger header, single-column forms, sticky CTAs, 16px inputs).

---

## 8. Explicit anti-patterns

- Teal/sage “construction SaaS” theme unrelated to Advanced Damp  
- Warm cream + terracotta “AI default” palette  
- Purple gradients, glow, glassmorphism  
- Emoji as status indicators  
- Marketing testimonial blocks inside estimating UI  
- Hiding margin until after quote generation  
- Exposing cost/margin on customer PDF  
- Multiple primary orange buttons fighting for attention  

---

## 9. Implementation checklist (frontend)

When changing UI, verify:

- [ ] CSS variables match §2.1  
- [ ] Fonts: Red Hat Display + Montserrat loaded  
- [ ] Logo present in header; product subtitle “Estimating”  
- [ ] Primary actions use `--ad-orange`  
- [ ] Page = title + short lead + one primary purpose  
- [ ] Money uses `en-GB` currency formatting  
- [ ] Internal vs customer views clearly separated  
- [ ] Mobile layout usable without horizontal scroll for core flows  

---

## 10. Adoption plan

1. **Now:** This document + Cursor rule govern all UI work.  
2. **Next UI pass:** Restyle existing scaffold (`index.css`, header, buttons, forms) to these tokens — no feature work required.  
3. **Ongoing:** Every new screen follows §4–§6 before merge.  
4. **PDF step:** Apply the same tokens and company details for branded quotations.

---

*POC note: Visual familiarity supports client trust. Exact print letterhead / logo clearance can be refined when Advanced Damp supplies brand assets formally.*
