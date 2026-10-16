export const FALLBACK_CODE = 'en';

/** Codes mapped onto ours, in the URL and in the browser's list: Russian goes to Ukrainian; `iw` is the legacy code for Hebrew. */
const ALIASES = new Map([
  ['ru', 'uk'],
  ['iw', 'he'],
]);

/**
 * The URL wins: `/<code>/…` with a supported code or an alias of one (`/ru/` is `/uk/`). Otherwise the
 * first of the browser's languages that resolves, otherwise English (or the first supported locale
 * while English is not available).
 */
export function detectLocale(pathname: string, languages: readonly string[], supported: readonly string[]): string {
  const resolve = (code: string): string | undefined => {
    const target = ALIASES.get(code) ?? code;
    return supported.includes(target) ? target : undefined;
  };

  const segment = pathname.split('/')[1]?.toLowerCase();
  const fromUrl = segment ? resolve(segment) : undefined;
  if (fromUrl) return fromUrl;

  for (const tag of languages) {
    const fromBrowser = resolve(tag.split('-')[0].toLowerCase());
    if (fromBrowser) return fromBrowser;
  }
  return supported.includes(FALLBACK_CODE) ? FALLBACK_CODE : supported[0];
}
