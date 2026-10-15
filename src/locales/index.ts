import { uk } from './uk';
import type { Locale } from './types';

export type { Direction, Locale, LocaleStatus, Messages, Plural } from './types';

export const LOCALES = { uk } satisfies Record<string, Locale>;

export type LocaleCode = keyof typeof LOCALES;

export function getLocale(code: string): Locale | undefined {
  return Object.hasOwn(LOCALES, code) ? LOCALES[code as LocaleCode] : undefined;
}
