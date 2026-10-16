import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('styles.css', () => {
  it('forces the preview canvas to left-to-right (pdf.js text would overlap on rtl pages otherwise)', () => {
    const rule = css.match(/#preview-canvas\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/direction:\s*ltr/);
  });
});
