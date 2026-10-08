import { describe, it, expect } from 'vitest';
import { pluralUk } from '../src/plural';

describe('pluralUk', () => {
  const f = (n: number) => pluralUk(n, 'one', 'few', 'many');
  it.each([
    [1, 'one'], [2, 'few'], [4, 'few'], [5, 'many'], [11, 'many'], [12, 'many'],
    [14, 'many'], [21, 'one'], [22, 'few'], [25, 'many'], [101, 'one'], [111, 'many'],
  ])('%i -> %s', (n, expected) => {
    expect(f(n)).toBe(expected);
  });
});
