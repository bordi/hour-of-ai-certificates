import { describe, it, expect } from 'vitest';
import { translate } from '../src/i18n';
import { LOCALES, type Locale, type Plural } from '../src/locales';

const uk = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => translate(LOCALES.uk, key, vars);

describe('translate', () => {
  it('returns a plain message', () => {
    expect(uk('archiveDownloaded')).toBe('Архів завантажено.');
  });

  it('fills placeholders', () => {
    expect(uk('tooManyNames', { max: 300 })).toBe('Забагато імен: максимум 300.');
    expect(uk('preparingArchive', { current: 2, total: 28 })).toBe('Готуємо архів… 2 / 28');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(uk('studentCount')).toBe('Учнів: {count}');
  });

  it.each([
    [1, 'Готово: 1 сертифікат.'],
    [2, 'Готово: 2 сертифікати.'],
    [4, 'Готово: 4 сертифікати.'],
    [5, 'Готово: 5 сертифікатів.'],
    [11, 'Готово: 11 сертифікатів.'],
    [12, 'Готово: 12 сертифікатів.'],
    [14, 'Готово: 14 сертифікатів.'],
    [21, 'Готово: 21 сертифікат.'],
    [22, 'Готово: 22 сертифікати.'],
    [25, 'Готово: 25 сертифікатів.'],
    [101, 'Готово: 101 сертифікат.'],
    [111, 'Готово: 111 сертифікатів.'],
  ])('picks the ukrainian plural form for %i', (count, expected) => {
    expect(uk('generated', { count })).toBe(expected);
  });

  it('combines plural selection with other placeholders', () => {
    expect(uk('importedFromFile', { count: 3, file: 'klas.csv' })).toBe(
      'Завантажено 3 імені з файлу «klas.csv». Перевірте список.',
    );
  });

  it('falls back to the `other` form when no count is given', () => {
    expect(uk('generated')).toBe('Готово: {count} сертифікатів.');
  });
});

// Other languages reuse the same mechanism; check their CLDR categories with stand-in locales.
const withGenerated = (code: string, generated: Plural): Locale => ({
  ...LOCALES.uk,
  code,
  messages: { ...LOCALES.uk.messages, generated },
});

describe('translate with other plural systems', () => {
  it('en: only `one` and `other` (zero is `other`)', () => {
    const en = withGenerated('en', { one: 'one', other: 'other' });
    expect([0, 1, 2, 11, 21].map((count) => translate(en, 'generated', { count }))).toEqual([
      'other', 'one', 'other', 'other', 'other',
    ]);
  });

  it('he: `one`, a dedicated `two`, and `other`', () => {
    const he = withGenerated('he', { one: 'one', two: 'two', other: 'other' });
    expect([0, 1, 2, 3, 12].map((count) => translate(he, 'generated', { count }))).toEqual([
      'other', 'one', 'two', 'other', 'other',
    ]);
  });

  it('uses `other` when the locale has no form for the selected category', () => {
    const he = withGenerated('he', { one: 'one', other: 'other' });
    expect(translate(he, 'generated', { count: 2 })).toBe('other');
  });
});
