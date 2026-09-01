# Advanced Damp Estimating — Mobile & Tablet UI/UX Principles

**Applies to:** Field use on phones and tablets (surveyors on site)  
**Brand source:** [https://advanceddamp.co.uk/](https://advanceddamp.co.uk/) + `docs/UI_UX_DESIGN_SYSTEM.md`  
**Product context:** Work tool first — not a marketing site on a small screen.

---

## 1. Mobile product goal

On a phone or tablet, a surveyor must be able to:

1. Sign in quickly  
2. Find or create a customer / survey  
3. Move through estimate steps without horizontal scrolling  
4. Enter measurements with one thumb  
5. Review margin and generate a quotation  

If any of those require pinch-zoom, sideways scrolling, or hunting for an overflowing header control, the mobile UX has failed.

---

## 2. Breakpoints

| Name | Width | Intent |
|---|---|---|
| Phone | `≤ 640px` | Single column; compact header; stacked actions |
| Tablet | `641px – 900px` | Mostly single column forms; nav can show primary links |
| Desktop | `≥ 901px` | Full header nav and multi-field rows |

Use **mobile-first CSS** where practical. Do not hide critical estimating actions behind desktop-only layouts.

---

## 3. Core mobile principles

### M1 — One column by default
Forms, price grids, and action groups stack vertically on phone. No forced multi-column field rows under 640px.

### M2 — Thumb-first targets
- Minimum tap target: **44×44px**  
- Primary CTA full-width on phone when it is the main next step  
- Adequate gap between tappable rows (≥ 8px)

### M3 — No horizontal overflow
Page content, headers, workflow chips, and footers must not cause the viewport to scroll sideways. Allow intentional horizontal scroll **only** inside a dedicated chip scroller with visible overflow cue.

### M4 — Compact chrome, visible content
Header must stay usable:
- Logo + menu on phone  
- Do not pack Estimates, Customers, user name, Sign out, and New estimate into one overflowing row  
- Use a **mobile menu drawer / panel** for secondary links

### M5 — Sticky primary action on long flows
On estimate measurement / pricing steps, keep the main continue action easy to reach (sticky bottom bar on phone when the step is long).

### M6 — Readable without zoom
- Body ≥ 16px equivalent on inputs (prevents iOS focus zoom)  
- Titles remain Red Hat Display but scale down gracefully  
- Money and margins use tabular numbers and wrap cleanly

### M7 — Workflow steps stay scannable
The five-step hint (Customer → Scope → Measure → Price → Quote) must remain visible and scrollable horizontally on phone without breaking layout.

### M8 — Same brand, denser layout
Keep navy / orange / blue tokens. Do not invent a separate “mobile theme.” Reduce padding and chrome; do not reduce contrast or target size.

### M9 — Safe areas
Respect notch / home-indicator safe areas for sticky header and sticky action bars (`env(safe-area-inset-*)`).

### M10 — Desktop parity of meaning
Mobile may change **layout**, never **commercial meaning**. Cost, sell, margin, and warnings must remain complete and readable.

---

## 4. Header rules (phone)

```text
[ Logo ]                    [ Menu ]
```

Menu contents when signed in:

- Estimates  
- Customers  
- New estimate (primary)  
- Signed-in name / role (read-only)  
- Sign out  

When signed out:

- Sign in  

Rules:

- Menu button ≥ 44px  
- Drawer/panel overlays content with a dimmed backdrop  
- Closing menu: backdrop tap, close control, or navigation  

---

## 5. Form rules (phone)

- `.row` fields become **100% width** stacked blocks  
- Labels always above controls  
- Selects and inputs stretch to container width  
- Checkbox groups wrap with comfortable vertical spacing  
- “Override + Recalculate” stacks: input full width, button full width beneath  

---

## 6. Estimate wizard rules (phone)

| Step | Mobile behaviour |
|---|---|
| Customer & site | Single-column fields; full-width Continue |
| Work scope | Scope cards in one column; full-width Continue |
| Measurements | One work-type panel after another; sticky Calculate |
| Price review | Cost/margin tiles 2-up max, else 1-up; sticky Generate |
| Quotation | Document stacks; Download PDF full-width |

Back actions remain secondary and sit above or beside primary only when both fit without overflow; otherwise stack with primary last.

---

## 7. List / card rules (phone)

- Estimate and customer cards stack meta under identity (no cramped right column)  
- “Edit draft” remains a clear text action ≥ 44px tall hit area  
- Avoid hover-only affordances  

---

## 8. Footer rules (phone)

- Stack company line and contact line  
- Reduce padding  
- Do not compete with sticky action bars (add bottom padding to `main` when sticky bar is present)

---

## 9. Anti-patterns (mobile)

- Desktop mega-header squeezed onto phone  
- Tiny tap targets  
- Horizontal page scroll  
- Side-by-side primary + secondary buttons that overflow  
- Hover-dependent navigation  
- Input font-size under 16px on iOS  
- Sticky bars covering the last form fields without spacer  

---

## 10. Implementation checklist

Before calling mobile “fixed”:

- [x] Phone header: logo + menu only  
- [x] Menu opens/closes and navigates correctly  
- [x] No horizontal page overflow at 320–430px widths  
- [x] Login usable at 360px width  
- [x] Customers forms stack cleanly  
- [x] Estimate steps usable end-to-end on a phone-width viewport  
- [x] Workflow chips scroll inside their own container  
- [x] Sticky actions do not hide content  
- [x] Inputs do not trigger unexpected iOS zoom  

---

## 11. Relationship to other docs

| Document | Role |
|---|---|
| `docs/UI_UX_DESIGN_SYSTEM.md` | Overall brand + desktop/app principles |
| `docs/MOBILE_UI_UX_PRINCIPLES.md` | **This file** — phone/tablet behaviour |
| `.cursor/rules/advanced-damp-ui.mdc` | Agent enforcement for frontend work |

---

*Mobile UX is successful when a surveyor can price a job on site without rotating the device or fighting the chrome.*
