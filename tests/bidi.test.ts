import { describe, it, expect } from 'vitest';
import { glyphOrderInput, visualRuns } from '../src/bidi';

describe('visualRuns', () => {
  it('has no runs for an empty name', () => {
    expect(visualRuns('', 'rtl')).toEqual([]);
    expect(visualRuns('', 'ltr')).toEqual([]);
  });

  describe('left-to-right text is a single left-to-right run, whatever the locale', () => {
    it.each(['Ivan Smith', 'Тарас Шевченко', 'José Müller', 'Anna 2', "O'Brien", 'Мар’яна', 'Jose\u0301'])('%s', (name) => {
      expect(visualRuns(name, 'ltr')).toEqual([{ text: name, rtl: false }]);
      expect(visualRuns(name, 'rtl')).toEqual([{ text: name, rtl: false }]);
    });
  });

  describe('right-to-left locale', () => {
    it('pure Hebrew is one right-to-left run in logical order', () => {
      expect(visualRuns('דני כהן', 'rtl')).toEqual([{ text: 'דני כהן', rtl: true }]);
    });

    it('keeps niqqud attached to its letter', () => {
      const name = 'ד\u05bc\u05b8וד';
      expect(visualRuns(name, 'rtl')).toEqual([{ text: name, rtl: true }]);
    });

    it('treats geresh and gershayim as Hebrew', () => {
      expect(visualRuns("ג׳ורג׳", 'rtl')).toEqual([{ text: "ג׳ורג׳", rtl: true }]);
      expect(visualRuns('צה״ל', 'rtl')).toEqual([{ text: 'צה״ל', rtl: true }]);
    });

    it('a Latin word inside Hebrew becomes its own run; the first name (logically first) is on the right', () => {
      // visual, left to right: Hebrew ("דני" and the space), then Ivan
      expect(visualRuns('Ivan דני', 'rtl')).toEqual([
        { text: ' דני', rtl: true },
        { text: 'Ivan', rtl: false },
      ]);
    });

    it('a Latin word after Hebrew is drawn to its left', () => {
      expect(visualRuns('דני Ivan', 'rtl')).toEqual([
        { text: 'Ivan', rtl: false },
        { text: 'דני ', rtl: true },
      ]);
    });

    it('digits keep their order and sit to the left of the Hebrew that precedes them', () => {
      expect(visualRuns('דני 12', 'rtl')).toEqual([
        { text: '12', rtl: false },
        { text: 'דני ', rtl: true },
      ]);
    });

    it('mirrors brackets inside right-to-left runs', () => {
      expect(visualRuns('דני (א)', 'rtl')).toEqual([{ text: 'דני )א(', rtl: true }]);
    });

    it('keeps a decomposed é together next to Hebrew', () => {
      expect(visualRuns('Jose\u0301 דני', 'rtl')).toEqual([
        { text: ' דני', rtl: true },
        { text: 'Jose\u0301', rtl: false },
      ]);
    });

    it('keeps characters outside the BMP intact', () => {
      expect(visualRuns('דני 😀', 'rtl')).toEqual([{ text: 'דני 😀', rtl: true }]);
    });
  });

  describe('left-to-right locale with a Hebrew word', () => {
    it('keeps the logical order of the runs and marks only the Hebrew as right-to-left', () => {
      expect(visualRuns('Ivan דני', 'ltr')).toEqual([
        { text: 'Ivan ', rtl: false },
        { text: 'דני', rtl: true },
      ]);
    });
  });
});

describe('glyphOrderInput', () => {
  it('passes a right-to-left run as is when the engine reverses it', () => {
    expect(glyphOrderInput({ text: 'דני', rtl: true }, true)).toBe('דני');
  });

  it('passes a left-to-right run as is when the engine does not reverse it', () => {
    expect(glyphOrderInput({ text: 'Ivan', rtl: false }, false)).toBe('Ivan');
  });

  it('reverses a right-to-left run the engine would leave alone (no letters to detect the script from)', () => {
    expect(glyphOrderInput({ text: ')(', rtl: true }, false)).toBe('()');
  });

  it('pre-reverses a left-to-right run the engine would reverse, so marks end up where they started', () => {
    expect(glyphOrderInput({ text: 'ab\u0301', rtl: false }, true)).toBe('\u0301ba');
  });
});
