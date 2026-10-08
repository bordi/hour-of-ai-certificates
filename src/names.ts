export const MAX_NAMES = 300;

export function normalizeName(raw: string): string {
  return raw.replace(/['ʼ`]/g, '’').replace(/\s+/g, ' ').trim();
}

export function parseNames(text: string): string[] {
  return text.split(/\r?\n/).map(normalizeName).filter(Boolean);
}
