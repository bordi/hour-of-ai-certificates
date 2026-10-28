import { describe, it, expect } from 'vitest';
import { detectLocale } from '../src/detect-locale';

const ALL = ['uk', 'en', 'he'];

describe('detectLocale', () => {
  describe('language code in the URL', () => {
    it.each([
      ['/uk/', 'uk'],
      ['/en/', 'en'],
      ['/he/', 'he'],
      ['/he', 'he'],
      ['/HE/', 'he'],
      ['/he/anything/else', 'he'],
    ])('%s -> %s', (pathname, expected) => {
      expect(detectLocale(pathname, ['uk'], ALL)).toBe(expected);
    });

    it.each([
      ['/ru/', 'uk'],
      ['/RU/', 'uk'],
      ['/ru', 'uk'],
      ['/ru/anything', 'uk'],
      ['/iw/', 'he'],
    ])('alias %s -> %s, whatever the browser language', (pathname, expected) => {
      expect(detectLocale(pathname, ['en'], ALL)).toBe(expected);
    });

    it('an alias whose target is not supported is treated like an unknown code', () => {
      expect(detectLocale('/ru/', ['he-IL'], ['en', 'he'])).toBe('he');
      expect(detectLocale('/ru/', [], ['en', 'he'])).toBe('en');
    });

    it('beats the browser language', () => {
      expect(detectLocale('/he/', ['uk-UA', 'en'], ALL)).toBe('he');
    });
  });

  describe('no supported code in the URL', () => {
    it.each(['/', '', '/fr/', '/ua/', '/index.html'])('"%s" falls back to the browser language', (pathname) => {
      expect(detectLocale(pathname, ['he-IL'], ALL)).toBe('he');
    });

    it('takes the first browser language that is supported, in order', () => {
      expect(detectLocale('/', ['de', 'he-IL', 'en'], ALL)).toBe('he');
      expect(detectLocale('/', ['de-DE', 'fr', 'en-GB'], ALL)).toBe('en');
    });

    it('matches region variants by their base language', () => {
      expect(detectLocale('/', ['uk-UA'], ALL)).toBe('uk');
      expect(detectLocale('/', ['en-US'], ALL)).toBe('en');
    });

    it('sends Russian to Ukrainian, even ahead of English', () => {
      expect(detectLocale('/', ['ru-RU', 'en'], ALL)).toBe('uk');
      expect(detectLocale('/', ['ru'], ALL)).toBe('uk');
    });

    it('treats the legacy Hebrew code iw as he', () => {
      expect(detectLocale('/', ['iw-IL'], ALL)).toBe('he');
    });

    it('falls back to English when nothing resolves', () => {
      expect(detectLocale('/', ['de', 'fr'], ALL)).toBe('en');
      expect(detectLocale('/', [], ALL)).toBe('en');
    });

    it('ignores inherited object keys as language codes', () => {
      expect(detectLocale('/', ['constructor', 'toString'], ALL)).toBe('en');
    });
  });

  describe('only some locales are supported', () => {
    it('ignores a URL code that is not supported', () => {
      expect(detectLocale('/he/', ['uk'], ['uk'])).toBe('uk');
    });

    it('skips an alias whose target is not supported', () => {
      expect(detectLocale('/', ['ru', 'en'], ['en', 'he'])).toBe('en');
    });

    it('uses the first supported locale while English is not available', () => {
      expect(detectLocale('/', ['de'], ['uk'])).toBe('uk');
      expect(detectLocale('/', [], ['uk'])).toBe('uk');
    });
  });
});
