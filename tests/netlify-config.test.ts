import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const draftFlag = (context: string) =>
  toml.match(new RegExp(`\\[context\\.${context}\\.environment\\]\\s+VITE_ENABLE_DRAFT_LOCALES = "(\\w+)"`))?.[1];

describe('netlify.toml', () => {
  it('serves draft locales on previews but not in production', () => {
    expect(draftFlag('production')).toBe('false');
    expect(draftFlag('deploy-preview')).toBe('true');
    expect(draftFlag('branch-deploy')).toBe('true');
  });

  it('rewrites every path to the language-aware page', () => {
    expect(toml).toMatch(/\[\[redirects\]\]\s+from = "\/\*"\s+to = "\/index\.html"\s+status = 200/);
  });
});
