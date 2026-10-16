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
| `netlify.toml` | Catch-all rewrite `/*` → `/index.html` (200) |
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

- [x] `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label` attributes in `index.html`; `applyToDocument()` sets text, placeholder, aria-label, `<title>`, `<html lang dir>`. The static `<title>` stays as a pre-JS fallback.
- [x] `main.ts` calls `t()` instead of literals; plural form chosen by `Intl.PluralRules` inside `translate()` (`plural.ts` is removed in Task 4).
- [x] Tests: `translate()` (placeholders, uk plural forms, fallback) and a check that every `data-i18n*` key in `index.html` exists in every locale.
- The active locale is fixed to `uk` until Task 5.
- [ ] Commit: `feat: localize static markup and runtime messages`

### Task 4: Plurals via Intl.PluralRules

**Files:** Delete `src/plural.ts` and `tests/plural.test.ts`; extend `tests/i18n.test.ts`.

- [x] `translate()` (Task 3) already selects forms with `Intl.PluralRules(code)`, so `pluralUk` is simply removed. Its cases (1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111) moved into `i18n.test.ts`.
- [x] `en` (`one`/`other`) and `he` (`one`/`two`/`other`) are tested with stand-in locales, because those locales do not exist yet (Task 11).
- [ ] Commit: `refactor: use Intl.PluralRules instead of pluralUk`

### Task 5: Language detection and routing

**Files:** Create `src/detect-locale.ts`, `src/router.ts`, `tests/detect-locale.test.ts`, `tests/router.test.ts`; rename `src/main.ts` → `src/app.ts` and add a small new `src/main.ts`; modify `src/i18n.ts`.

- [x] Implement spec rules: path segment → `navigator.languages` in order (`ru`→`uk`, `iw`→`he`) → `en`. While `en` is not registered (until Task 11) the fallback is the first supported locale.
- [x] Tests: `/uk/`, `/he` (no slash), `/HE/`, unknown `/fr/`, `['ru-RU','en']`→`uk`, `['de','he-IL']`→`he`, `['de']`→`en`, `[]`→`en`, alias whose target is unsupported, inherited keys (`constructor`).
- [x] `main.ts` is now the entry point: `route()` makes the URL canonical (`/<code>/`, keeps query and hash) via `location.replace` and activates the locale; only then `app.ts` (the former `main.ts`) is imported, so nothing runs on a redirecting page. `i18n.ts` gets `setLocale()`.
- [x] Added after Task 11 (found on the preview: `/ru/` went to English in an English browser): the aliases `ru` → `uk` and `iw` → `he` also apply to the code in the URL, not only to the browser's languages. Tests in `detect-locale` and `router`.
- Not deployable on its own: `/uk/` returns 404 on Netlify until the rewrite of Task 6 is in. Merge Tasks 5 and 6 together.
- The supported set is every registered locale for now; Task 9 restricts it to `ready` locales in production and adds the tests for both sets.

### Task 6: Per-locale assets and Netlify rewrites

**Files:** Move `public/template.pdf` → `public/locales/uk/template.pdf` and `public/examples/spysok-uchniv.csv` → `public/locales/uk/example.csv`; modify `src/locales/types.ts`, `src/locales/uk.ts`, `src/i18n.ts`, `src/app.ts`, `index.html`, `netlify.toml`, `tests/example-csv.test.ts`, `tests/certificate.test.ts`, `tests/locales.test.ts`.

- [x] `Locale` gets `templateUrl`, `fontUrl`, `exampleCsvUrl` (absolute `/locales/...` and `/fonts/...`); `app.ts` loads assets from the active locale and the example link is set from `exampleCsvUrl` (`data-example-csv`). `BASE_URL` is no longer used.
- [x] Tests read assets through the locale; a registry test checks that every referenced file exists under `public/`.
- [x] `netlify.toml`: one catch-all rewrite `/*` → `/index.html` (200), so unknown codes (`/fr/`, `/en/` while draft) reach the page and go through language detection as the spec requires. The first version covered only `/uk` and returned Netlify's 404 for everything else; found on the deploy preview and fixed.
- [x] `vite preview` serves the page for every path, so it cannot confirm rewrites. Verify on the deploy preview: `/`, `/uk`, `/UK/`, `/fr/`, `/en/`, `/he/` all end on a supported language (`/uk/` until `en` exists); template, font and example CSV load from their new paths.
- [x] Commits: `chore: move template and example csv under locales/uk`, `build: netlify rewrites for language routes`, `build: rewrite all paths to the language-aware page`

### Task 7: Per-locale import, normalisation and file names

**Files:** Modify `src/csv.ts`, `src/names.ts`, `src/filenames.ts`, `src/app.ts`, `src/locales/{types,index,uk}.ts` and their tests.

- [x] `decodeText(bytes, fallbackEncoding)`; `parseCsvNames(text, headerWords, policy)`. `Locale.csv` holds the header words and the fallback encoding (`uk`: `windows-1251`). Header words are split with `\p{M}` so niqqud stays attached. Tests for `windows-1255`, `windows-1252`, UTF-8 preferred over the fallback, Hebrew header words, and not borrowing another locale's words.
- [x] `normalizeName(raw, policy)`; `Locale.name.apostrophes` lists the characters rewritten to `’` (`uk`: `'ʼ` and the backtick, as before; a locale whose font draws `'` lists only `ʼ`). Names are NFC-normalised here, so drawing and file naming both get the composed form. Tests: `é ñ ü ø ł ß` kept, decomposed `é` composed, `O'Brien` and `ג'ורג'` untouched under the minimal policy.
- [x] `Locale.fileNameStrategy`: `'kmu-2010'` (`uk`: transliterate Cyrillic, keep every other letter) or `'keep'` (`en`, `he`). Shared sanitiser keeps `\p{L}\p{M}\p{N}`; strips bidi controls; drops apostrophes; collapses the rest to `_`; caps the name at 100 UTF-8 bytes on grapheme boundaries; `student` fallback. Tests include `José` (both strategies), decomposed `é`, Hebrew with and without niqqud, forbidden characters, bidi controls, long names.
- [x] `tests/zip.test.ts`: entries with Hebrew and `é` round-trip and carry the UTF-8 file-name flag. Display in Windows Explorer and macOS Archive Utility still has to be checked by hand (Task 13).
- Behaviour on `/uk/` is unchanged except that `é` and other non-Cyrillic letters now survive in file names (`José` was `Jos`).
- [x] Commits: `refactor: per-locale csv header words and fallback encoding`, `refactor: per-locale name normalization policy`, `feat: per-locale zip entry names`

### Task 8: RTL-ready UI

**Files:** Modify `src/styles.css`, `index.html`, `src/i18n.ts`, `src/app.ts`, tests.

- [x] CSS: the grid, flex rows and `text-align` already follow `dir`, so only physical names needed changing (`.actions`: `inset-inline` / `inset-block-end`). Pager arrows sit in `<span class="arrow" aria-hidden="true">` and are mirrored with `scaleX(-1)` under `:root[dir='rtl']`.
- [x] `<textarea dir="auto">`, so lines in Hebrew and Latin align naturally.
- [x] Found by forcing `dir=rtl` on the Ukrainian page: the name on the preview canvas had overlapping letters, because pdf.js `fillText` follows the canvas's CSS direction. Fixed with `direction: ltr` on `#preview-canvas` (test in `tests/styles.test.ts`). The page counter is `dir="ltr"` too, otherwise "2 / 4" shows as "4 / 2".
- [x] `isolate()` (FSI…PDI) around the imported file name in the status message.
- [x] Tests: `isolate`, and `index.html` has `dir="auto"` on the names list and two aria-hidden arrows.
- To check by eye: `npm run dev`, then in the browser console `document.documentElement.dir = 'rtl'`: the page mirrors (preview to the right, pager and buttons reversed, arrows pointing the right way, and the name on the certificate still drawn correctly). Ukrainian text on a forced-rtl page shows displaced quotes and full stops; that is the bidi algorithm on left-to-right text and disappears with real Hebrew text.
- [x] Commits: `feat: rtl-ready layout with logical css properties`, `feat: isolate user data in status messages`

### Task 9: Draft locale gating

There is no language switcher: the language is chosen only by the code in the URL.

**Files:** Modify `src/locales/index.ts`, `src/router.ts`, `netlify.toml`; tests `locales`, `router`, new `netlify-config`.

- [x] `supportedLocales()` = registered locales filtered by `filterLocales(locales, includeDrafts)`. Drafts are included when `import.meta.env.DEV` (`npm run dev`) or `VITE_ENABLE_DRAFT_LOCALES === 'true'`; a local `vite build` + `vite preview` behaves like production. `route()` takes the locale list as a parameter, so tests can use stand-in drafts.
- [x] `netlify.toml`: `[context.production.environment]` `false`; `[context.deploy-preview.environment]` and `[context.branch-deploy.environment]` `true`.
- [x] Tests: production set is ready-only and `uk` is ready; `/en/` in production falls through to detection; with drafts `/en/` is served and English is the fallback for unknown codes; `netlify.toml` has the three contexts and the catch-all rewrite.
- [ ] Verify on Netlify now that Task 11 added `en` and `he` (see the checklist in Task 11): the preview serves `/en/` and `/he/`, production redirects both to a ready locale. Until Task 11 the only visible check is that nothing regressed on `/uk/`, and that the build still succeeds with the new `[context.*]` tables.
- [ ] Pull request description lists the known limits: draft locales use the Ukrainian certificate text; Hebrew names cannot be drawn with the current font; Hebrew/English wording not yet reviewed. (Written when `en`/`he` land.)
- [x] Commit: `feat: gate draft locales to dev and deploy previews`

### Task 10: Hebrew rendering in PDF

**Files:** `package.json`, `package-lock.json`; create `src/bidi.ts`, `src/glyphs.ts`, `tests/bidi.test.ts`, `tests/glyphs.test.ts`; modify `src/certificate.ts`, `src/names.ts`, `src/filenames.ts`, `src/app.ts`, `src/locales/{types,uk}.ts`, tests.

- [x] `npm install bidi-js` (1.1.0; pulls in `require-from-string`).
- [x] Finding while checking real output: fontkit (inside pdf-lib) reverses all glyphs of a text whose first lettered character is from a right-to-left script. A ready-made visual string is therefore reversed twice (a Latin word inside Hebrew came out mirrored). The plan's `toVisual(text)` became `visualRuns(text, dir)`: runs of one direction in visual order, each handed over in logical order, and `glyphOrderInput(run, engineReverses)` compensates where the engine disagrees with the run. `certificate.ts` probes fontkit (`createEngineProbe`) and draws run by run; layout and sizing stay on the logical text.
- [x] Bidi control characters are stripped when names are read (shared `BIDI_CONTROLS`, also used for file names).
- [x] Glyph coverage check before generation: a missing glyph prints as an empty box without any error (seen with a Hebrew name and the current font). `splitByCoverage()` separates the names the font can draw from those it cannot, with the missing characters of each. First version refused the whole list with a line in the status bar; changed after trying it (one bad name blocked a whole class and the line went unnoticed).
- [x] Skip dialog (`src/skip-dialog.ts`, native `<dialog>` in `index.html`): lists each name that cannot be drawn with its missing characters, and offers "back to editing" (default focus) or "create for the rest (N)"; only "back" when nothing can be drawn. After carrying on, the status line reports how many names were left out (`generatedSkipped`). All texts are locale messages; the markup and styles are minimal because the design will change.
- [x] Tests: `visualRuns` (pure Hebrew, niqqud, geresh/gershayim, Latin and digits inside Hebrew, brackets, decomposed é, emoji, ltr locale), `glyphOrderInput`, the fontkit probe (Hebrew/Arabic first letter, neutrals, empty), stripping of bidi controls, coverage with fake and bundled fonts, and Latin/Cyrillic names under an rtl locale.
- Checked by eye with a system font that has Hebrew (not part of the repo): `דני כהן`, `Ivan דני`, `דני Ivan`, `דני 12`, `דני (שלום)`, niqqud, `José Müller`, Cyrillic all come out in the right order. There is no Hebrew font in the repo, so rendering tests with real glyphs wait for Task 13.
- [x] Commits: `build: add bidi-js`, `feat: refuse names the font cannot draw`, `feat: draw right-to-left names run by run`, `docs: record the fontkit reversal and finish plan task 10`, `feat: let the teacher skip names the font cannot draw`

### Task 11: `en` and `he` locales (draft)

**Files:** Create `src/locales/en.ts`, `src/locales/he.ts`, `public/locales/{en,he}/template.pdf`, `public/locales/{en,he}/example.csv`; modify `src/locales/index.ts` and tests.

- [x] Messages translated into English and Hebrew (every key; plural forms `one`/`other` for English and `one`/`two`/`other` for Hebrew, a test checks that each language defines all the forms it needs). The wording is a first draft: **a native speaker must review the Hebrew and the English before `ready`** (Task 13). The Hebrew name of the initiative, "שעה של בינה מלאכותית", is my best guess and also needs checking.
- [x] `template.pdf` for `en` and `he` is a copy of the current template; same `nameBox`. Font is the current Wix Madefor Display Bold for every locale (it has no Hebrew; see spec).
- [x] `csv`: `en` uses `windows-1252` and English header words; `he` uses `windows-1255` and Hebrew header words (also the Latin ones). `name.apostrophes` is `ʼ` only for both, so `O'Brien` and `ג'ורג'` stay as typed; `fileNameStrategy` is `keep`.
- [x] Example CSVs: Latin names with diacritics for `en`; Hebrew names under a Hebrew header for `he`. The check for unsupported characters only looks at the names in the list when certificates are created, not at the example file, so with the current font (no Hebrew) uploading the Hebrew example and creating certificates shows the skip dialog until a Hebrew font is chosen (Task 13). `he` is a draft, so only previews show this.
- [x] Both are `draft`: reachable in dev and on deploy previews, not in production. Tests: every plural form present, registry order and directions, only `uk` ready, example CSVs parse.
- [ ] To verify on the deploy preview (this also closes the check left open in Task 9): `/en/` and `/he/` open (Hebrew mirrored, certificate text is still Ukrainian); an unknown code (`/fr/`) goes to `/en/` for a non-Ukrainian browser; the example CSV of each language loads and generates; on the production site (`main`) `/en/` and `/he/` still end on `/uk/`.
- [x] Commits: `feat: add english locale (draft)`, `feat: add hebrew locale (draft)`

### Task 12: README

**Files:** Create `README.md`.

- [ ] Contents as agreed: purpose, languages and URL scheme, run/test/build, structure, language detection, **How to add a language**, calibrating `nameBox`, deployment, privacy, links to spec and plan.
- [ ] Commit: `docs: add readme with instructions for adding a language`

### Task 13 (blocked): Place final templates, choose fonts, calibrate, go live

Blocked until the final designs exist for `uk` (redesign), `en` and `he`, and until fonts are chosen.

- [ ] Put the final PDFs at `public/locales/<lang>/template.pdf` for each locale, replacing the temporary copies; move the old template to `assets/` as an archive (`template-2025.pdf` already lives there).
- [ ] Choose the font(s) with the designers; for `he` it must contain Hebrew, Latin, `׳`, `״` and niqqud. Add font files and licences under `public/fonts/`; point each locale's `fontUrl` at it.
- [ ] Measure and set `nameBox` per locale (`uk` included, since its design changes), as in v1: measure on the template, then compare against rendered output.
- [ ] Rendering tests with real Hebrew glyphs (the Hebrew example CSV already exists).
- [ ] Check output on long names, two-line names, Hebrew with niqqud, mixed scripts.
- [ ] **Zip check on Windows and macOS** (Hebrew and Ukrainian names): names correct in Explorer/Finder/Archive Utility.
- [ ] Native-speaker review of UI strings.
- [ ] Flip `status` to `ready`. Commit per locale: `feat: enable <lang> locale`
