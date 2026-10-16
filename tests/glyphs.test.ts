import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { createFontCoverage, splitByCoverage } from '../src/glyphs';
import { LOCALES } from '../src/locales';

const only = (chars: string) => (cp: number) => chars.includes(String.fromCodePoint(cp));

describe('splitByCoverage', () => {
  it('keeps everything when every character has a glyph', () => {
    expect(splitByCoverage(only('abc '), ['a b', 'cab'])).toEqual({ supported: ['a b', 'cab'], unsupported: [] });
  });

  it('separates the names the font cannot draw, listing their distinct missing characters in order', () => {
    expect(splitByCoverage(only('ab '), ['a b', 'axyx b', 'ab', 'zz'])).toEqual({
      supported: ['a b', 'ab'],
      unsupported: [
        { name: 'axyx b', chars: ['x', 'y'] },
        { name: 'zz', chars: ['z'] },
      ],
    });
  });

  it('keeps the order and the duplicates of both groups', () => {
    const { supported, unsupported } = splitByCoverage(only('ab'), ['b', 'x', 'a', 'x', 'b']);
    expect(supported).toEqual(['b', 'a', 'b']);
    expect(unsupported.map((u) => u.name)).toEqual(['x', 'x']);
  });

  it('checks whole code points, not UTF-16 halves (emoji)', () => {
    expect(splitByCoverage(only('a'), ['a😀']).unsupported).toEqual([{ name: 'a😀', chars: ['😀'] }]);
  });

  it('reports a combining mark the font lacks', () => {
    expect(splitByCoverage(only('e'), ['e\u0301']).unsupported).toEqual([{ name: 'e\u0301', chars: ['\u0301'] }]);
  });

  it('handles an empty list', () => {
    expect(splitByCoverage(only('a'), [])).toEqual({ supported: [], unsupported: [] });
  });
});

describe('createFontCoverage with the bundled font', () => {
  const hasGlyph = createFontCoverage(new Uint8Array(readFileSync(`public${LOCALES.uk.fontUrl}`)));
  const unsupportedIn = (names: string[]) => splitByCoverage(hasGlyph, names).unsupported;

  it.each(['Тарас Шевченко', 'Мар’яна', 'José Müller', 'Søren Łukasz', "O'Brien", 'Anna 2'])('draws %s', (name) => {
    expect(unsupportedIn([name])).toEqual([]);
  });

  it('cannot draw Hebrew (this is why Hebrew names are skipped until a Hebrew font is chosen)', () => {
    expect(unsupportedIn(['דוד כהן'])).toEqual([{ name: 'דוד כהן', chars: ['ד', 'ו', 'כ', 'ה', 'ן'] }]);
  });

  it('flags only the unsupported part of a mixed name and leaves the other names alone', () => {
    const { supported, unsupported } = splitByCoverage(hasGlyph, ['Ivan Smith', 'Ivan דוד', 'Леся']);
    expect(supported).toEqual(['Ivan Smith', 'Леся']);
    expect(unsupported).toEqual([{ name: 'Ivan דוד', chars: ['ד', 'ו'] }]);
  });
});
