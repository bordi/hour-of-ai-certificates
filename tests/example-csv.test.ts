import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeText, parseCsvNames } from '../src/csv';
import { LOCALES } from '../src/locales';

const EXPECTED: Record<string, string[]> = {
  uk: ['Шевченко Тарас', 'Українка Леся', 'Франко Іван', 'Костенко Ліна', 'Симоненко Василь'],
};

describe.each(Object.entries(LOCALES))('example csv of locale %s', (code, locale) => {
  it('parses to the expected names (header skipped, columns joined)', () => {
    const text = decodeText(new Uint8Array(readFileSync(`public${locale.exampleCsvUrl}`)));
    expect(parseCsvNames(text)).toEqual(EXPECTED[code]);
  });
});
