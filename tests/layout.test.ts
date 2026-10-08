import { describe, it, expect } from 'vitest';
import { layoutName, NAME_BOX } from '../src/layout';

// fake font: every char is 0.5em wide
const measure = (text: string, size: number) => text.length * size * 0.5;

describe('layoutName', () => {
  it('short name: one line at max size on the baseline', () => {
    const l = layoutName('Тарас Шевченко', measure);
    expect(l.size).toBe(NAME_BOX.maxSize);
    expect(l.lines).toEqual([{ text: 'Тарас Шевченко', y: NAME_BOX.baselineY }]);
  });

  it('medium name: shrinks on one line while >= minSize', () => {
    const name = 'А'.repeat(40); // width@1 = 20 → 520/20 = 26
    const l = layoutName(name, measure);
    expect(l.lines).toHaveLength(1);
    expect(l.size).toBeCloseTo(26);
  });

  it('long name with spaces: two balanced lines', () => {
    const name = 'А'.repeat(29) + ' ' + 'Б'.repeat(30); // one line → 520/30 = 17.3 < 20
    const l = layoutName(name, measure);
    expect(l.size).toBe(NAME_BOX.twoLineMaxSize);
    expect(l.lines.map((x) => x.text)).toEqual(['А'.repeat(29), 'Б'.repeat(30)]);
    expect(l.lines[1].y).toBe(NAME_BOX.twoLineBottomY);
    expect(l.lines[0].y).toBeCloseTo(NAME_BOX.twoLineBottomY + NAME_BOX.twoLineMaxSize * NAME_BOX.lineHeight);
  });

  it('long name without spaces: single line, shrunk below minSize', () => {
    const name = 'Я'.repeat(70); // 520/35
    const l = layoutName(name, measure);
    expect(l.lines).toHaveLength(1);
    expect(l.size).toBeCloseTo(520 / 35);
  });

  it('balanced split picks the middle space', () => {
    const l = layoutName('Аааааааааааааааа Бббббббббббббббб Вввввввввввввввв Гггггггггггггггг', measure);
    expect(l.lines.map((x) => x.text)).toEqual([
      'Аааааааааааааааа Бббббббббббббббб',
      'Вввввввввввввввв Гггггггггггггггг',
    ]);
  });
});
