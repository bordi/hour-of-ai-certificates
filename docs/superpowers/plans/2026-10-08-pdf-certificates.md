# Hour of AI Certificate Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, client-side web page where a teacher pastes or uploads a class list and gets named "Hour of AI" certificates: carousel preview, .zip download, and one combined PDF for printing.

**Architecture:** Vite + vanilla TypeScript single page. Pure modules (name parsing, CSV decoding, transliteration, text layout) are unit-tested in Node with Vitest. PDF generation uses pdf-lib to stamp the name onto the existing template PDF with an embedded Cyrillic-capable font. pdf.js renders the preview, and JSZip builds the archive. No backend. Deployed to Netlify as static files.

**Tech Stack:** TypeScript, Vite, Vitest, pdf-lib + @pdf-lib/fontkit, pdfjs-dist, jszip, papaparse.

**Spec:** `docs/superpowers/specs/2026-10-08-pdf-certificates-design.md`. Read it first.

---

## File map

| File | Responsibility |
|---|---|
| `public/template.pdf` | Certificate background (copy of `assets/template-2025.pdf`) |
| `public/fonts/WixMadeforDisplay-Bold.ttf` | Static Bold instance of Wix Madefor Display (OFL, Cyrillic) |
| `public/fonts/OFL.txt` | Font licence (required by OFL when redistributing) |
| `src/names.ts` | Textarea text → clean list of names; `MAX_NAMES` |
| `src/csv.ts` | File bytes → text (UTF-8 / windows-1251); CSV/TXT → names |
| `src/filenames.ts` | Ukrainian → Latin transliteration (KMU 2010); zip entry names |
| `src/layout.ts` | Pure name layout: font size, 1 or 2 lines, baselines |
| `src/certificate.ts` | pdf-lib: names → PDF bytes (one page per name) |
| `src/zip.ts` | Files → zip bytes |
| `src/preview.ts` | pdf.js canvas renderer with page navigation |
| `src/main.ts` | DOM wiring and state |
| `src/styles.css` | Page styles |
| `index.html` | Markup (Ukrainian UI) |
| `tests/*.test.ts` | Vitest tests, one per pure module + certificate integration |
| `netlify.toml` | Build config |

---

### Task 0: Scaffold the project

**Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`

Git is already initialised (branch `main`). Remote: private GitHub repo `bordi/hour-of-ai-certificates`. Push after each task (`git push`).

- [ ] **Step 1: Init npm, install deps**

```bash
cd /Users/artemb/Projects/pdf-certificates
npm init -y
npm pkg set name=hour-of-ai-certificates private=true type=module
npm pkg delete main
npm pkg set scripts.dev="vite" scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview" scripts.test="vitest run"
npm i pdf-lib @pdf-lib/fontkit pdfjs-dist jszip papaparse
npm i -D vite typescript vitest @types/papaparse @types/node
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', testTimeout: 20000 },
});
```

- [ ] **Step 4: Check that `.gitignore` already exists** (it covers `node_modules dist out .netlify .DS_Store`)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite + vitest project"
```

---

### Task 1: Assets (template + Cyrillic font)

**Files:** Create `public/template.pdf`, `public/fonts/WixMadeforDisplay-Bold.ttf`, `public/fonts/OFL.txt`

The fonts installed on this Mac (`/Library/Fonts/Managed/WixMadefor*App*`) have **no Cyrillic**. Use the Google Fonts release instead.

- [ ] **Step 1: Copy template**

```bash
mkdir -p public/fonts && cp assets/template-2025.pdf public/template.pdf
```

- [ ] **Step 2: Download the variable font into its own scratch dir**

```bash
mkdir -p /tmp/madefor-dl && cd /tmp/madefor-dl
curl -fL -o WixMadeforDisplay.ttf "https://github.com/google/fonts/raw/main/ofl/wixmadefordisplay/WixMadeforDisplay%5Bwght%5D.ttf"
curl -fL -o OFL.txt "https://github.com/google/fonts/raw/main/ofl/wixmadefordisplay/OFL.txt"
ls -la
```

Expected: both files are non-empty. If the URL 404s, check https://github.com/google/fonts/tree/main/ofl/wixmadefordisplay for the current file name.

- [ ] **Step 3: Make a static Bold (wght=700) instance.** pdf-lib/fontkit embeds only the default instance of a variable font, which is Regular, so a static file is required.

```bash
cd /tmp/madefor-dl
python3 -I -m fontTools.varLib.instancer WixMadeforDisplay.ttf wght=700 -o WixMadeforDisplay-Bold.ttf
cp WixMadeforDisplay-Bold.ttf OFL.txt /Users/artemb/Projects/pdf-certificates/public/fonts/
```

- [ ] **Step 4: Verify Ukrainian coverage**

```bash
python3 -I -c "
from fontTools.ttLib import TTFont
cm = TTFont('/Users/artemb/Projects/pdf-certificates/public/fonts/WixMadeforDisplay-Bold.ttf').getBestCmap()
need = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгґдеєжзиіїйклмнопрстуфхцчшщьюя\'ʼ’-'
print('missing:', [c for c in need if ord(c) not in cm])
"
```

Expected: `missing: []`. If `ʼ` (U+02BC) is missing, note it. Task 3 normalises apostrophes to `’` (U+2019) before drawing, so that's acceptable as long as `’` is present.

- [ ] **Step 5: Commit**

```bash
cd /Users/artemb/Projects/pdf-certificates
git add public && git commit -m "chore: add certificate template and Wix Madefor Display Bold (OFL)"
```

---

### Task 2: Name list parsing (`src/names.ts`)

**Files:** Create `src/names.ts`, test `tests/names.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseNames } from '../src/names';

describe('parseNames', () => {
  it('splits lines, trims, collapses whitespace, drops empties', () => {
    const text = '  Шевченко   Тарас \r\n\n\tЛеся Українка\n   \nІван Франко';
    expect(parseNames(text)).toEqual(['Шевченко Тарас', 'Леся Українка', 'Іван Франко']);
  });

  it('keeps duplicates and original order', () => {
    expect(parseNames('Б\nА\nБ')).toEqual(['Б', 'А', 'Б']);
  });

  it('normalises apostrophe variants to ’', () => {
    expect(parseNames("Мар'яна\nМарʼяна\nМар`яна")).toEqual(['Мар’яна', 'Мар’яна', 'Мар’яна']);
  });

  it('returns [] for blank input', () => {
    expect(parseNames('  \n \n')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (`Cannot find module '../src/names'`)

Run: `npx vitest run tests/names.test.ts`

- [ ] **Step 3: Implement**

```ts
export const MAX_NAMES = 300;

export function normalizeName(raw: string): string {
  return raw.replace(/['ʼ`]/g, '’').replace(/\s+/g, ' ').trim();
}

export function parseNames(text: string): string[] {
  return text.split(/\r?\n/).map(normalizeName).filter(Boolean);
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run tests/names.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/names.ts tests/names.test.ts && git commit -m "feat: parse class list from textarea"
```

---

### Task 3: CSV/TXT import (`src/csv.ts`)

**Files:** Create `src/csv.ts`, test `tests/csv.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { decodeText, parseCsvNames } from '../src/csv';

const cp1251 = (s: string) => {
  // minimal encoder for the test: Cyrillic А..я = 0xC0..0xFF, plus і/І/ї/Ї/є/Є/ґ/Ґ
  const extra: Record<string, number> = { 'і': 0xb3, 'І': 0xb2, 'ї': 0xbf, 'Ї': 0xaf, 'є': 0xba, 'Є': 0xaa, 'ґ': 0xb4, 'Ґ': 0xa5 };
  return new Uint8Array([...s].map((c) => {
    const code = c.charCodeAt(0);
    if (extra[c]) return extra[c];
    if (code >= 0x410 && code <= 0x44f) return code - 0x410 + 0xc0;
    return code;
  }));
};

describe('decodeText', () => {
  it('decodes UTF-8 (with BOM)', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Тарас')]);
    expect(decodeText(bytes)).toBe('Тарас');
  });

  it('falls back to windows-1251', () => {
    expect(decodeText(cp1251('Іван;Їжак'))).toBe('Іван;Їжак');
  });
});

describe('parseCsvNames', () => {
  it('one column, no header', () => {
    expect(parseCsvNames('Шевченко Тарас\nУкраїнка Леся\n')).toEqual(['Шевченко Тарас', 'Українка Леся']);
  });

  it('semicolon-separated two columns with header, joined in file order', () => {
    expect(parseCsvNames('Прізвище;Ім’я\nШевченко;Тарас\nУкраїнка;Леся')).toEqual(['Шевченко Тарас', 'Українка Леся']);
  });

  it('comma-separated with quotes and empty cells', () => {
    expect(parseCsvNames('Name,Surname,\n"Тарас","Шевченко",\nЛеся,,Українка\n')).toEqual(['Тарас Шевченко', 'Леся Українка']);
  });

  it('tab-separated, skips blank rows, normalises whitespace', () => {
    expect(parseCsvNames('ПІБ\tКлас\nІван  Франко\t5-А\n\n\t\n')).toEqual(['Іван Франко 5-А']);
  });

  it('does not drop a first row that is a real name', () => {
    expect(parseCsvNames('Тарас;Шевченко\nЛеся;Українка')).toEqual(['Тарас Шевченко', 'Леся Українка']);
  });
});
```

Note: the tab case shows that *all* non-empty columns are joined. That's intended, because the spec says to join cells. Teachers who export extra columns will see them in the textarea and can edit them.

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run tests/csv.test.ts`

- [ ] **Step 3: Implement**

```ts
import Papa from 'papaparse';
import { normalizeName } from './names';

export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1251').decode(bytes);
  }
}

const HEADER_WORDS = ['піб', 'ім’я', 'імя', 'прізвище', 'учень', 'учні', 'клас', 'name', 'surname', 'student'];

function isHeader(row: string[]): boolean {
  return row.some((cell) => {
    const c = cell.toLowerCase();
    return HEADER_WORDS.some((w) => c === w || c.startsWith(w + ' ') || c.endsWith(' ' + w));
  });
}

export function parseCsvNames(text: string): string[] {
  const { data } = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [',', ';', '\t'],
  });
  const rows = data
    .map((row) => row.map(normalizeName).filter(Boolean))
    .filter((row) => row.length > 0);
  if (rows.length > 0 && isHeader(rows[0])) rows.shift();
  return rows.map((row) => row.join(' '));
}
```

Note: Node's `TextDecoder` supports `windows-1251` only with full ICU (the default for official Node builds). If the fallback test throws `RangeError`, check with `node -p "process.versions.icu"`.

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run tests/csv.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/csv.ts tests/csv.test.ts && git commit -m "feat: import class list from CSV/TXT (utf-8 / cp1251)"
```

---

### Task 4: Transliteration and zip entry names (`src/filenames.ts`)

**Files:** Create `src/filenames.ts`, test `tests/filenames.test.ts`

Rules: official Ukrainian transliteration (KMU 2010). `є ї й ю я` → `ye yi y yu ya` at the start of a word, else `ie i i iu ia`. `зг` → `zgh`. `ь` and apostrophes → nothing. A letter after an apostrophe is *not* a word start.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { transliterate, certificateFileName } from '../src/filenames';

describe('transliterate', () => {
  it.each([
    ['Шевченко Тарас', 'Shevchenko Taras'],
    ['Юлія Їжакевич', 'Yuliia Yizhakevych'],
    ['Олексій Яковлев', 'Oleksii Yakovlev'],
    ['Згорани Розгон', 'Zghorany Rozghon'],
    ['Знам’янка', 'Znamianka'],
    ['Щука Ґудзь', 'Shchuka Gudz'],
    ['Євген Йосипенко', 'Yevhen Yosypenko'],
    ['John Smith', 'John Smith'],
  ])('%s → %s', (input, expected) => {
    expect(transliterate(input)).toBe(expected);
  });
});

describe('certificateFileName', () => {
  it('numbers with at least 2 digits and sanitises to ASCII', () => {
    expect(certificateFileName(0, 28, 'Шевченко Тарас')).toBe('01_Shevchenko_Taras.pdf');
    expect(certificateFileName(9, 28, 'Марія-Олена О’Коннор')).toBe('10_Mariia_Olena_OKonnor.pdf');
  });

  it('pads to 3 digits for 100+ names', () => {
    expect(certificateFileName(4, 120, 'Іван')).toBe('005_Ivan.pdf');
  });

  it('falls back when nothing transliterable remains', () => {
    expect(certificateFileName(0, 3, '✨✨')).toBe('01_student.pdf');
  });
});
```

Check `Марія-Олена О’Коннор`: `Mariia` (і→i, я after a letter→ia), `-`, `Olena`, space, `O`, apostrophe dropped, `Konnor` → "Mariia-Olena OKonnor" → sanitised → `Mariia_Olena_OKonnor`.

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run tests/filenames.test.ts`

- [ ] **Step 3: Implement**

```ts
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia',
};
const WORD_START: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };
const APOSTROPHE = /['ʼ’`]/;

const isCyr = (ch: string) => Object.prototype.hasOwnProperty.call(MAP, ch.toLowerCase());

export function transliterate(input: string): string {
  let out = '';
  let prev = '';
  for (const ch of input) {
    if (APOSTROPHE.test(ch)) {
      prev = ch;
      continue;
    }
    const lower = ch.toLowerCase();
    if (!isCyr(ch)) {
      out += ch;
      prev = ch;
      continue;
    }
    const atWordStart = !(prev && (isCyr(prev) || APOSTROPHE.test(prev)));
    let latin = atWordStart && WORD_START[lower] ? WORD_START[lower] : MAP[lower];
    if (lower === 'г' && prev.toLowerCase() === 'з') latin = 'gh';
    if (ch !== lower && latin) latin = latin[0].toUpperCase() + latin.slice(1);
    out += latin;
    prev = ch;
  }
  return out;
}

export function certificateFileName(index: number, total: number, name: string): string {
  const width = Math.max(2, String(total).length);
  const number = String(index + 1).padStart(width, '0');
  const slug = transliterate(name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'student';
  return `${number}_${slug}.pdf`;
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run tests/filenames.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/filenames.ts tests/filenames.test.ts && git commit -m "feat: ASCII zip entry names via KMU-2010 transliteration"
```

---

### Task 5: Name layout (`src/layout.ts`)

**Files:** Create `src/layout.ts`, test `tests/layout.test.ts`

A pure function. Text width is linear in font size, so `size = maxWidth / width@1pt`. Prefer one line. If one line would need a size below `minSize`, try two lines (split at the space that best balances widths) and keep whichever gives the larger size. Coordinates are PDF points, origin bottom-left. These are starting values from the spec; Task 9 calibrates them.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { layoutName, NAME_BOX } from '../src/layout';

// fake font: every char is 0.5em wide
const measure = (text: string, size: number) => text.length * size * 0.5;

describe('layoutName', () => {
  it('short name: one line at max size on the baseline', () => {
    const l = layoutName('Тарас Шевченко', measure);
    expect(l.size).toBe(NAME_BOX.maxSize);
    expect(l.lines).toEqual([{ text: 'Тарас Шевченко', y: NAME_BOX.baselineY }]);
  });

  it('medium name: shrinks on one line while >= minSize', () => {
    const name = 'А'.repeat(40); // width@1 = 20 → 520/20 = 26
    const l = layoutName(name, measure);
    expect(l.lines).toHaveLength(1);
    expect(l.size).toBeCloseTo(26);
  });

  it('long name with spaces: two balanced lines', () => {
    const name = 'А'.repeat(29) + ' ' + 'Б'.repeat(30); // one line → 520/30 = 17.3 < 20
    const l = layoutName(name, measure);
    expect(l.size).toBe(NAME_BOX.twoLineMaxSize);
    expect(l.lines.map((x) => x.text)).toEqual(['А'.repeat(29), 'Б'.repeat(30)]);
    expect(l.lines[1].y).toBe(NAME_BOX.twoLineBottomY);
    expect(l.lines[0].y).toBeCloseTo(NAME_BOX.twoLineBottomY + NAME_BOX.twoLineMaxSize * NAME_BOX.lineHeight);
  });

  it('long name without spaces: single line, shrunk below minSize', () => {
    const name = 'Я'.repeat(70); // 520/35
    const l = layoutName(name, measure);
    expect(l.lines).toHaveLength(1);
    expect(l.size).toBeCloseTo(520 / 35);
  });

  it('balanced split picks the middle space', () => {
    const l = layoutName('Аааааааааааааааа Бббббббббббббббб Вввввввввввввввв Гггггггггггггггг', measure);
    expect(l.lines.map((x) => x.text)).toEqual([
      'Аааааааааааааааа Бббббббббббббббб',
      'Вввввввввввввввв Гггггггггггггггг',
    ]);
  });
});
```

Check for the last case: 67 chars, so one line → 520/33.5 = 15.5 < 20, which means two lines. The middle split gives 33+33 chars → 520/16.5 = 31.5, capped at 26 > 15.5. ✓

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run tests/layout.test.ts`

- [ ] **Step 3: Implement**

```ts
export type Measure = (text: string, size: number) => number;

export interface NameLayout {
  size: number;
  lines: { text: string; y: number }[];
}

/** PDF points, origin bottom-left. Page is 842×595. Calibrated in Task 9. */
export const NAME_BOX = {
  centerX: 421,
  maxWidth: 520,
  baselineY: 350,
  maxSize: 36,
  minSize: 20,
  twoLineMaxSize: 26,
  twoLineBottomY: 346,
  lineHeight: 1.15,
};

export function layoutName(name: string, measure: Measure, box = NAME_BOX): NameLayout {
  const fit = (text: string, max: number) => Math.min(max, box.maxWidth / measure(text, 1));

  const single: NameLayout = { size: fit(name, box.maxSize), lines: [{ text: name, y: box.baselineY }] };
  if (single.size >= box.minSize) return single;

  const words = name.split(' ');
  if (words.length < 2) return single;

  let best: [string, string] | null = null;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const top = words.slice(0, i).join(' ');
    const bottom = words.slice(i).join(' ');
    const width = Math.max(measure(top, 1), measure(bottom, 1));
    if (width < bestWidth) {
      bestWidth = width;
      best = [top, bottom];
    }
  }
  const [top, bottom] = best!;
  const size = Math.min(fit(top, box.twoLineMaxSize), fit(bottom, box.twoLineMaxSize));
  if (size <= single.size) return single;
  return {
    size,
    lines: [
      { text: top, y: box.twoLineBottomY + size * box.lineHeight },
      { text: bottom, y: box.twoLineBottomY },
    ],
  };
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run tests/layout.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/layout.ts tests/layout.test.ts && git commit -m "feat: auto-fit name layout (1–2 lines)"
```

---

### Task 6: PDF generation (`src/certificate.ts`)

**Files:** Create `src/certificate.ts`, test `tests/certificate.test.ts`

All pages for one call are built in **one** document from a **single** `copyPages` call, so the template's images and the font are stored once (a small combined PDF).

- [ ] **Step 1: Write the failing test** (an integration test against the real assets)

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { renderCertificates, type Assets } from '../src/certificate';

const assets: Assets = {
  template: new Uint8Array(readFileSync('public/template.pdf')),
  font: new Uint8Array(readFileSync('public/fonts/WixMadeforDisplay-Bold.ttf')),
};

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    texts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' '));
  }
  return texts;
}

describe('renderCertificates', () => {
  it('one name → one A4-landscape page containing the name', async () => {
    const bytes = await renderCertificates(assets, ['Шевченко Тарас']);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([842, 595]);
    expect((await pageTexts(bytes))[0]).toContain('Шевченко Тарас');
  });

  it('many names → one page per name, in order', async () => {
    const names = ['Леся Українка', 'Іван Франко', 'Мар’яна Ґудзь-Їжакевич'];
    const texts = await pageTexts(await renderCertificates(assets, names));
    expect(texts).toHaveLength(3);
    names.forEach((n, i) => expect(texts[i]).toContain(n));
  });

  it('combined PDF stays small (template resources shared)', async () => {
    const one = await renderCertificates(assets, ['Тарас']);
    const thirty = await renderCertificates(assets, Array.from({ length: 30 }, (_, i) => `Учень ${i}`));
    expect(thirty.byteLength).toBeLessThan(one.byteLength * 3);
  });

  it('very long name is split over two lines and fully present', async () => {
    const name = 'Олександра-Анастасія Костянтинопольська-Вишневецька Святославівна';
    const text = (await pageTexts(await renderCertificates(assets, [name])))[0];
    for (const part of name.split(' ')) expect(text).toContain(part);
  });
});
```

If pdf.js in Node complains about the worker (`No "GlobalWorkerOptions.workerSrc" specified`), add this after the import:
`pdfjs.GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).href;`

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run tests/certificate.test.ts`

- [ ] **Step 3: Implement**

```ts
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { layoutName, NAME_BOX } from './layout';

export interface Assets {
  template: Uint8Array;
  font: Uint8Array;
}

/** Template blue, read from the template's content stream. */
export const NAME_COLOR = rgb(0.180392, 0.317647, 0.956863);

function drawName(page: PDFPage, font: PDFFont, name: string): void {
  const layout = layoutName(name, (t, s) => font.widthOfTextAtSize(t, s));
  for (const line of layout.lines) {
    page.drawText(line.text, {
      x: NAME_BOX.centerX - font.widthOfTextAtSize(line.text, layout.size) / 2,
      y: line.y,
      size: layout.size,
      font,
      color: NAME_COLOR,
    });
  }
}

export async function renderCertificates(assets: Assets, names: string[]): Promise<Uint8Array> {
  const template = await PDFDocument.load(assets.template);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(assets.font, { subset: true });
  const pages = await doc.copyPages(template, names.map(() => 0));
  pages.forEach((page, i) => {
    doc.addPage(page);
    drawName(page, font, names[i]);
  });
  doc.setTitle(names.length === 1 ? `Сертифікат — ${names[0]}` : 'Сертифікати — Година ШІ');
  return doc.save();
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run tests/certificate.test.ts`

If the text test fails with garbled characters, retry with `{ subset: false }` (a known pdf-lib subsetting issue with some fonts) and note it in the commit.

- [ ] **Step 5: Commit**

```bash
git add src/certificate.ts tests/certificate.test.ts && git commit -m "feat: stamp student names onto template with pdf-lib"
```

---

### Task 7: Zip (`src/zip.ts`)

**Files:** Create `src/zip.ts`, test `tests/zip.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildZip } from '../src/zip';

describe('buildZip', () => {
  it('stores every file under its name', async () => {
    const bytes = await buildZip([
      { name: '01_A.pdf', data: new Uint8Array([1, 2]) },
      { name: '02_B.pdf', data: new Uint8Array([3]) },
    ]);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(['01_A.pdf', '02_B.pdf']);
    expect(await zip.file('02_B.pdf')!.async('uint8array')).toEqual(new Uint8Array([3]));
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run tests/zip.test.ts`

- [ ] **Step 3: Implement**

```ts
import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** PDFs are already compressed, so STORE (no deflate) keeps it fast. */
export async function buildZip(entries: ZipEntry[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const e of entries) zip.file(e.name, e.data);
  return zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
}
```

- [ ] **Step 4: Run, expect PASS.** Then run the full suite: `npm test`. Everything should pass.

- [ ] **Step 5: Commit**

```bash
git add src/zip.ts tests/zip.test.ts && git commit -m "feat: zip builder"
```

---

### Task 8: UI (`index.html`, `src/styles.css`, `src/preview.ts`, `src/main.ts`)

**Files:** Create all four. No unit tests: this is DOM wiring over the tested modules, verified manually in Task 9.

- [ ] **Step 1: `index.html`**

```html
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Сертифікати «Година ШІ»</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <header>
      <h1>Сертифікати «Година ШІ»</h1>
      <p class="lead">Вставте список учнів — по одному імені в рядку — і отримайте іменні сертифікати для всього класу.</p>
    </header>

    <main class="layout">
      <section class="preview" aria-label="Попередній перегляд">
        <canvas id="preview-canvas"></canvas>
        <nav class="pager" id="pager" hidden>
          <button type="button" id="prev" aria-label="Попередній">◀</button>
          <span id="page-label">1 / 1</span>
          <button type="button" id="next" aria-label="Наступний">▶</button>
        </nav>
      </section>

      <section class="input">
        <label for="names">Список учнів</label>
        <textarea id="names" spellcheck="false" placeholder="Шевченко Тарас&#10;Українка Леся&#10;Франко Іван"></textarea>
        <div class="input-row">
          <label class="file-button">
            Завантажити CSV / TXT
            <input type="file" id="file" accept=".csv,.txt,text/csv,text/plain" hidden />
          </label>
          <span id="count">Учнів: 0</span>
        </div>
        <p class="hint">Імена друкуються саме так, як ви їх ввели. Дані не залишають ваш комп’ютер.</p>
      </section>
    </main>

    <footer class="actions">
      <button type="button" id="generate" class="primary">Сформувати сертифікати</button>
      <button type="button" id="download" disabled>Завантажити (.zip)</button>
      <button type="button" id="print" disabled>Друкувати</button>
      <span id="status" role="status" aria-live="polite"></span>
    </footer>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: `src/styles.css`**

```css
:root {
  --blue: #2e51f4;
  --ink: #16181d;
  --muted: #5d6270;
  --line: #d9dce3;
  --bg: #f5f6f9;
  font-family: 'Wix Madefor Text', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--ink);
  background: var(--bg);
}
* { box-sizing: border-box; }
body { margin: 0 auto; max-width: 1280px; padding: 24px 32px 120px; }
h1 { margin: 0 0 4px; font-size: 28px; color: var(--blue); }
.lead { margin: 0 0 24px; color: var(--muted); }
.layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 24px; align-items: start; }
.preview { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
#preview-canvas { display: block; width: 100%; height: auto; aspect-ratio: 842 / 595; border-radius: 4px; box-shadow: 0 1px 4px rgb(0 0 0 / 0.12); }
.pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 12px; }
.pager button { min-width: 44px; }
.input { display: flex; flex-direction: column; gap: 8px; }
.input > label { font-weight: 600; }
textarea { width: 100%; min-height: 360px; resize: vertical; padding: 12px; font: inherit; line-height: 1.5; border: 1px solid var(--line); border-radius: 8px; }
.input-row { display: flex; justify-content: space-between; align-items: center; }
.hint { margin: 0; font-size: 13px; color: var(--muted); }
button, .file-button { font: inherit; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: 1px solid var(--blue); background: #fff; color: var(--blue); cursor: pointer; }
button.primary { background: var(--blue); color: #fff; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
.actions { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 12px; align-items: center; justify-content: center; padding: 16px; background: #fff; border-top: 1px solid var(--line); }
#status { min-width: 240px; color: var(--muted); }
#status.error { color: #c62828; }
```

- [ ] **Step 3: `src/preview.ts`**

```ts
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export class Preview {
  private doc: PDFDocumentProxy | null = null;
  private task: RenderTask | null = null;
  page = 1;

  constructor(private canvas: HTMLCanvasElement) {}

  get pageCount(): number {
    return this.doc?.numPages ?? 0;
  }

  async show(bytes: Uint8Array): Promise<void> {
    const old = this.doc;
    this.doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    void old?.destroy();
    this.page = 1;
    await this.render();
  }

  async go(delta: number): Promise<void> {
    const next = Math.min(Math.max(this.page + delta, 1), this.pageCount);
    if (next === this.page) return;
    this.page = next;
    await this.render();
  }

  private async render(): Promise<void> {
    if (!this.doc) return;
    this.task?.cancel();
    const page = await this.doc.getPage(this.page);
    const cssWidth = this.canvas.clientWidth || 800;
    const scale = (cssWidth * window.devicePixelRatio) / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    this.canvas.width = Math.round(viewport.width);
    this.canvas.height = Math.round(viewport.height);
    this.task = page.render({ canvas: this.canvas, canvasContext: this.canvas.getContext('2d')!, viewport });
    try {
      await this.task.promise;
    } catch (e) {
      if ((e as Error).name !== 'RenderingCancelledException') throw e;
    }
  }
}
```

Note: if the installed pdfjs-dist major version's `render()` params type rejects `canvas`, drop that key. Older versions take only `canvasContext` and `viewport`. `npm run build` (the `tsc` step) will flag it.

- [ ] **Step 4: `src/main.ts`**

```ts
import './styles.css';
import { parseNames, MAX_NAMES } from './names';
import { decodeText, parseCsvNames } from './csv';
import { renderCertificates, type Assets } from './certificate';
import { certificateFileName } from './filenames';
import { buildZip } from './zip';
import { Preview } from './preview';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const textarea = $<HTMLTextAreaElement>('names');
const fileInput = $<HTMLInputElement>('file');
const count = $('count');
const status = $('status');
const generateBtn = $<HTMLButtonElement>('generate');
const downloadBtn = $<HTMLButtonElement>('download');
const printBtn = $<HTMLButtonElement>('print');
const pager = $('pager');
const pageLabel = $('page-label');
const preview = new Preview($<HTMLCanvasElement>('preview-canvas'));

let assets: Assets | null = null;
let generated: { names: string[]; combinedUrl: string } | null = null;

function setStatus(text: string, isError = false) {
  status.textContent = text;
  status.classList.toggle('error', isError);
}

function updatePager() {
  pager.hidden = !generated;
  pageLabel.textContent = `${preview.page} / ${preview.pageCount}`;
}

function invalidate() {
  if (!generated) return;
  URL.revokeObjectURL(generated.combinedUrl);
  generated = null;
  downloadBtn.disabled = true;
  printBtn.disabled = true;
  updatePager();
  if (assets) void preview.show(assets.template);
  setStatus('Список змінено — сформуйте сертифікати ще раз.');
}

function updateCount() {
  count.textContent = `Учнів: ${parseNames(textarea.value).length}`;
}

textarea.addEventListener('input', () => {
  updateCount();
  invalidate();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  fileInput.value = '';
  if (!file) return;
  const names = parseCsvNames(decodeText(new Uint8Array(await file.arrayBuffer())));
  if (names.length === 0) {
    setStatus('У файлі не знайдено жодного імені.', true);
    return;
  }
  textarea.value = names.join('\n');
  textarea.dispatchEvent(new Event('input'));
  setStatus(`Завантажено ${names.length} імен з файлу «${file.name}». Перевірте список.`);
});

generateBtn.addEventListener('click', async () => {
  if (!assets) return;
  const names = parseNames(textarea.value);
  if (names.length === 0) return setStatus('Додайте хоча б одне ім’я.', true);
  if (names.length > MAX_NAMES) return setStatus(`Забагато імен: максимум ${MAX_NAMES}.`, true);

  generateBtn.disabled = true;
  setStatus('Формуємо сертифікати…');
  try {
    const combined = await renderCertificates(assets, names);
    if (generated) URL.revokeObjectURL(generated.combinedUrl);
    generated = {
      names,
      combinedUrl: URL.createObjectURL(new Blob([combined], { type: 'application/pdf' })),
    };
    await preview.show(combined);
    downloadBtn.disabled = false;
    printBtn.disabled = false;
    updatePager();
    setStatus(`Готово: ${names.length} сертифікатів.`);
  } catch (e) {
    console.error(e);
    setStatus('Не вдалося сформувати сертифікати. Спробуйте ще раз.', true);
  } finally {
    generateBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!generated || !assets) return;
  const { names } = generated;
  downloadBtn.disabled = true;
  try {
    const entries = [];
    for (let i = 0; i < names.length; i++) {
      setStatus(`Готуємо архів… ${i + 1} / ${names.length}`);
      entries.push({ name: certificateFileName(i, names.length, names[i]), data: await renderCertificates(assets, [names[i]]) });
    }
    const zip = await buildZip(entries);
    const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sertyfikaty.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setStatus('Архів завантажено.');
  } catch (e) {
    console.error(e);
    setStatus('Не вдалося створити архів.', true);
  } finally {
    downloadBtn.disabled = !generated;
  }
});

printBtn.addEventListener('click', () => {
  if (!generated) return;
  const win = window.open(generated.combinedUrl, '_blank');
  setStatus(win ? 'Файл для друку відкрито в новій вкладці — натисніть «Друк» (Ctrl/Cmd + P).' : 'Браузер заблокував нову вкладку. Дозвольте спливаючі вікна для цього сайту.', !win);
});

$('prev').addEventListener('click', () => preview.go(-1).then(updatePager));
$('next').addEventListener('click', () => preview.go(1).then(updatePager));

async function init() {
  generateBtn.disabled = true;
  setStatus('Завантаження шаблону…');
  try {
    const base = import.meta.env.BASE_URL;
    const [template, font] = await Promise.all(
      [`${base}template.pdf`, `${base}fonts/WixMadeforDisplay-Bold.ttf`].map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      }),
    );
    assets = { template, font };
    await preview.show(template);
    generateBtn.disabled = false;
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('Не вдалося завантажити шаблон. Оновіть сторінку.', true);
  }
  updateCount();
}

void init();
```

- [ ] **Step 5: Typecheck and build**

Run: `npm run build`
Expected: no TS errors; `dist/` contains `index.html`, `assets/*.js`, `template.pdf`, `fonts/…`.

- [ ] **Step 6: Commit**

```bash
git add index.html src && git commit -m "feat: certificate generator UI"
```

---

### Task 9: Visual calibration and manual QA

**Files:** May modify `src/layout.ts` (`NAME_BOX` constants only). Create `tests/sample.test.ts`.

- [ ] **Step 1: Write a sample-rendering helper** (it runs only when `SAMPLE=1` is set)

```ts
import { it } from 'vitest';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { renderCertificates } from '../src/certificate';

const names = [
  'Тарас Шевченко',
  'Мар’яна Ґудзь-Їжакевич',
  'Олександра-Анастасія Костянтинопольська-Вишневецька',
  'Олександра-Анастасія Костянтинопольська-Вишневецька Святославівна',
  'Яна',
];

it.runIf(process.env.SAMPLE)('writes sample PDFs to out/', async () => {
  const assets = {
    template: new Uint8Array(readFileSync('public/template.pdf')),
    font: new Uint8Array(readFileSync('public/fonts/WixMadeforDisplay-Bold.ttf')),
  };
  mkdirSync('out', { recursive: true });
  for (const [i, n] of names.entries()) writeFileSync(`out/sample-${i + 1}.pdf`, await renderCertificates(assets, [n]));
});
```

- [ ] **Step 2: Render to PNG and inspect each one** (macOS Quick Look; open the PNGs with the Read tool)

```bash
SAMPLE=1 npx vitest run tests/sample.test.ts && qlmanage -t -s 1600 -o out out/sample-*.pdf
```

Check each PNG:
- The name sits centred **above** the blue line, does not touch it, and does not collide with "отримує".
- The two-line case fits between "отримує" and the line.
- The colour matches "Сертифікат"/"отримує".
- Ukrainian letters (Ґ Ї Є І ’) render as real glyphs (no boxes or missing characters).

If the position is off, adjust `NAME_BOX` in `src/layout.ts` (`baselineY`, `twoLineBottomY`, `maxSize`, `centerX`, `maxWidth`) and re-run Step 2. Then re-run `npm test`. The layout tests read `NAME_BOX`, but `long name with spaces` assumes `maxWidth 520` and `minSize 20`. If you change those, update the test's numbers to match.

- [ ] **Step 3: Manual QA in the browser** (`npm run dev`, then open the printed URL)

| Check | Expected |
|---|---|
| Page loads | Blank template in the preview; "Учнів: 0" |
| Paste 3 names → Сформувати | Pager "1 / 3"; ◀ ▶ flip through the correct names |
| Edit textarea after generating | Download/Print disabled; status says to regenerate |
| Upload a `;`-separated CSV saved by Excel as "CSV (розділювач — крапка з комою)" in cp1251 | Correct Cyrillic in the textarea, header row skipped |
| Download | `sertyfikaty.zip` with `01_…pdf` etc.; each opens with one correct name |
| Print | New tab with all pages; Cmd+P shows N pages, A4 landscape |
| 0 names / 301 names | Error messages |
| Safari + Chrome (+ Firefox if available) | Same behaviour |

- [ ] **Step 4: Commit**

```bash
git add tests/sample.test.ts src/layout.ts && git commit -m "chore: calibrate name placement; sample renderer"
```

---

### Task 10: Netlify config and deploy

**Files:** Create `netlify.toml`

- [ ] **Step 1: `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

- [ ] **Step 2: Final verification**

```bash
npm test && npm run build && npx vite preview
```

Expected: all tests pass; the preview site works as in Task 9 Step 3.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml && git commit -m "chore: netlify config"
```

- [ ] **Step 4: Push and connect Netlify. This publishes publicly, so the user does the Netlify part.**
  - `git push`
  - The user opens the Netlify dashboard → *Add new project → Import an existing project → GitHub* → authorises the Netlify app for the private repo `bordi/hour-of-ai-certificates` → branch `main`. Build settings are picked up from `netlify.toml` (`npm run build`, publish `dist`) → *Deploy*.
  - The user renames the site: *Project configuration → Change project name* (e.g. `hourofai-certificates` → `hourofai-certificates.netlify.app`).
  - From then on, every push to `main` redeploys automatically.
  - Smoke-test the live URL with the checklist from Task 9 Step 3.
