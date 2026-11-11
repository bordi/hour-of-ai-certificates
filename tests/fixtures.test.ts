import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeText, parseCsvNames } from '../src/csv';
import { certificateFileName } from '../src/filenames';
import { createFontCoverage, splitByCoverage } from '../src/glyphs';
import { MAX_NAMES, parseNames } from '../src/names';
import { LOCALES } from '../src/locales';
import type { Locale } from '../src/locales/types';

// tests/fixtures/ holds class lists for checking the site by hand (upload them on a deploy preview). These tests keep
// them true to what the checklist promises.
function upload(file: string, locale: Locale): string[] {
  const bytes = new Uint8Array(readFileSync(`tests/fixtures/${file}`));
  return parseCsvNames(decodeText(bytes, locale.csv.fallbackEncoding), locale.csv.headerWords, locale.name);
}

function unsupported(names: string[], locale: Locale): string[] {
  const hasGlyph = createFontCoverage(new Uint8Array(readFileSync(`public${locale.fontUrl}`)));
  return splitByCoverage(hasGlyph, names).unsupported.map((u) => u.name);
}

describe('manual-check fixtures', () => {
  it('he-excel-windows-1255.csv: an Excel export (windows-1255, two columns, header row)', () => {
    const names = upload('he-excel-windows-1255.csv', LOCALES.he);
    expect(names).toEqual(['נועה בן-דוד', "ג'ורג' אבו-חצירא", 'יעל כהן', 'אלכסנדרה וולקובסקי-רוזנברג בן עמי', 'מיכאל (מיקי) לוי 2']);
    expect(unsupported(names, LOCALES.he)).toEqual([]);
  });

  it('he-utf8-bom.csv: Hebrew, accented Latin, Cyrillic and a mixed name, all printable on /he/', () => {
    const names = upload('he-utf8-bom.csv', LOCALES.he);
    expect(names).toEqual(['דני כהן', 'שרה לוי', 'José Núñez', 'Мар’яна Ґудзь', 'Ivan דני']);
    expect(unsupported(names, LOCALES.he)).toEqual([]);
  });

  it("uk-excel-windows-1251.csv: an Excel export (windows-1251); ' becomes ’", () => {
    const names = upload('uk-excel-windows-1251.csv', LOCALES.uk);
    expect(names).toEqual(['Шевченко Тарас', 'Мар’яненко Ґанна', 'Їжакевич-Сірко Євгенія', 'Йосипенко Юрій']);
    expect(unsupported(names, LOCALES.uk)).toEqual([]);
  });

  it('lt-excel-windows-1257.csv: an Excel export (windows-1257) with every Lithuanian letter, kept in zip file names', () => {
    const names = upload('lt-excel-windows-1257.csv', LOCALES.lt);
    expect(names).toEqual(['Ąžuolas Čiurlionis', 'Kęstutis Šimkus', 'Rūta Petraitytė-Žemaitienė', 'Įgaudė Mažylienė', 'ąčęėįšųūž ĄČĘĖĮŠŲŪŽ']);
    expect(unsupported(names, LOCALES.lt)).toEqual([]);
    expect(names.map((n, i) => certificateFileName(i, names.length, n, LOCALES.lt.fileNameStrategy))).toEqual([
      '01_Ąžuolas_Čiurlionis.pdf',
      '02_Kęstutis_Šimkus.pdf',
      '03_Rūta_Petraitytė_Žemaitienė.pdf',
      '04_Įgaudė_Mažylienė.pdf',
      '05_ąčęėįšųūž_ĄČĘĖĮŠŲŪŽ.pdf',
    ]);
  });

  it.each(['uk', 'en'] as const)('uk-with-hebrew.txt on /%s/: only the Hebrew name goes to the skip dialog', (code) => {
    const names = upload('uk-with-hebrew.txt', LOCALES[code]);
    expect(names).toHaveLength(4);
    expect(unsupported(names, LOCALES[code])).toEqual(['דני כהן']);
  });

  it('he-300-names.txt is at the limit, he-301-names.txt one over it', () => {
    const count = (file: string) => parseNames(upload(file, LOCALES.he).join('\n'), LOCALES.he.name).length;
    expect(count('he-300-names.txt')).toBe(MAX_NAMES);
    expect(count('he-301-names.txt')).toBe(MAX_NAMES + 1);
  });
});
