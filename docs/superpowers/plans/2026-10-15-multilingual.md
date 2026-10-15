# Hour of AI Multilingual Certificates Implementation Plan

**Goal:** Serve the generator per language (`/uk/`, `/en/`, `/he/`) with per-language UI strings, template, font and import rules, including RTL for Hebrew.

**Architecture:** Same Vite + vanilla TypeScript page. A locale registry (`src/locales/`) replaces hard-coded Ukrainian strings and constants. A pure `detectLocale()` picks the language from the URL or `navigator.languages`. Pure modules stay unit-tested with Vitest; per-locale behaviour is passed in as parameters.

**Tech Stack:** unchanged, plus `bidi-js` (Hebrew visual ordering) — added in Task 10.

**Spec:** `docs/superpowers/specs/2026-10-15-multilingual-design.md`. Read it first.

Branch: `feat/i18n`. Tasks 2–8 must leave `/uk/` fully working with green tests, so they can merge as one PR before any new language exists.

---

## File map

| File | Responsibility |
|---|---|
| `src/locales/types.ts` | `Locale` / `Messages` / `Plural` types |
| `src/locales/index.ts` | Registry and lookup |
| `src/locales/uk.ts`, `en.ts`, `he.ts` | Messages and per-locale config |
| `src/detect-locale.ts` | `detectLocale(pathname, languages)` |
| `src/i18n.ts` | `t()`, document `lang`/`dir`, `data-i18n` binding |
| `src/bidi.ts` | Logical → visual text for RTL (Task 10) |
| `src/filenames.ts` | Strategies per locale (Task 7) |
| `src/csv.ts`, `src/names.ts` | Take header words, fallback encoding, normalisation policy from the locale |
| `src/layout.ts`, `src/certificate.ts` | Take `nameBox` and font per locale |
| `public/locales/<lang>/` | `template.pdf`, `example.csv` |
| `netlify.toml` | Rewrites for `/<lang>/*` |
| `README.md` | Project overview, how to add a language |

---

### Task 1: Spec and plan

**Files:** Create the two documents in `docs/superpowers/`.

- [ ] Commit: `docs: multilingual design spec and implementation plan`

### Task 2: Locale registry with Ukrainian messages

**Files:** Create `src/locales/types.ts`, `src/locales/uk.ts`, `src/locales/index.ts`, `tests/locales.test.ts`.

- [x] Define `Messages` and `Locale` (`code`, `dir`, `status`, `messages`). Fields for assets, `nameBox`, csv config, name policy and filename strategy are added by the Tasks that use them (6–8), so no unused code lands early.
- [x] Copy every UI string from `index.html` and `src/main.ts` into `uk.ts`; count-dependent strings are `Plural` entries with `{count}` placeholders. Nothing reads the module yet; Task 3 wires it in.
- [x] Test: registry returns `uk` and rejects unknown/inherited keys; every locale is registered under its own code, has no empty values, and uses the same placeholders in all plural forms. `Messages` completeness is enforced at compile time.
- [ ] Commit: `refactor: move ukrainian ui strings into a locale module`

### Task 3: Localize markup and runtime messages

**Files:** Modify `index.html`, `src/main.ts`; create `src/i18n.ts`.

- [ ] `data-i18n` attributes in `index.html`; `applyToDocument()` sets text, placeholder, `<title>`, `<html lang dir>`.
- [ ] `main.ts` calls `t()` instead of literals.
- [ ] Commit: `feat: localize static markup and runtime messages`

### Task 4: Plurals via Intl.PluralRules

**Files:** Delete `src/plural.ts`, update `tests/plural.test.ts`.

- [ ] Replace `pluralUk` by a helper over `Intl.PluralRules(code)`; keep the Ukrainian cases (1, 2–4, 5, 11, 21, 22) as tests; add `en` and `he` cases.
- [ ] Commit: `refactor: use Intl.PluralRules instead of pluralUk`

### Task 5: Language detection and routing

**Files:** Create `src/detect-locale.ts`, `tests/detect-locale.test.ts`; modify `src/main.ts`.

- [ ] Implement spec rules: path segment → `navigator.languages` in order (`ru`→`uk`, `iw`→`he`) → `en`.
- [ ] Tests: `/uk/`, `/he` (no slash), unknown `/fr/`, `['ru-RU','en']`→`uk`, `['de','he-IL']`→`he`, `['de']`→`en`, `[]`→`en`.
- [ ] Redirect via `location.replace`. The set of supported locales comes from the registry and respects draft gating (Task 9); tests cover both the production set (`uk` only) and the dev set.
- [ ] Commit: `feat: detect language from url and browser preferences`

### Task 6: Per-locale assets and Netlify rewrites

**Files:** Move `public/template.pdf` → `public/locales/uk/template.pdf`; move example CSV; modify `src/main.ts`, `netlify.toml`, `tests/example-csv.test.ts`.

- [ ] Asset URLs come from the locale (absolute `/locales/...`).
- [ ] `netlify.toml`: `[[redirects]]` `/uk/*`, `/en/*`, `/he/*` → `/index.html` status 200.
- [ ] Verify with `npm run build && npm run preview` on `/uk/`.
- [ ] Commit: `chore: move template and example csv under locales/uk`
- [ ] Commit: `build: netlify rewrites for language routes`

### Task 7: Per-locale import, normalisation and file names

**Files:** Modify `src/csv.ts`, `src/names.ts`, `src/filenames.ts` and their tests.

- [ ] `decodeText(bytes, fallbackEncoding)`; `isHeader` takes the locale's words. Tests for `windows-1255` and `windows-1252`.
- [ ] `normalizeName(raw, policy)`: rewrite a character only if the locale's font cannot render it; `uk` keeps today's behaviour.
- [ ] Filename strategies `uk` (transliterate Cyrillic, keep every other letter), `en` and `he` (keep Unicode letters, NFC); shared sanitiser keeps `\p{L}\p{M}\p{N}` and removes only illegal characters (forbidden characters, bidi controls, trailing dots, length cap, `student` fallback). Tests include `José` (kept, in `uk` and `en`), `ñ ü ø ł`, a decomposed `é`, Hebrew name, bidi control characters, long name, empty name.
- [ ] Names are NFC-normalised before drawing and naming.
- [ ] Commits: `refactor: per-locale csv header words and fallback encoding`, `refactor: per-locale name normalization policy`, `feat: per-locale zip entry names`

### Task 8: RTL-ready UI

**Files:** Modify `src/styles.css`, `index.html`, `src/main.ts`.

- [ ] Logical CSS properties; textarea `dir="auto"`; logical pager arrows; `<bdi>` around file names and user data in messages.
- [ ] Verify in dev with `dir="rtl"` forced on `uk` text (visual check; no Hebrew content needed yet).
- [ ] Commit: `feat: rtl-ready layout with logical css properties`

### Task 9: Draft locale gating

There is no language switcher: the language is chosen only by the code in the URL.

**Files:** Modify `src/locales/index.ts`, `netlify.toml`, `vite-env.d.ts` (if needed), tests.

- [ ] `VITE_ENABLE_DRAFT_LOCALES`: `npm run dev` on; registry exposes only `ready` locales when it is off.
- [ ] `netlify.toml`: `[context.production.environment]` `false`; `[context.deploy-preview.environment]` and `[context.branch-deploy.environment]` `true`.
- [ ] Tests: production set is `uk` only; `/en/` in production falls through to detection; with the flag on, `/en/` and `/he/` resolve.
- [ ] Verify on Netlify (Deploy Previews are enabled): preview serves `/en/` and `/he/`, production serves only `/uk/`.
- [ ] Pull request description lists the known limits: draft locales use the Ukrainian certificate text; Hebrew names cannot be drawn with the current font; Hebrew/English wording not yet reviewed.
- [ ] Commit: `feat: gate draft locales to dev and deploy previews`

### Task 10: Hebrew rendering in PDF

**Files:** Create `src/bidi.ts`, `tests/bidi.test.ts`; modify `src/certificate.ts`, `src/layout.ts` call sites.

- [ ] `npm install bidi-js`; `toVisual(text, dir)` reorders by grapheme cluster, keeps combining marks attached.
- [ ] `drawName` and `layoutName` measure and draw the visual string; two-line split keeps logical word order.
- [ ] Glyph coverage check before generation; surface the offending names in the UI. With the current font (no Hebrew) this is what a Hebrew name triggers.
- [ ] Unit tests of `toVisual` need no font: pure Hebrew, Hebrew with niqqud, mixed Hebrew + Latin, digits, `׳`/`״`, long name wrapping to two lines. Rendering tests with real Hebrew glyphs wait for the font (Task 13).
- [ ] Commit: `feat: visual ordering for rtl names in pdf`

### Task 11: `en` and `he` locales (draft)

**Files:** Create `src/locales/en.ts`, `src/locales/he.ts`, `public/locales/{en,he}/template.pdf`, `public/locales/{en,he}/example.csv`.

- [ ] Translate messages (review of Hebrew and English wording by a native speaker before `ready`).
- [ ] `template.pdf` for `en` and `he` is a copy of the current template; same `nameBox`. Font is the current Wix Madefor Display Bold for every locale (it has no Hebrew; see spec).
- [ ] Example CSVs use names the current font can draw (Latin incl. diacritics such as `José`; Hebrew example added in Task 13 once a font exists).
- [ ] Mark both `draft`; tests for registry completeness and example CSV parsing per locale.
- [ ] Commits: `feat: add english locale (draft)`, `feat: add hebrew locale (draft)`

### Task 12: README

**Files:** Create `README.md`.

- [ ] Contents as agreed: purpose, languages and URL scheme, run/test/build, structure, language detection, **How to add a language**, calibrating `nameBox`, deployment, privacy, links to spec and plan.
- [ ] Commit: `docs: add readme with instructions for adding a language`

### Task 13 (blocked): Place final templates, choose fonts, calibrate, go live

Blocked until the final designs exist for `uk` (redesign), `en` and `he`, and until fonts are chosen.

- [ ] Put the final PDFs at `public/locales/<lang>/template.pdf` for each locale, replacing the temporary copies; move the old template to `assets/` as an archive (`template-2025.pdf` already lives there).
- [ ] Choose the font(s) with the designers; for `he` it must contain Hebrew, Latin, `׳`, `״` and niqqud. Add font files and licences under `public/fonts/`; point each locale's `fontUrl` at it.
- [ ] Measure and set `nameBox` per locale (`uk` included, since its design changes), as in v1: measure on the template, then compare against rendered output.
- [ ] Add a Hebrew example CSV and rendering tests with real Hebrew glyphs.
- [ ] Check output on long names, two-line names, Hebrew with niqqud, mixed scripts.
- [ ] **Zip check on Windows and macOS** (Hebrew and Ukrainian names): names correct in Explorer/Finder/Archive Utility.
- [ ] Native-speaker review of UI strings.
- [ ] Flip `status` to `ready`. Commit per locale: `feat: enable <lang> locale`
