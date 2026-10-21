import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeText, parseCsvNames } from '../src/csv';
import { LOCALES } from '../src/locales';

const EXPECTED: Record<string, string[]> = {
  uk: ['Шевченко Тарас', 'Українка Леся', 'Франко Іван', 'Костенко Ліна', 'Симоненко Василь'],
  en: ['Anna Smith', 'José García', "Seán O'Brien", 'Zoë Müller', 'Łukasz Kowalski'],
  he: ['דניאל כהן', 'שרה לוי', 'יוסי מזרחי', 'נועה פרץ', 'איתי כץ'],
};

describe.each(Object.entries(LOCALES))('example csv of locale %s', (code, locale) => {
  it('parses to the expected names (header skipped, columns joined)', () => {
    const text = decodeText(new Uint8Array(readFileSync(`public${locale.exampleCsvUrl}`)), locale.csv.fallbackEncoding);
    expect(parseCsvNames(text, locale.csv.headerWords, locale.name)).toEqual(EXPECTED[code]);
  });
});
