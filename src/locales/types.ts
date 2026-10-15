export type Direction = 'ltr' | 'rtl';

/** `draft` locales are only reachable in dev and on deploy previews. */
export type LocaleStatus = 'ready' | 'draft';

/** Count-dependent text keyed by Intl.PluralRules category; `other` is the required fallback. */
export type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * Every user-visible string. Placeholders are written `{name}`; `{count}` is
 * the number that selects the plural form of a `Plural` entry.
 */
export interface Messages {
  title: string;
  heading: string;
  lead: string;
  previewLabel: string;
  prevLabel: string;
  nextLabel: string;
  namesLabel: string;
  namesPlaceholder: string;
  uploadButton: string;
  studentCount: string;
  hintCsv: string;
  exampleLink: string;
  hintPrivacy: string;
  generate: string;
  download: string;
  print: string;

  loadingTemplate: string;
  templateLoadFailed: string;
  addAtLeastOneName: string;
  tooManyNames: string;
  generating: string;
  generated: Plural;
  generateFailed: string;
  listChanged: string;
  noNamesInFile: string;
  importedFromFile: Plural;
  preparingArchive: string;
  archiveDownloaded: string;
  archiveFailed: string;
  printOpened: string;
  popupBlocked: string;
}

export interface Locale {
  code: string;
  dir: Direction;
  status: LocaleStatus;
  messages: Messages;
}
