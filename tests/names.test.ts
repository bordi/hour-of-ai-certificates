import { describe, it, expect } from 'vitest';
import { parseNames } from '../src/names';
import { LOCALES } from '../src/locales';

const UK = LOCALES.uk.name;
// Locales whose font draws ' fine: only the modifier letter ʼ (missing from the font) is rewritten.
const KEEP_ASCII_APOSTROPHE = { apostrophes: 'ʼ' };

describe('parseNames', () => {
  it('splits lines, trims, collapses whitespace, drops empties', () => {
    const text = '  Шевченко   Тарас \r\n\n\tЛеся Українка\n   \nІван Франко';
    expect(parseNames(text, UK)).toEqual(['Шевченко Тарас', 'Леся Українка', 'Іван Франко']);
  });

  it('keeps duplicates and original order', () => {
    expect(parseNames('Б\nА\nБ', UK)).toEqual(['Б', 'А', 'Б']);
  });

  it('returns [] for blank input', () => {
    expect(parseNames('  \n \n', UK)).toEqual([]);
  });

  describe('apostrophes follow the locale policy', () => {
    it('uk: every variant becomes ’', () => {
      expect(parseNames("Мар'яна\nМарʼяна\nМар`яна", UK)).toEqual(['Мар’яна', 'Мар’яна', 'Мар’яна']);
    });

    it('a policy without ASCII apostrophe keeps names as entered, rewriting only ʼ', () => {
      expect(parseNames("O'Brien\nOʼBrien\nג'ורג'", KEEP_ASCII_APOSTROPHE)).toEqual(["O'Brien", 'O’Brien', "ג'ורג'"]);
    });
  });

  describe('diacritics and Unicode', () => {
    it.each(['José', 'Seán', 'Zoë', 'Ñandú', 'Müller', 'Søren', 'Łukasz', 'Straße'])('keeps %s untouched', (name) => {
      expect(parseNames(name, UK)).toEqual([name]);
      expect(parseNames(name, KEEP_ASCII_APOSTROPHE)).toEqual([name]);
    });

    it('composes a decomposed é (e + U+0301) into one character', () => {
      const typed = 'Jose\u0301';
      const [name] = parseNames(typed, UK);
      expect(name).toBe('José');
      expect(name.length).toBe(4);
    });

    it('does not reorder or alter Hebrew names', () => {
      expect(parseNames('דוד כהן', KEEP_ASCII_APOSTROPHE)).toEqual(['דוד כהן']);
    });
  });
});
