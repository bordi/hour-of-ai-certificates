import Papa from 'papaparse';
import type { NamePolicy } from './locales';
import { normalizeName } from './names';

export function decodeText(bytes: Uint8Array, fallbackEncoding: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder(fallbackEncoding).decode(bytes);
  }
}

/**
 * A header labels every column that has letters, with no numbers in it. Looser rules dropped real students
 * (`תלמיד 1`, a surname such as "Клас"); a header that slips through stays visible in the list and is easy to delete.
 */
function isHeader(row: string[], headerWords: readonly string[]): boolean {
  if (row.some((cell) => /\p{N}/u.test(cell))) return false;
  const labelled = row.filter((cell) => /\p{L}/u.test(cell));
  return (
    labelled.length > 0 &&
    labelled.every((cell) => {
      // \p{M}: keep vowel marks (e.g. Hebrew niqqud) attached to their letters.
      const words = cell.toLowerCase().split(/[^\p{L}\p{M}’]+/u);
      return words.some((w) => headerWords.includes(w));
    })
  );
}

export function parseCsvNames(text: string, headerWords: readonly string[], policy: NamePolicy): string[] {
  const { data } = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [',', ';', '\t'],
  });
  const rows = data
    .map((row) => row.map((cell) => normalizeName(cell, policy)).filter(Boolean))
    .filter((row) => row.length > 0);
  if (rows.length > 0 && isHeader(rows[0], headerWords)) rows.shift();
  return rows.map((row) => row.join(' '));
}
