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

/**
 * Splits a list into the names the font can draw completely and those it cannot, keeping order and duplicates.
 * A missing glyph would be printed as an empty box, so such names must not reach the certificate.
 */
export function splitByCoverage(
  hasGlyph: HasGlyph,
  names: readonly string[],
): { supported: string[]; unsupported: Unsupported[] } {
  const supported: string[] = [];
  const unsupported: Unsupported[] = [];
  for (const name of names) {
    const chars = new Set<string>();
    for (const ch of name) if (!hasGlyph(ch.codePointAt(0)!)) chars.add(ch);
    if (chars.size === 0) supported.push(name);
    else unsupported.push({ name, chars: [...chars] });
  }
  return { supported, unsupported };
}
