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

export interface CsvRules {
  /** A first row is a header if any of its cells contains one of these words (lower case). */
  headerWords: readonly string[];
  /** Legacy encoding to try when a file is not valid UTF-8: what Excel writes for this language. */
  fallbackEncoding: string;
}

export interface Locale {
  code: string;
  dir: Direction;
  status: LocaleStatus;
  messages: Messages;
  /** Absolute URLs under `public/`; the page lives at `/<code>/`, so relative paths would break. */
  templateUrl: string;
  fontUrl: string;
  exampleCsvUrl: string;
  csv: CsvRules;
}
