import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { createFontCoverage, findUnsupported } from '../src/glyphs';
import { LOCALES } from '../src/locales';

const only = (chars: string) => (cp: number) => chars.includes(String.fromCodePoint(cp));

describe('findUnsupported', () => {
  it('returns nothing when every character has a glyph', () => {
    expect(findUnsupported(only('abc '), ['a b', 'cab'])).toEqual([]);
  });

  it('lists each affected name with its distinct missing characters, in order', () => {
    expect(findUnsupported(only('ab '), ['a b', 'axyx b', 'zz'])).toEqual([
      { name: 'axyx b', chars: ['x', 'y'] },
      { name: 'zz', chars: ['z'] },
    ]);
  });

  it('checks whole code points, not UTF-16 halves (emoji)', () => {
    expect(findUnsupported(only('a'), ['a😀'])).toEqual([{ name: 'a😀', chars: ['😀'] }]);
  });

  it('reports a combining mark the font lacks', () => {
    expect(findUnsupported(only('e'), ['e\u0301'])).toEqual([{ name: 'e\u0301', chars: ['\u0301'] }]);
  });
});

describe('createFontCoverage with the bundled font', () => {
  const hasGlyph = createFontCoverage(new Uint8Array(readFileSync(`public${LOCALES.uk.fontUrl}`)));

  it.each(['Тарас Шевченко', 'Мар’яна', 'José Müller', 'Søren Łukasz', "O'Brien", 'Anna 2'])('draws %s', (name) => {
    expect(findUnsupported(hasGlyph, [name])).toEqual([]);
  });

  it('cannot draw Hebrew (this is why Hebrew names are refused until a Hebrew font is chosen)', () => {
    expect(findUnsupported(hasGlyph, ['דוד כהן'])).toEqual([{ name: 'דוד כהן', chars: ['ד', 'ו', 'כ', 'ה', 'ן'] }]);
  });

  it('flags only the unsupported part of a mixed name', () => {
    expect(findUnsupported(hasGlyph, ['Ivan דוד'])).toEqual([{ name: 'Ivan דוד', chars: ['ד', 'ו'] }]);
  });
});
