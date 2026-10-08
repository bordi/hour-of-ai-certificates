import Papa from 'papaparse';
import { normalizeName } from './names';

export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1251').decode(bytes);
  }
}

const HEADER_WORDS = ['піб', 'ім’я', 'імя', 'прізвище', 'учень', 'учні', 'клас', 'name', 'surname', 'student'];

function isHeader(row: string[]): boolean {
  return row.some((cell) => {
    const words = cell.toLowerCase().split(/[^\p{L}’]+/u);
    return words.some((w) => HEADER_WORDS.includes(w));
  });
}

export function parseCsvNames(text: string): string[] {
  const { data } = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [',', ';', '\t'],
  });
  const rows = data
    .map((row) => row.map(normalizeName).filter(Boolean))
    .filter((row) => row.length > 0);
  if (rows.length > 0 && isHeader(rows[0])) rows.shift();
  return rows.map((row) => row.join(' '));
}
