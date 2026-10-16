import type { NamePolicy } from './locales';

export const MAX_NAMES = 300;

/** NFC makes a typed or pasted `e` + combining accent the single glyph `é` the font has. */
export function normalizeName(raw: string, policy: NamePolicy): string {
  const unified = [...raw].map((ch) => (policy.apostrophes.includes(ch) ? '’' : ch)).join('');
  return unified.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function parseNames(text: string, policy: NamePolicy): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeName(line, policy))
    .filter(Boolean);
}
