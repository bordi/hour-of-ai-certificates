import { describe, it, expect, vi } from 'vitest';
import { route } from '../src/router';
import { LOCALES } from '../src/locales';

const at = (pathname: string, search = '', hash = '') => {
  const replace = vi.fn();
  return { loc: { pathname, search, hash, replace } as unknown as Location, replace };
};

describe('route', () => {
  it('continues without redirecting on a canonical language URL', () => {
    const { loc, replace } = at('/uk/');
    expect(route(loc, ['en'])).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects the root to the detected language', () => {
    const { loc, replace } = at('/');
    expect(route(loc, ['ru-RU'])).toBe(false);
    expect(replace).toHaveBeenCalledWith('/uk/');
  });

  it('keeps the query string and hash when redirecting', () => {
    const { loc, replace } = at('/', '?utm=1', '#top');
    route(loc, ['uk']);
    expect(replace).toHaveBeenCalledWith('/uk/?utm=1#top');
  });

  it.each(['/uk', '/UK/', '/uk/index.html'])('canonicalises %s to /uk/', (pathname) => {
    const { loc, replace } = at(pathname);
    expect(route(loc, [])).toBe(false);
    expect(replace).toHaveBeenCalledWith('/uk/');
  });

  it('sends an unsupported language code to the detected one', () => {
    const { loc, replace } = at('/fr/');
    route(loc, ['uk']);
    expect(replace).toHaveBeenCalledWith('/uk/');
  });

  describe('draft locales', () => {
    const uk = LOCALES.uk;
    const enDraft = { ...uk, code: 'en', status: 'draft' as const };

    it('production set (ready only): /en/ is unsupported and goes through detection', () => {
      const { loc, replace } = at('/en/');
      expect(route(loc, ['en'], [uk])).toBe(false);
      expect(replace).toHaveBeenCalledWith('/uk/');
    });

    it('dev and preview set: /en/ is served', () => {
      const { loc, replace } = at('/en/');
      expect(route(loc, ['uk'], [uk, enDraft])).toBe(true);
      expect(replace).not.toHaveBeenCalled();
    });

    it('English is the fallback for unknown codes once it is available', () => {
      const { loc, replace } = at('/fr/');
      route(loc, ['de'], [uk, enDraft]);
      expect(replace).toHaveBeenCalledWith('/en/');
    });
  });
});
