import { LOCALES, type Locale, type Messages } from './locales';

export type MessageKey = keyof Messages;
export type Vars = Record<string, string | number>;

/** Pure lookup: picks the plural form by `vars.count` (if the entry has forms) and fills `{placeholders}`. */
export function translate(locale: Locale, key: MessageKey, vars: Vars = {}): string {
  const entry = locale.messages[key];
  const template =
    typeof entry === 'string' ? entry : (entry[new Intl.PluralRules(locale.code).select(Number(vars.count))] ?? entry.other);
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in vars ? String(vars[name]) : placeholder));
}

// Fixed for now; the language comes from the URL once routing lands.
const active: Locale = LOCALES.uk;

export const t = (key: MessageKey, vars?: Vars): string => translate(active, key, vars);

/** Sets <html lang dir>, the page title, and fills every `data-i18n*` element. */
export function applyToDocument(doc: Document = document): void {
  doc.documentElement.lang = active.code;
  doc.documentElement.dir = active.dir;
  doc.title = t('title');
  doc.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as MessageKey);
  });
  doc.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder as MessageKey));
  });
  doc.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel as MessageKey));
  });
}
