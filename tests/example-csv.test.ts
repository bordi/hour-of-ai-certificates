import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeText, parseCsvNames } from '../src/csv';

describe('public/examples/spysok-uchniv.csv', () => {
  it('parses to the expected names (header skipped, columns joined)', () => {
    const text = decodeText(new Uint8Array(readFileSync('public/examples/spysok-uchniv.csv')));
    expect(parseCsvNames(text)).toEqual([
      'Шевченко Тарас',
      'Українка Леся',
      'Франко Іван',
      'Костенко Ліна',
      'Симоненко Василь',
    ]);
  });
});
