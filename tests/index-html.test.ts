import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { LOCALES } from '../src/locales';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const used = [...html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="(\w+)"/g)].map((m) => m[1]);

describe('index.html', () => {
  it('references only message keys that every locale defines', () => {
    expect(used.length).toBeGreaterThan(0);
    for (const locale of Object.values(LOCALES)) {
      for (const key of used) expect(Object.keys(locale.messages), key).toContain(key);
    }
  });

  it('lets the browser pick the direction of the names list (Hebrew and Latin lines mix)', () => {
    expect(html).toMatch(/<textarea[^>]*id="names"[^>]*dir="auto"/);
  });

  it('keeps the pager arrows out of the accessible name, so they can be mirrored', () => {
    expect(html.match(/<span class="arrow" aria-hidden="true">/g)).toHaveLength(2);
  });
});
