import { describe, it, expect } from 'vitest';
import { parseNames } from '../src/names';

describe('parseNames', () => {
  it('splits lines, trims, collapses whitespace, drops empties', () => {
    const text = '  Шевченко   Тарас \r\n\n\tЛеся Українка\n   \nІван Франко';
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
