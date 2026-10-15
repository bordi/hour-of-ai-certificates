export const FALLBACK_CODE = 'en';

/** Browser languages mapped onto ours: Russian speakers get Ukrainian; `iw` is the legacy code for Hebrew. */
const ALIASES = new Map([
  ['ru', 'uk'],
  ['iw', 'he'],
]);

/**
 * The URL wins: `/<code>/…` with a supported code. Otherwise the first of the
 * browser's languages that resolves, otherwise English (or the first supported
 * locale while English is not available).
 */
export function detectLocale(pathname: string, languages: readonly string[], supported: readonly string[]): string {
  const segment = pathname.split('/')[1]?.toLowerCase();
  if (segment && supported.includes(segment)) return segment;

  for (const tag of languages) {
    const base = tag.split('-')[0].toLowerCase();
    const code = ALIASES.get(base) ?? base;
    if (supported.includes(code)) return code;
  }
  return supported.includes(FALLBACK_CODE) ? FALLBACK_CODE : supported[0];
}
