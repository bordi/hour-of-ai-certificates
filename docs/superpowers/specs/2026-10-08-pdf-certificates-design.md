# Hour of AI — PDF Certificate Generator: Design

Source spec (UA): https://docs.google.com/document/d/1lR1G4LCIGWTFrjuwN04bosVR6SzzmRY5zLuhsYsYz2Q
Template: `assets/template-2025.pdf` (from Drive file `1GlZtCcRBsK1TNszkBtYnyiEVkUQWDWLr`)

## Goal

A standalone page (own shareable link, Netlify) where a teacher enters a class list and
gets one named certificate per student: previewable, downloadable as a .zip, and printable
in one go.

## Decisions (agreed with stakeholder, 2026-10-08)

| Topic | Decision |
|---|---|
| Hosting | Static site on Netlify (free tier). No backend. |
| Processing | 100% client-side. Student names never leave the browser. |
| Fields | Student name only. Printed exactly as entered (no reordering). |
| Input | Textarea, one name per line **and** CSV/TXT upload (v1). Upload fills the textarea so the teacher can review/edit. |
| Paper | A4 landscape (842×595 pt), same as template. |
| Font | Wix Madefor Display Bold, from the Google Fonts release (OFL, has Cyrillic). The locally installed "Wix Madefor … App" fonts have **no Cyrillic** — do not use them. |
| Name style | Colour `#2E51F4` (rgb 0.180392 0.317647 0.956863 — the template's blue), centred above the name line, auto-shrinks; wraps to 2 lines for very long names. |
| Stats/analytics | None. |
| Devices | Desktop only. |
| UI language | Ukrainian. |

## Template facts (measured)

- One page, MediaBox `[0 0 842 595]`; all template text is outlined (no font objects), name area is blank.
- Name line ≈ x 151 → 691 pt, y ≈ 337 pt (PDF coords, origin bottom-left).
- "отримує" baseline ≈ y 418 pt. Free band for the name: y ≈ 342 → 405.
- Measurements came from a screenshot; Task "calibrate" verifies them visually.

## UX

```
┌──────────────────────────────────────────────┬────────────────────────┐
│  Preview (pdf.js canvas)                      │ Список учнів            │
│  before generate: blank template              │ [textarea, 1 per line]  │
│  after generate:  ◀  3 / 28  ▶                │ [Завантажити CSV/TXT]   │
│                                              │ Учнів: 28               │
├──────────────────────────────────────────────┴────────────────────────┤
│ [Сформувати сертифікати] [Завантажити (.zip)] [Друкувати]               │
└───────────────────────────────────────────────────────────────────────┘
```

- **Сформувати**: parse names → generate one PDF per name + one combined PDF → preview switches to carousel.
- **Завантажити**: `sertyfikaty.zip` with `01_Shevchenko_Taras.pdf`, … (KMU-2010 transliteration, numbered, ASCII-only to avoid zip encoding issues on Windows).
- **Друкувати**: opens the combined PDF (one page per student) in a new tab; teacher prints once. (Programmatic `print()` on embedded PDFs is unreliable, notably in Safari.)
- Download/Print are disabled until generated, and disabled again when the list changes after generation.
- Limit: 300 names (show an error above that).

## Input parsing rules

Textarea: split lines, trim, collapse inner whitespace, drop empty lines. Duplicates kept.

CSV/TXT file:
- Decode as UTF-8 (fatal); on failure decode as `windows-1251` (Excel "CSV" in UA locale).
- Delimiter auto-detected (`,` `;` tab).
- First row skipped if it looks like a header (contains e.g. `піб`, `ім'я`, `імя`, `прізвище`, `учень`, `name`, `surname`, `student`).
- Each row → non-empty cells joined with a single space.
- Result replaces textarea content (one name per line).

## Out of scope (v1)

Other fields, other templates, mobile layout, analytics, server-side anything.
