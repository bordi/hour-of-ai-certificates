import type { NamePolicy } from './locales';

export const MAX_NAMES = 300;

/** Invisible direction marks (LRM, RLM, ALM, embeddings, isolates). Pasted Hebrew often carries them; they would print as empty boxes. */
export const BIDI_CONTROLS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;

/** NFC makes a typed or pasted `e` + combining accent the single glyph `é` the font has. */
export function normalizeName(raw: string, policy: NamePolicy): string {
  const unified = [...raw].map((ch) => (policy.apostrophes.includes(ch) ? '’' : ch)).join('');
  return unified.replace(BIDI_CONTROLS, '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function parseNames(text: string, policy: NamePolicy): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeName(line, policy))
    .filter(Boolean);
}
