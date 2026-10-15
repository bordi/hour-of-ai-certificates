import { detectLocale } from './detect-locale';
import { setLocale } from './i18n';
import { LOCALES, getLocale } from './locales';

/**
 * Makes the URL canonical (`/<code>/`) and activates that locale.
 * Returns false when it redirected instead; the page reloads on the new URL.
 */
export function route(loc: Location = location, languages: readonly string[] = navigator.languages): boolean {
  const code = detectLocale(loc.pathname, languages, Object.keys(LOCALES));
  const path = `/${code}/`;
  if (loc.pathname !== path) {
    loc.replace(path + loc.search + loc.hash);
    return false;
  }
  setLocale(getLocale(code)!);
  return true;
}
