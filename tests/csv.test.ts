import { describe, it, expect } from 'vitest';
import { decodeText, parseCsvNames } from '../src/csv';

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
    expect(decodeText(bytes)).toBe('Тарас');
  });

  it('falls back to windows-1251', () => {
    expect(decodeText(cp1251('Іван;Їжак'))).toBe('Іван;Їжак');
  });
});

describe('parseCsvNames', () => {
  it('one column, no header', () => {
    expect(parseCsvNames('Шевченко Тарас\nУкраїнка Леся\n')).toEqual(['Шевченко Тарас', 'Українка Леся']);
  });

  it('semicolon-separated two columns with header, joined in file order', () => {
    expect(parseCsvNames('Прізвище;Ім’я\nШевченко;Тарас\nУкраїнка;Леся')).toEqual(['Шевченко Тарас', 'Українка Леся']);
  });

  it('comma-separated with quotes and empty cells', () => {
    expect(parseCsvNames('Name,Surname,\n"Тарас","Шевченко",\nЛеся,,Українка\n')).toEqual(['Тарас Шевченко', 'Леся Українка']);
  });

  it('tab-separated, skips blank rows, normalises whitespace', () => {
    expect(parseCsvNames('ПІБ\tКлас\nІван  Франко\t5-А\n\n\t\n')).toEqual(['Іван Франко 5-А']);
  });

  it('detects header words in the middle of descriptive labels', () => {
    expect(parseCsvNames('Повне ім’я учня\nТарас Шевченко')).toEqual(['Тарас Шевченко']);
    expect(parseCsvNames('Вкажіть ПІБ дитини;Клас\nЛеся Українка;5-А')).toEqual(['Леся Українка 5-А']);
    expect(parseCsvNames('Student full name\nIvan Franko')).toEqual(['Ivan Franko']);
  });

  it('does not drop a first row that is a real name', () => {
    expect(parseCsvNames('Тарас;Шевченко\nЛеся;Українка')).toEqual(['Тарас Шевченко', 'Леся Українка']);
  });
});
