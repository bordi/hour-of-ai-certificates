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
  it('numbers with at least 2 digits and sanitises to ASCII', () => {
    expect(certificateFileName(0, 28, 'Шевченко Тарас')).toBe('01_Shevchenko_Taras.pdf');
    expect(certificateFileName(9, 28, 'Марія-Олена О’Коннор')).toBe('10_Mariia_Olena_OKonnor.pdf');
  });

  it('pads to 3 digits for 100+ names', () => {
    expect(certificateFileName(4, 120, 'Іван')).toBe('005_Ivan.pdf');
  });

  it('falls back when nothing transliterable remains', () => {
    expect(certificateFileName(0, 3, '✨✨')).toBe('01_student.pdf');
  });
});
