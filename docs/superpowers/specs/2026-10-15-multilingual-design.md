# Hour of AI — Multilingual Certificate Generator: Design

Builds on `2026-10-08-pdf-certificates-design.md` (v1, Ukrainian only). Where the two disagree, this document wins.

Initiative context: https://hourofai.com.ua — "Година ШІ", a global initiative that gives students of any age a first hour of
hands-on AI/coding. Anyone can host an event (schools, libraries, communities, parents). This tool is built for the participants
who join the initiative (event hosts and teachers issuing certificates to their students).

## Goal

The same generator, served per language under its own URL (`/uk/`, `/en/`, `/he/`). Each language has its own UI strings,
its own certificate template (PDF), its own font, and its own list-import rules. The UI design is **not final** and will be
replaced, so logic must not depend on markup beyond element ids.

## Decisions (agreed with stakeholder, 2026-10-15)

| Topic | Decision |
|---|---|
| Language codes | ISO 639-1: `uk`, `en`, `he`. No `/ua/` alias. |
| Languages now | `uk`, `en`, `he`. |
| Languages later | `ar` — **not approved**, may be added in the future. Not implemented, not in the registry. |
| URL scheme | `/<lang>/` on a single static page. A catch-all Netlify rewrite `/*` → `/index.html` (200) serves the page for every path; real files (assets, locales, fonts) still take precedence. The page reads the first path segment. |
| Language detection | See below. Applies only when the URL has no supported language code. |
| Language selection UI | None. No dropdown or switcher; the language is chosen only by the code in the URL. |
| Draft languages | `en`, `he` are reachable in dev and on Netlify deploy previews, not in production (see "Draft languages"). Netlify deploys `main` to the live site. |
| Templates | One PDF per language. New designs (including a redesign of the Ukrainian one) are still in development. **For now every locale uses a copy of the current template** so the site can be tested end to end. Placing the final PDFs and calibrating name positions is a deferred task (see "Template calibration"). |
| Fonts | Undecided. For now every locale uses the font already in the project (Wix Madefor Display Bold; Wix Madefor Text for the web UI). See the Hebrew limitation below. |
| Name on certificate | Printed exactly as entered (no reordering, no case changes). Locale-specific normalisation only where the font cannot render the character. Letters with diacritics (`é`, `ñ`, `ü`, `ø`, `ł`, …) are never stripped or replaced. |
| Zip entry names | Option B: keep the student's name with its original letters (including diacritics and Hebrew), with a leading number. Correct names matter more than ASCII-only. Must be verified on Windows and macOS. |
| README | Added (`README.md`), including "How to add a language". |
| Everything else | Unchanged from v1: client-side only, no analytics, desktop only, 300-name limit. |

## Language detection (root and unknown paths)

1. First path segment is a supported language → use it.
2. Otherwise walk `navigator.languages` in order and take the **first** entry that resolves:
   - base subtag `ru` → `uk`;
   - legacy `iw` → `he`;
   - base subtag supported (`uk`, `en`, `he`) → that language.
3. Nothing resolved → `en`.
4. Redirect with `location.replace('/<lang>/')` (no history entry). `/he` → `/he/`.

Unknown segments such as `/fr/` are treated as "no language code". Pure function `detectLocale(pathname, languages)`, unit-tested.

This only works if the host serves the page for unknown paths too, hence the catch-all rewrite. A per-language rewrite would answer
`/fr/` with Netlify's 404 before any script runs. Trade-off: a mistyped file path returns the page (200) instead of a 404.

**Verification caveat.** `vite dev` and `vite preview` serve `index.html` for every path, so they hide hosting problems. Anything about
routing, rewrites, headers or redirects is verified on a Netlify deploy preview, not only locally.

## Draft languages

A locale has `status: 'ready' | 'draft'`. While `en` and `he` use a copy of the Ukrainian template, they are `draft`: the
certificate text would be Ukrainian on an English or Hebrew page. Draft locales work in `npm run dev` (so UI and RTL can be built
and tested) and on Netlify deploy previews, so reviewers can open them by editing the language code in the URL. They are **not** reachable on
the production site: there `/en/` or `/he/` is treated like any unsupported code and goes through language detection. They
become `ready` when their real template is placed and calibrated. `uk` is `ready`.

Mechanism: the build flag `VITE_ENABLE_DRAFT_LOCALES`. `npm run dev` enables it; on Netlify it is set per deploy context in
`netlify.toml` (`true` for `deploy-preview` and `branch-deploy`, `false` for `production`). `detectLocale` and the router only
know the locales the flag allows.

Release flow: pushing to `main` deploys production (only `ready` locales). Later, a separate push puts the final PDFs in place,
sets `nameBox`, and flips a locale to `ready`. Deploy Previews are enabled for the Netlify site (confirmed by the stakeholder).

**There is no language switcher.** The language is changed only by editing the code in the URL (`/uk/` → `/en/`). Reviewers get
a deploy-preview link and change the code themselves.

## Locale registry

`src/locales/index.ts` is the single place that knows which languages exist. Each locale provides:

| Field | Purpose |
|---|---|
| `code`, `dir` (`ltr`/`rtl`), `status` | Identity, `<html lang dir>`, draft gating |
| `messages` | All UI strings; typed by a shared `Messages` interface so a missing key fails `tsc` |
| `templateUrl` | `/locales/<lang>/template.pdf` |
| `fontUrl` | Font able to render this script (and Latin, for foreign names) |
| `nameBox` | Name position/size for this template (`NAME_BOX` today) |
| `csv.headerWords`, `csv.fallbackEncoding` | Header detection; legacy Excel encoding (`windows-1251` / `windows-1255` / `windows-1252`) |
| `normalizeName` policy | Which characters are rewritten (see below) |
| `fileNameStrategy` | How zip entry names are built (see below) |

Plurals use `Intl.PluralRules(code)`; message entries that depend on a count take the plural category. `pluralUk` is removed.

## File layout

```
public/locales/<lang>/template.pdf
public/locales/<lang>/example.csv
public/fonts/<font files + licences>
src/locales/index.ts          registry, lookup
src/locales/<lang>.ts         messages + locale config
src/i18n.ts                   t(), applyToDocument()
src/detect-locale.ts          detectLocale()
```

Asset URLs are absolute (`/locales/...`), because the page now lives under nested paths.

## RTL (Hebrew) — checklist

The PDF side and the UI side are separate problems.

**PDF name rendering**
- `pdf-lib` draws glyphs in the order given and does **no bidi reordering**. Hebrew names must be converted to visual order
  before drawing (planned: `bidi-js`, an implementation of the Unicode Bidirectional Algorithm).
- Reorder by grapheme cluster, never by code point, so combining marks (niqqud) stay attached to their letter.
- Mixed content (a Latin name inside a Hebrew list, digits, `'`/`״` punctuation) goes through the same algorithm.
- Measurement (`layoutName`) must use the visual string; centring is direction-neutral.
- Two-line wrap keeps logical word order: the first logical words go on the top line, whatever the direction.
- Name order is never swapped ("as entered").
- The final font must contain Hebrew **and** Latin (and `׳`, `״`, `’`). **Checked on the bundled `WixMadeforDisplay-Bold.ttf`:
  it has no Hebrew letters, no niqqud, no `׳`/`״`, and no `ʼ`.** It does have Latin-1/Latin Extended (`é ñ ü ø ł ß`),
  Cyrillic (`і ї`), `'`, `’` and combining accents. Consequence: with the current font the `he` locale can only be exercised
  with Latin/Cyrillic names; a Hebrew name cannot be drawn until a Hebrew-capable font is chosen (with the designers; OFL
  candidates such as Heebo, Assistant, Rubik).
- Before generating, check glyph coverage per name; report offending names instead of failing with a generic error. This is
  what users see today's font limitation as, and it stays useful afterwards.
- Names are NFC-normalised before drawing, so a decomposed `é` (`e` + U+0301) typed or pasted on macOS is drawn as one glyph.

**Input**
- Textarea uses `dir="auto"` so Hebrew and Latin lines align naturally.
- CSV fallback encoding for Hebrew Excel exports is `windows-1255` (today's code falls back to `windows-1251` for everything).
- Header words: `שם`, `שם פרטי`, `שם משפחה`, `תלמיד`, `תלמידים`, `כיתה`.
- Apostrophe normalisation (`'` → `’`) exists because the Ukrainian font lacks `ʼ`. It must not run blindly on Hebrew:
  `ג'ורג'` is legitimate. Rule: rewrite a character only if the locale's font cannot render it. `uk` keeps its v1 behaviour
  (all apostrophe variants → `’`); `en` and `he` do not touch `'` (`O'Brien` stays as typed), only `ʼ`, which the font lacks.

**UI**
- `<html lang="he" dir="rtl">`; layout moves to logical CSS properties (`margin-inline`, `text-align: start`, `inset-inline`).
  The grid mirrors automatically.
- The preview canvas always shows the PDF as-is (the template's own direction); only its surroundings mirror.
- Pager: "previous/next" arrows swap direction in RTL (use logical meaning, not fixed `◀ ▶`).
- Dynamic text containing user data (file name in status messages, names) is wrapped in `<bdi>` so Latin/Hebrew runs do not scramble.
- Counters and plurals use the Hebrew categories from `Intl.PluralRules`.

**Zip entry names** (Hebrew-relevant details below)

## Zip entry names (option B)

Format stays `NN_<name>.pdf`; the number comes first (it is a stable anchor in mixed RTL/LTR display and keeps entries unique).

Per-locale strategy:

| Locale | Strategy |
|---|---|
| `uk` | Cyrillic is transliterated (KMU-2010) as today. Any other letter is **kept as is** (`José Шевченко` → `José_Shevchenko`). Fixes today's behaviour, where `é` is dropped (`Jos`). |
| `en` | Keep Unicode letters, including diacritics (`José` stays `José`). No transliteration. |
| `he` | Keep Unicode letters. NFC-normalise (macOS filesystems use NFD), replace whitespace runs with `_`. |

Sanitising (shared by all strategies): keep letters, combining marks and digits (`\p{L}\p{M}\p{N}`); collapse everything else to `_`.
Nothing is transliterated or stripped unless it is illegal in a file name:
- remove `\ / : * ? " < > |`, control characters, and **bidi control characters** (U+200E/F, U+202A–E, U+2066–9);
- trim trailing dots/spaces (Windows rejects them); cap name length (~100 bytes of UTF-8);
- empty result → `student`.

Compatibility: JSZip sets the zip UTF-8 flag for non-ASCII names. Windows 10+ Explorer and macOS Archive Utility read it; older
tools may not. **Manual check on Windows and macOS is mandatory before `he` becomes `ready`.** If a platform garbles names, fall
back to Unicode-path extra fields or to numbered ASCII for that platform.

## Template calibration (deferred)

Each template needs its own `nameBox` (centre, max width, baseline, sizes), measured the way v1 did (screenshot, then visual
check against rendered output). The new designs do not exist yet, including the redesigned Ukrainian one, so:
- every locale (`uk`, `en`, `he`) points at its own `public/locales/<lang>/template.pdf`, currently a **copy of the existing template**
  with the existing `nameBox`;
- a future task (plan, Task 13) replaces those copies with the final PDFs in the same paths, re-measures `nameBox` for each
  language, and archives the old template under `assets/`;
- that task is what moves `en`/`he` from `draft` to `ready`, and it also re-calibrates `uk`.

## Out of scope

Arabic (`ar`), a language switcher or dropdown, `/ua/` alias, per-language SEO/`hreflang`, language persistence beyond the URL, mobile layout, the final UI
design, any server-side processing.

## Open items

- Font choice for all locales; Hebrew needs a Hebrew-capable font (current font has none).
- Final templates for `uk` (redesign), `en`, `he`, and calibration.
- UI design (will replace markup and CSS only).
