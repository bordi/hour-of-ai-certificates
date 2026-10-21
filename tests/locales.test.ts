import { existsSync, readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, it, expect } from 'vitest';
import { LOCALES, filterLocales, getLocale, type Plural } from '../src/locales';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const forms = (value: string | Plural): string[] =>
  typeof value === 'string' ? [value] : (Object.values(value) as string[]);

describe('filterLocales', () => {
  const ready = LOCALES.uk;
  const draft = { ...ready, code: 'en', status: 'draft' as const };

  it('production: only ready locales', () => {
    expect(filterLocales([ready, draft], false)).toEqual([ready]);
  });

  it('dev and deploy previews: drafts too', () => {
    expect(filterLocales([ready, draft], true)).toEqual([ready, draft]);
  });

  it('uk is ready, so production always has a language to serve', () => {
    expect(filterLocales(Object.values(LOCALES), false).map((l) => l.code)).toContain('uk');
  });
});

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

  it('puts the name inside its own template, which has the proportions of the preview frame (A4 landscape)', async () => {
    const page = (await PDFDocument.load(readFileSync(`public${locale.templateUrl}`))).getPage(0);
    const { width, height } = page.getSize();
    expect(width / height).toBeCloseTo(842 / 595, 2);
    const { box } = locale.nameStyle;
    expect(box.centerX - box.maxWidth / 2).toBeGreaterThan(0);
    expect(box.centerX + box.maxWidth / 2).toBeLessThan(width);
    expect(box.baselineY).toBeGreaterThan(0);
    expect(box.twoLineBottomY + box.twoLineMaxSize * box.lineHeight + box.twoLineMaxSize).toBeLessThan(height);
    expect(box.minSize).toBeLessThanOrEqual(box.maxSize);
    expect(box.twoLineMaxSize).toBeLessThanOrEqual(box.maxSize);
  });

  it('has a valid name colour and emboldening', () => {
    const { color, emboldening } = locale.nameStyle;
    for (const c of color) expect(c >= 0 && c <= 1, String(c)).toBe(true);
    expect(emboldening).toBeGreaterThanOrEqual(0);
    expect(emboldening).toBeLessThan(0.1);
  });

  it('has usable csv rules', () => {
    expect(locale.csv.headerWords.length).toBeGreaterThan(0);
    for (const word of locale.csv.headerWords) expect(word, word).toBe(word.toLowerCase());
    expect(() => new TextDecoder(locale.csv.fallbackEncoding)).not.toThrow();
  });

  it('defines every plural form its language needs', () => {
    const needed = new Intl.PluralRules(locale.code).resolvedOptions().pluralCategories;
    for (const [name, value] of Object.entries(locale.messages)) {
      if (typeof value !== 'string') expect(Object.keys(value).sort(), name).toEqual(expect.arrayContaining([...needed].sort()));
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

describe('registered locales', () => {
  it('knows uk, en and he, with the direction of each language', () => {
    expect(Object.keys(LOCALES)).toEqual(['uk', 'en', 'he']);
    expect(Object.values(LOCALES).map((l) => l.dir)).toEqual(['ltr', 'ltr', 'rtl']);
  });

  it('only uk is ready; en and he are drafts until their final templates exist', () => {
    expect(filterLocales(Object.values(LOCALES), false).map((l) => l.code)).toEqual(['uk']);
    expect(filterLocales(Object.values(LOCALES), true).map((l) => l.code)).toEqual(['uk', 'en', 'he']);
  });
});
