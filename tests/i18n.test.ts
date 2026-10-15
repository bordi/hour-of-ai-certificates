import { describe, it, expect } from 'vitest';
import { translate } from '../src/i18n';
import { LOCALES } from '../src/locales';

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
    [5, 'Готово: 5 сертифікатів.'],
    [11, 'Готово: 11 сертифікатів.'],
    [21, 'Готово: 21 сертифікат.'],
    [22, 'Готово: 22 сертифікати.'],
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
