import { describe, it, expect } from 'vitest';
import { transliterate, certificateFileName } from '../src/filenames';

describe('transliterate', () => {
  it.each([
    ['Шевченко Тарас', 'Shevchenko Taras'],
    ['Юлія Їжакевич', 'Yuliia Yizhakevych'],
    ['Олексій Яковлев', 'Oleksii Yakovlev'],
    ['Згорани Розгон', 'Zghorany Rozghon'],
    ['Знам’янка', 'Znamianka'],
    ['Щука Ґудзь', 'Shchuka Gudz'],
    ['Євген Йосипенко', 'Yevhen Yosypenko'],
    ['John Smith', 'John Smith'],
  ])('%s → %s', (input, expected) => {
    expect(transliterate(input)).toBe(expected);
  });
});

describe('certificateFileName', () => {
  const uk = (index: number, total: number, name: string) => certificateFileName(index, total, name, 'kmu-2010');
  const keep = (index: number, total: number, name: string) => certificateFileName(index, total, name, 'keep');

  it('numbers with at least 2 digits and transliterates Cyrillic (kmu-2010)', () => {
    expect(uk(0, 28, 'Шевченко Тарас')).toBe('01_Shevchenko_Taras.pdf');
    expect(uk(9, 28, 'Марія-Олена О’Коннор')).toBe('10_Mariia_Olena_OKonnor.pdf');
  });

  it('pads to 3 digits for 100+ names', () => {
    expect(uk(4, 120, 'Іван')).toBe('005_Ivan.pdf');
  });

  it('falls back when no letters remain', () => {
    expect(uk(0, 3, '✨✨')).toBe('01_student.pdf');
    expect(keep(0, 3, '✨✨')).toBe('01_student.pdf');
  });

  describe('letters outside Cyrillic are kept, in every strategy', () => {
    it.each(['José', 'Seán', 'Zoë', 'Ñandú', 'Müller', 'Søren', 'Łukasz', 'Straße'])('%s', (name) => {
      expect(uk(0, 3, name)).toBe(`01_${name}.pdf`);
      expect(keep(0, 3, name)).toBe(`01_${name}.pdf`);
    });

    it('mixes transliterated Cyrillic with kept Latin letters', () => {
      expect(uk(0, 3, 'José Шевченко')).toBe('01_José_Shevchenko.pdf');
    });

    it('composes a decomposed é so the file name carries one character', () => {
      const slug = uk(0, 3, 'Jose\u0301').slice(3, -4);
      expect(slug).toBe('José');
      expect(slug.length).toBe(4);
    });
  });

  describe('keep strategy (en, he)', () => {
    it('keeps Hebrew letters, number first', () => {
      expect(keep(0, 28, 'דוד כהן')).toBe('01_דוד_כהן.pdf');
    });

    it('keeps Hebrew letters with niqqud attached', () => {
      expect(keep(0, 3, 'דָּוִד')).toBe('01_דָּוִד.pdf');
    });

    it('does not transliterate Cyrillic', () => {
      expect(keep(0, 3, 'Іван Франко')).toBe('01_Іван_Франко.pdf');
    });

    it('drops apostrophes and geresh instead of leaving a separator', () => {
      expect(keep(0, 3, "O'Brien")).toBe('01_OBrien.pdf');
      expect(keep(0, 3, "ג'ורג'")).toBe('01_גורג.pdf');
      expect(keep(0, 3, 'ג׳ורג׳')).toBe('01_גורג.pdf');
    });
  });

  describe('characters that cannot appear in a file name', () => {
    it.each([
      ['a\\b/c:d*e?f"g<h>i|j', '01_a_b_c_d_e_f_g_h_i_j.pdf'],
      ['  Дов.  ', '01_Дов.pdf'],
      ['Anna…', '01_Anna.pdf'],
      ['Tab\tName\nLine', '01_Tab_Name_Line.pdf'],
    ])('%j', (name, expected) => {
      expect(keep(0, 3, name)).toBe(expected);
    });

    it('removes invisible bidi controls instead of turning them into separators', () => {
      expect(keep(0, 3, '\u200fדוד\u200e כהן\u202b')).toBe('01_דוד_כהן.pdf');
      expect(keep(0, 3, 'Da\u2066vid\u2069')).toBe('01_David.pdf');
    });
  });

  describe('length', () => {
    it('caps the name part at 100 bytes without splitting a letter', () => {
      const long = 'ש'.repeat(80); // 2 bytes each in UTF-8
      const slug = keep(0, 3, long).slice(3, -4);
      expect(new TextEncoder().encode(slug).length).toBeLessThanOrEqual(100);
      expect(slug).toBe('ש'.repeat(50));
    });

    it('keeps combining marks with their letter at the cut', () => {
      const long = 'e\u0301'.repeat(80); // composes to é: 2 bytes each
      const slug = keep(0, 3, long).slice(3, -4);
      expect(slug).toBe('é'.repeat(50));
    });

    it('leaves no trailing separator after the cut', () => {
      const slug = keep(0, 3, `${'a'.repeat(99)} b`).slice(3, -4);
      expect(slug).toBe('a'.repeat(99));
    });
  });
});
