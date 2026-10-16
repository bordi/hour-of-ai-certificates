import { describe, it, expect } from 'vitest';
import { decodeText, parseCsvNames } from '../src/csv';
import { LOCALES } from '../src/locales';

const UK = LOCALES.uk.csv;
const parseUk = (text: string) => parseCsvNames(text, UK.headerWords);

const cp1251 = (s: string) => {
  // minimal encoder for the test: Cyrillic А..я = 0xC0..0xFF, plus і/І/ї/Ї/є/Є/ґ/Ґ
  const extra: Record<string, number> = { 'і': 0xb3, 'І': 0xb2, 'ї': 0xbf, 'Ї': 0xaf, 'є': 0xba, 'Є': 0xaa, 'ґ': 0xb4, 'Ґ': 0xa5 };
  return new Uint8Array([...s].map((c) => {
    const code = c.charCodeAt(0);
    if (extra[c]) return extra[c];
    if (code >= 0x410 && code <= 0x44f) return code - 0x410 + 0xc0;
    return code;
  }));
};

describe('decodeText', () => {
  it('decodes UTF-8 (with BOM)', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Тарас')]);
    expect(decodeText(bytes, UK.fallbackEncoding)).toBe('Тарас');
  });

  it('falls back to windows-1251', () => {
    expect(decodeText(cp1251('Іван;Їжак'), UK.fallbackEncoding)).toBe('Іван;Їжак');
  });
});

describe('decodeText fallback encodings', () => {
  it('windows-1255 (Hebrew Excel)', () => {
    // שלום
    expect(decodeText(new Uint8Array([0xf9, 0xec, 0xe5, 0xed]), 'windows-1255')).toBe('שלום');
  });

  it('windows-1252 (Western European Excel), keeping é', () => {
    expect(decodeText(new Uint8Array([0x4a, 0x6f, 0x73, 0xe9]), 'windows-1252')).toBe('José');
  });

  it('prefers valid UTF-8 over the fallback', () => {
    expect(decodeText(new TextEncoder().encode('José;דוד'), 'windows-1255')).toBe('José;דוד');
  });
});

describe('parseCsvNames', () => {
  it('one column, no header', () => {
    expect(parseUk('Шевченко Тарас\nУкраїнка Леся\n')).toEqual(['Шевченко Тарас', 'Українка Леся']);
  });

  it('semicolon-separated two columns with header, joined in file order', () => {
    expect(parseUk('Прізвище;Ім’я\nШевченко;Тарас\nУкраїнка;Леся')).toEqual(['Шевченко Тарас', 'Українка Леся']);
  });

  it('comma-separated with quotes and empty cells', () => {
    expect(parseUk('Name,Surname,\n"Тарас","Шевченко",\nЛеся,,Українка\n')).toEqual(['Тарас Шевченко', 'Леся Українка']);
  });

  it('tab-separated, skips blank rows, normalises whitespace', () => {
    expect(parseUk('ПІБ\tКлас\nІван  Франко\t5-А\n\n\t\n')).toEqual(['Іван Франко 5-А']);
  });

  it('detects header words in the middle of descriptive labels', () => {
    expect(parseUk('Повне ім’я учня\nТарас Шевченко')).toEqual(['Тарас Шевченко']);
    expect(parseUk('Вкажіть ПІБ дитини;Клас\nЛеся Українка;5-А')).toEqual(['Леся Українка 5-А']);
    expect(parseUk('Student full name\nIvan Franko')).toEqual(['Ivan Franko']);
  });

  it('does not drop a first row that is a real name', () => {
    expect(parseUk('Тарас;Шевченко\nЛеся;Українка')).toEqual(['Тарас Шевченко', 'Леся Українка']);
  });
});

describe('parseCsvNames header words come from the caller', () => {
  const he = ['שם', 'תלמיד'];

  it('skips a header made of the given words', () => {
    expect(parseCsvNames('שם;משפחה\nדוד;כהן', he)).toEqual(['דוד כהן']);
  });

  it('recognises a header word with niqqud and inside a longer label', () => {
    expect(parseCsvNames('שֵׁם התלמיד\nדוד כהן', ['שֵׁם'])).toEqual(['דוד כהן']);
  });

  it('does not use another locale’s words', () => {
    expect(parseCsvNames('Прізвище;Ім’я\nШевченко;Тарас', he)).toEqual(['Прізвище Ім’я', 'Шевченко Тарас']);
  });
});
