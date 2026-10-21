import { en } from './en';
import { he } from './he';
import { uk } from './uk';
import type { Locale } from './types';

export type { CsvRules, Direction, FileNameStrategy, Locale, LocaleStatus, Messages, NamePolicy, NameStyle, Plural } from './types';

export const LOCALES = { uk, en, he } satisfies Record<string, Locale>;

export type LocaleCode = keyof typeof LOCALES;

export function getLocale(code: string): Locale | undefined {
  return Object.hasOwn(LOCALES, code) ? LOCALES[code as LocaleCode] : undefined;
}

/** Draft locales (no final template yet) are shown in dev and on Netlify deploy previews, never in production. */
const DRAFTS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DRAFT_LOCALES === 'true';

export function filterLocales(locales: readonly Locale[], includeDrafts: boolean): Locale[] {
  return locales.filter((locale) => includeDrafts || locale.status === 'ready');
}

/** The locales this build serves: what routing and language detection may pick from. */
export const supportedLocales = (): Locale[] => filterLocales(Object.values(LOCALES), DRAFTS_ENABLED);
