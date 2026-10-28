import { detectLocale } from './detect-locale';
import { setLocale } from './i18n';
import { supportedLocales, type Locale } from './locales';

/**
 * Makes the URL canonical (`/<code>/`) and activates that locale.
 * Returns false when it redirected instead; the page reloads on the new URL.
 */
export function route(
  loc: Location = location,
  languages: readonly string[] = navigator.languages,
  locales: readonly Locale[] = supportedLocales(),
): boolean {
  const code = detectLocale(
    loc.pathname,
    languages,
    locales.map((locale) => locale.code),
  );
  const path = `/${code}/`;
  if (loc.pathname !== path) {
    loc.replace(path + loc.search + loc.hash);
    return false;
  }
  setLocale(locales.find((locale) => locale.code === code)!);
  return true;
}
