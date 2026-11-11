import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('styles.css', () => {
  it('forces the preview canvas to left-to-right (pdf.js text would overlap on rtl pages otherwise)', () => {
    const rule = css.match(/#preview-canvas\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/direction:\s*ltr/);
  });

  it('draws Hebrew interface text with Wix Madefor Hebrew, from files that exist, for Hebrew characters only', () => {
    const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
    const hebrew = faces.filter((f) => f.includes("'Wix Madefor Hebrew'"));
    expect(hebrew.map((f) => f.match(/font-weight:\s*(\d+)/)?.[1])).toEqual(['400', '600']);
    for (const face of hebrew) {
      const url = face.match(/url\('([^']+)'\)/)?.[1] ?? '';
      expect(existsSync(`public${url}`), url).toBe(true);
      expect(face).toMatch(/unicode-range:\s*U\+0590-05FF/);
    }
    const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(root).toMatch(/font-family:\s*'Wix Madefor Text',\s*'Wix Madefor Hebrew',/);
  });
});
