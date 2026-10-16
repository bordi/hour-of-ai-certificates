import Papa from 'papaparse';
import { normalizeName } from './names';

export function decodeText(bytes: Uint8Array, fallbackEncoding: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder(fallbackEncoding).decode(bytes);
  }
}

function isHeader(row: string[], headerWords: readonly string[]): boolean {
  return row.some((cell) => {
    // \p{M}: keep vowel marks (e.g. Hebrew niqqud) attached to their letters.
    const words = cell.toLowerCase().split(/[^\p{L}\p{M}’]+/u);
    return words.some((w) => headerWords.includes(w));
  });
}

export function parseCsvNames(text: string, headerWords: readonly string[]): string[] {
  const { data } = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [',', ';', '\t'],
  });
  const rows = data
    .map((row) => row.map(normalizeName).filter(Boolean))
    .filter((row) => row.length > 0);
  if (rows.length > 0 && isHeader(rows[0], headerWords)) rows.shift();
  return rows.map((row) => row.join(' '));
}
