import { describe, it, expect, vi } from 'vitest';
import { route } from '../src/router';

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
});
