# Manual testing

What to check by hand before a change goes live, and how. Unit tests (`npm test`) cover the pure modules; this list covers what only
a real browser, a real deploy and a real PDF viewer show. Run it on a **Netlify deploy preview** (it has the draft languages and the
real hosting); `vite dev` and `vite preview` serve every path themselves and hide routing and header problems.

`<preview>` below is the deploy preview's address. The lists to upload are in [`tests/fixtures/`](../tests/fixtures/);
`tests/fixtures.test.ts` keeps each of them true to what is promised here.

| File | What it checks |
|---|---|
| `he-excel-windows-1255.csv` | A Hebrew Excel export: `windows-1255`, two columns joined by `;`, header row |
| `he-utf8-bom.csv` | UTF-8 with BOM: Hebrew, Latin with accents, Cyrillic, a mixed name |
| `uk-excel-windows-1251.csv` | A Ukrainian Excel export: `windows-1251`, apostrophe `'` |
| `lt-excel-windows-1257.csv` | A Lithuanian Excel export: `windows-1257`, every Lithuanian letter, small and capital |
| `uk-with-hebrew.txt` | A Hebrew name on `uk`/`en`/`lt`, whose font has no Hebrew: the skip dialog |
| `he-300-names.txt`, `he-301-names.txt` | The 300-name limit (one name per line, no header: the first name `נועה כהן` must be in the list) |

Each language also has its own example (`<preview>/locales/<code>/example.csv`, the "download an example" link on the page).

## 1. Routing

| Open | Expected |
|---|---|
| `<preview>/uk/`, `/en/`, `/he/`, `/lt/` | That language; `/he/` right to left |
| `<preview>/UK`, `/LT` | Address becomes `/uk/`, `/lt/` |
| `<preview>/ru/` | Address becomes `/uk/` |
| `<preview>/iw/` | Address becomes `/he/` |
| `<preview>/fr/`, `<preview>/` | The browser's language if supported (Lithuanian browser → `/lt/`), otherwise `/en/` |
| `<preview>/he/any/thing` | The Hebrew page, not a 404 |
| `<preview>/fonts/WMHTV8-SemiBold.ttf`, `<preview>/locales/he/template.pdf` | The file itself, not the page |

On the **production** site (after a merge to `main`) the draft languages must not open: `/en/`, `/he/`, `/lt/` end on `/uk/`.

## 2. `/he/`

1. **Interface**: Hebrew text in Wix Madefor Hebrew (shapes like the template's, not Lucida Grande or another system font); headings
   and buttons heavier than body text; pager arrows mirrored; page counter reads `1 / N`.
2. **Example**: download it, upload it, create certificates. The preview shows the names on the Hebrew template.
3. **`he-excel-windows-1255.csv`**: 5 names, header skipped — `נועה בן-דוד`, `ג'ורג' אבו-חצירא`, `יעל כהן`,
   `אלכסנדרה וולקובסקי-רוזנברג בן עמי` (long: shrinks or wraps to two lines), `מיכאל (מיקי) לוי 2` (brackets the right way
   round, the digit at the end).
4. **`he-utf8-bom.csv`**: 5 names, no skip dialog — `דני כהן`, `שרה לוי`, `José Núñez`, `Мар’яна Ґудзь`, `Ivan דני`.
5. **Download (.zip)**: the archive is `תעודות.zip`; entries keep their letters (`01_נועה_בן_דוד.pdf`). Open several PDFs in **macOS
   Preview** (not only the browser): the name in SemiBold, in the template's blue, no boxes, no `!"#$%`.
6. **Print**: a new tab with one PDF of all pages. If the browser blocks it, a message asks to allow pop-ups.
7. **Edit after creating**: a message says the list changed; download and print stay off until certificates are created again.
8. **Limit**: `he-300-names.txt` generates (a few seconds); `he-301-names.txt` gives the "maximum 300" error.

## 3. `/uk/`

1. **`uk-excel-windows-1251.csv`**: 4 names — `Шевченко Тарас`, `Мар’яненко Ґанна` (`'` became `’`), `Їжакевич-Сірко Євгенія`,
   `Йосипенко Юрій`.
2. **Zip**: `sertyfikaty.zip`; entries in Latin letters (KMU-2010), e.g. `01_Shevchenko_Taras.pdf`; PDFs open in Preview.
3. **`uk-with-hebrew.txt`**: the skip dialog names `דני כהן` and its missing letters. "Back" or Escape returns to the list;
   "create for the rest (3)" gives 3 certificates and the status names the skipped one.

## 4. `/lt/`

1. Interface in Lithuanian, every letter drawn (ą č ę ė į š ų ū ž, „“).
2. **`lt-excel-windows-1257.csv`**: 5 names — `Ąžuolas Čiurlionis`, `Kęstutis Šimkus`, `Rūta Petraitytė-Žemaitienė`,
   `Įgaudė Mažylienė`, `ąčęėįšųūž ĄČĘĖĮŠŲŪŽ`; no skip dialog. Accents sit on their letters in the PDF (macOS Preview).
3. **Zip**: `sertifikatai.zip`; entries keep the letters, e.g. `03_Rūta_Petraitytė_Žemaitienė.pdf`.
4. `uk-with-hebrew.txt` gives the skip dialog, as on `/uk/`.
5. While the template is a copy of the Ukrainian one, its own text (e.g. "отримує") is Ukrainian. Expected.

## 5. `/en/`

Opens, creates certificates (`certificates.zip`), and `uk-with-hebrew.txt` gives the skip dialog.

## 6. Netlify only (DevTools → Network, filter Font)

- `/he/` loads `WMHTV8-Regular.ttf` and `WMHTV8-SemiBold.ttf`; `/uk/` and `/lt/` load neither.
- `WMHTV8-SemiBold.ttf` is requested twice on `/he/` (by the CSS and by the certificate generator); the second request should be
  answered from cache or with `304`, not downloaded again.

## 7. Outside the browser

- **Windows**: unpack a zip with Hebrew, Lithuanian, accented and Ukrainian names in Explorer; file and archive names are right.
- **Acrobat Reader and a printer**: open and print one certificate of each template.

## Tips for checking

- Check PDFs with a viewer other than pdf.js (the page preview): macOS Preview, or `sips -s format png file.pdf --out file.png`
  / `qlmanage -t -s 2000 -o . file.pdf`. pdf.js hid a broken font once.
- macOS's command-line `unzip` shows UTF-8 entry names garbled even when they are right; Archive Utility, Explorer or Python's
  `zipfile` show the real names.
- Headless Chrome ignores `--lang`; to simulate a browser language use `--accept-lang=lt-LT,lt`.
