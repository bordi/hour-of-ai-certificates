import fontkit from '@pdf-lib/fontkit';

/** Answers "can the font draw this code point?"; a missing glyph would be printed as an empty box. */
export type HasGlyph = (codePoint: number) => boolean;

export interface Unsupported {
  name: string;
  /** Distinct characters of the name that the font cannot draw, in order of appearance. */
  chars: string[];
}

export function createFontCoverage(fontBytes: Uint8Array): HasGlyph {
  const font = fontkit.create(fontBytes);
  return (codePoint) => font.hasGlyphForCodePoint(codePoint);
}

export function findUnsupported(hasGlyph: HasGlyph, names: readonly string[]): Unsupported[] {
  const found: Unsupported[] = [];
  for (const name of names) {
    const chars = new Set<string>();
    for (const ch of name) if (!hasGlyph(ch.codePointAt(0)!)) chars.add(ch);
    if (chars.size > 0) found.push({ name, chars: [...chars] });
  }
  return found;
}
