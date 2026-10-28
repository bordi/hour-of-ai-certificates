# Hour of AI certificates

A web page where a teacher pastes or uploads a class list and gets a named certificate for every student: a preview, one
`.zip` with a PDF per student, and a single PDF for printing. Made for the participants of
[Hour of AI](https://hourofai.com.ua) ("Година ШІ"), an initiative that gives students a first hour of hands-on AI.

Everything happens in the browser. Names are never sent anywhere, there is no backend and no analytics.

## Languages

The language is chosen by the code in the URL: `/uk/`, `/en/`, `/he/`. There is no language switcher.

| Code | Language | Status |
|---|---|---|
| `uk` | Ukrainian | ready |
| `en` | English | draft |
| `he` | Hebrew (right to left) | draft |
| `ar` | Arabic | not approved; may be added later |

**Draft** means not ready for the live site yet: the final template, its calibration, reviewed texts and the zip check are not
all in place (`he` has its final template; `en` still uses a copy of the Ukrainian one). Drafts are served by `npm run dev` and on
Netlify deploy previews, never on the production site.

The Hebrew page is for the Israeli initiative [Hour of Vibe Code](https://hourofvibecode.co.il) ("שעת הוויב קוד").

### Which language a visitor gets

1. A supported code in the URL, or an alias of one (`/ru/` → `uk`, `/iw/` → `he`). Codes are case-insensitive; `/uk` and `/UK/` become `/uk/`.
2. Otherwise the first of the browser's languages that is supported (`ru` → `uk`).
3. Otherwise English. While English is a draft, production falls back to Ukrainian.

Unknown codes such as `/fr/` take the same path as a missing code. The page is one `index.html`; Netlify rewrites every path
to it, and the script does the redirecting.

## Run it

Node 24 (the version Netlify builds with).

```bash
npm install
npm run dev       # dev server; draft languages included
npm test          # unit tests (vitest)
npm run build     # type check + production build into dist/
npm run preview   # serve dist/ locally; behaves like production (no drafts)
```

`vite dev` and `vite preview` serve `index.html` for every path, so they hide hosting problems. Anything about routing,
rewrites, redirects or headers has to be checked on a Netlify deploy preview.

## How it is put together

Vanilla TypeScript with Vite; no framework. Pure modules are unit-tested in Node; only `app.ts` touches the page.

```
index.html                 markup (texts are filled in from the locale: data-i18n attributes)
src/main.ts                entry: routes to a language, then loads app.ts
src/router.ts              makes the URL canonical (/<code>/), activates the locale
src/detect-locale.ts       URL code / browser languages → locale code
src/i18n.ts                t(), plural forms (Intl.PluralRules), <html lang dir>
src/locales/               one file per language + the registry; types in types.ts
src/app.ts                 page logic: list, import, generate, download, print
src/names.ts, csv.ts       reading the list (apostrophes, NFC, CSV encodings, header rows)
src/certificate.ts         stamps names on the template with pdf-lib
src/layout.ts              name size and one/two-line wrapping
src/bidi.ts                right-to-left names (Unicode bidi, run by run)
src/glyphs.ts, skip-dialog.ts   names the font cannot draw, and the dialog about them
src/filenames.ts, zip.ts   file names inside the .zip
src/preview.ts             pdf.js preview
public/locales/<code>/     template.pdf and example.csv of each language
public/fonts/              certificate fonts, the Hebrew UI font, and their licence
docs/superpowers/          design specs and implementation plans
```

Details and the reasons behind decisions are in
[the multilingual design](docs/superpowers/specs/2026-10-15-multilingual-design.md) and its
[plan](docs/superpowers/plans/2026-10-15-multilingual.md) (task list with what is done). The first version is described in
[the original spec](docs/superpowers/specs/2026-10-08-pdf-certificates-design.md).

## Add a language

1. **Locale file.** Copy `src/locales/en.ts` to `src/locales/<code>.ts` (ISO 639-1 code) and fill in everything:
   direction (`ltr`/`rtl`), asset URLs, CSV header words and fallback encoding (what Excel writes for that language), the name
   policy, the zip file-name strategy, and **every message**. Messages that depend on a number need all the plural forms of the
   language (a test checks this against `Intl.PluralRules`). Start with `status: 'draft'`.
2. **Register it** in `src/locales/index.ts`.
3. **Assets** in `public/locales/<code>/`: `template.pdf` (A4-landscape proportions, any size; the name area left empty) and
   `example.csv` (UTF-8 with BOM, a header row, names the font can draw).
4. **Font.** The certificate font must contain every letter of the language **and** Latin letters (foreign names), plus the
   apostrophe `’`. Check with `splitByCoverage` (`src/glyphs.ts`) or just try the example. Use a TrueType (`.ttf`) font under
   the SIL OFL, add it to `public/fonts/` with its licence, and point `fontUrl` at it. A test checks that the font draws every name of the
   example list. If the font has no bold weight, `nameStyle.emboldening` gives a synthetic bold. A right-to-left language
   needs no extra code: the page mirrors and names are reordered automatically. If Wix Madefor Text (the UI font) lacks the
   script, add an `@font-face` for it in `src/styles.css`, limited by `unicode-range`, as for Hebrew.
5. **Aliases.** If the language has a legacy or neighbouring code that should lead to it, add it to `ALIASES` in
   `src/detect-locale.ts`.
6. **Tests.** Add the example's expected names to `EXPECTED` in `tests/example-csv.test.ts`, then run `npm test`.
7. **Check it** with `npm run dev` at `/<code>/`, and later on a deploy preview.
8. **Go live** by changing `status` to `'ready'` only when all of these are true: the final template is in place and the name
   position is calibrated; the translations were reviewed by a native speaker; a `.zip` of names in that language opens with the
   right names on both Windows and macOS. No Netlify change is needed (one rewrite serves every path).

## Where the name goes on the certificate

Each locale has a `nameStyle`: `box` (PDF points of that template, origin bottom-left), `color` (sRGB 0–1, take it from the
template) and `emboldening` (synthetic bold as a fraction of the font size; 0 for a bold font).

| `box` field | Meaning |
|---|---|
| `centerX` | horizontal centre of the name |
| `maxWidth` | widest a line may be |
| `baselineY` | baseline of a one-line name |
| `maxSize`, `minSize` | font size range for one line (the size shrinks to fit) |
| `twoLineMaxSize`, `twoLineBottomY`, `lineHeight` | the two-line layout used when one line would be smaller than `minSize` |

`uk` and `en` use the 2025 Ukrainian template's style (`NAME_BOX` in `src/layout.ts`); `he` has its own in `src/locales/he.ts`.
To calibrate a new template: find the name line and the label above it, place the baseline so descenders clear the line and the
tallest letters stay under the label (the font's metrics tell you how far they reach), then create certificates for a short name, a
very long one (two lines), a mixed one and one with accents, and look at the PDF. The spec's "Template calibration" has the
measurements of each template. A test checks that each box lies inside its template.

## Deployment

Netlify builds `main` (`npm run build`, publish `dist/`) and builds deploy previews for pull requests. `netlify.toml` holds
the build settings, a single rewrite of every path to `/index.html`, security headers, and the per-context flag that shows draft
languages only on previews. Production never shows them.

## Known limits

- `uk` and `en` print with Wix Madefor Display Bold, which has **no Hebrew**; there a Hebrew name is listed in a dialog that
  offers to create certificates for the rest. This is intended: Israel has its own initiative and page (`/he/`). `he` prints with Wix Madefor Hebrew SemiBold, which covers Hebrew, Latin and Cyrillic.
- **Niqqud** (Hebrew vowel marks) is not positioned correctly in the PDF yet: pdf-lib ignores the font's mark positioning.
- pdf-lib cannot subset `.otf` (CFF) fonts correctly, so such a font would be embedded whole; all fonts in use are `.ttf`.
  Always check generated PDFs in a viewer other than the page preview (pdf.js hides this kind of problem), e.g. macOS
  Preview or Acrobat.
- The English and Hebrew texts are a first draft and need a native speaker's review.
- Final templates for `uk` (redesign) and `en` are still to come (plan, task 13); `he` has its final template. The UI is not final either; texts live in the locale
  files, so a new design only replaces `index.html` and `src/styles.css`.
