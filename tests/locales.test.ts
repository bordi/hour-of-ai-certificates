import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { LOCALES, getLocale, type Plural } from '../src/locales';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const forms = (value: string | Plural): string[] =>
  typeof value === 'string' ? [value] : (Object.values(value) as string[]);

describe('locale registry', () => {
  it('looks up registered locales by code', () => {
    expect(getLocale('uk')).toBe(LOCALES.uk);
  });

  it('returns undefined for unknown codes, including inherited object keys', () => {
    expect(getLocale('xx')).toBeUndefined();
    expect(getLocale('toString')).toBeUndefined();
  });
});

describe.each(Object.entries(LOCALES))('locale %s', (key, locale) => {
  it('is registered under its own code', () => {
    expect(locale.code).toBe(key);
  });

  it('points at assets that exist under public/', () => {
    for (const url of [locale.templateUrl, locale.fontUrl, locale.exampleCsvUrl]) {
      expect(url).toMatch(/^\//);
      expect(existsSync(`public${url}`), url).toBe(true);
    }
  });

  it('has no empty messages', () => {
    for (const [name, value] of Object.entries(locale.messages)) {
      for (const form of forms(value)) expect(form.trim(), name).not.toBe('');
    }
  });

  it('uses the same placeholders in every plural form', () => {
    for (const [name, value] of Object.entries(locale.messages)) {
      if (typeof value === 'string') continue;
      const [first, ...rest] = forms(value).map(placeholders);
      expect(first, name).toContain('count');
      for (const p of rest) expect(p, name).toEqual(first);
    }
  });
});
