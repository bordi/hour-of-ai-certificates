import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFName } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { canSubset, createEngineProbe, placeGlyphs, renderCertificates, type Assets } from '../src/certificate';
import { LOCALES } from '../src/locales';

const assets: Assets = {
  template: new Uint8Array(readFileSync(`public${LOCALES.uk.templateUrl}`)),
  font: new Uint8Array(readFileSync(`public${LOCALES.uk.fontUrl}`)),
  dir: LOCALES.uk.dir,
  name: LOCALES.uk.nameStyle,
  title: LOCALES.uk.messages.pdfTitle,
};

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    texts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' '));
  }
  return texts;
}

describe('renderCertificates', () => {
  it('one name → one A4-landscape page containing the name', async () => {
    const bytes = await renderCertificates(assets, ['Шевченко Тарас']);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([842, 595]);
    expect((await pageTexts(bytes))[0]).toContain('Шевченко Тарас');
  });

  it('many names → one page per name, in order', async () => {
    const names = ['Леся Українка', 'Іван Франко', 'Мар’яна Ґудзь-Їжакевич'];
    const texts = await pageTexts(await renderCertificates(assets, names));
    expect(texts).toHaveLength(3);
    names.forEach((n, i) => expect(texts[i]).toContain(n));
  });

  it('combined PDF stays small (template resources shared)', async () => {
    const one = await renderCertificates(assets, ['Тарас']);
    const thirty = await renderCertificates(assets, Array.from({ length: 30 }, (_, i) => `Учень ${i}`));
    expect(thirty.byteLength).toBeLessThan(one.byteLength * 3);
  });

  it('very long name is split over two lines and fully present', async () => {
    const name = 'Олександра-Анастасія Костянтинопольська-Вишневецька Святославівна';
    const text = (await pageTexts(await renderCertificates(assets, [name])))[0];
    for (const part of name.split(' ')) expect(text).toContain(part);
  });

  it('a right-to-left locale leaves left-to-right names as they are', async () => {
    const rtl: Assets = { ...assets, dir: 'rtl' };
    const names = ['Ivan Smith', 'Тарас Шевченко', 'José Müller 2'];
    const texts = await pageTexts(await renderCertificates(rtl, names));
    names.forEach((n, i) => expect(texts[i]).toContain(n));
  });
});

describe('PDF title', () => {
  it.each(Object.values(LOCALES))("is the $code locale's title, for one name and for many, never a student's name", async (locale) => {
    const titled: Assets = { ...assets, title: locale.messages.pdfTitle };
    for (const names of [['Тарас Шевченко'], ['Тарас Шевченко', 'Леся Українка']]) {
      const title = (await PDFDocument.load(await renderCertificates(titled, names))).getTitle();
      expect(title).toBe(locale.messages.pdfTitle);
      expect(title).not.toContain('Тарас');
    }
  });
});

describe('renderCertificates for the Hebrew locale (real Hebrew glyphs)', () => {
  const he = LOCALES.he;
  const heAssets: Assets = {
    template: new Uint8Array(readFileSync(`public${he.templateUrl}`)),
    font: new Uint8Array(readFileSync(`public${he.fontUrl}`)),
    dir: he.dir,
    name: he.nameStyle,
    title: he.messages.pdfTitle,
  };

  it('draws Hebrew, mixed and Latin names on the Hebrew template, one page each', async () => {
    const names = ['דניאל כהן', 'Ivan דני', 'José Müller'];
    const bytes = await renderCertificates(heAssets, names);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
    const { width, height } = doc.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([1212, 857]);
    const texts = await pageTexts(bytes);
    for (const word of ['דניאל', 'כהן']) expect(texts[0]).toContain(word);
    for (const word of ['Ivan', 'דני']) expect(texts[1]).toContain(word);
    expect(texts[2]).toContain('José Müller');
  });

  it('subsets TrueType fonts, but not CFF (.otf) ones: a pdf-lib subset of those prints the wrong glyphs in macOS Preview', async () => {
    expect(canSubset(heAssets.font)).toBe(true);
    expect(canSubset(assets.font)).toBe(true);
    expect(canSubset(new Uint8Array([0x4f, 0x54, 0x54, 0x4f, 0, 0]))).toBe(false); // "OTTO"
    // The broken form is a subset CFF stream (FontFile3 /CIDFontType0C); it must not appear.
    const doc = await PDFDocument.load(await renderCertificates(heAssets, ['דני', 'Тарас']));
    const subtypes = doc.context
      .enumerateIndirectObjects()
      .map(([, obj]) => ('dict' in obj ? String((obj as { dict: { get(n: unknown): unknown } }).dict.get(PDFName.of('Subtype'))) : ''));
    expect(subtypes).not.toContain('/CIDFontType0C');
  });

  it('uses the synthetic bold (fill and outline) only where the locale asks for it', async () => {
    const renderModes = async (assets: Assets) => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const doc = await pdfjs.getDocument({ data: (await renderCertificates(assets, ['דני'])).slice() }).promise;
      const { fnArray, argsArray } = await (await doc.getPage(1)).getOperatorList();
      return fnArray.flatMap((fn, i) => (fn === pdfjs.OPS.setTextRenderingMode ? [argsArray[i][0]] : []));
    };
    expect(await renderModes({ ...heAssets, name: { ...he.nameStyle, emboldening: 0.025 } })).toContain(2); // 2 = fill and outline
    expect(await renderModes(heAssets)).not.toContain(2);
  });
});

describe('placeGlyphs (niqqud and other combining marks)', () => {
  const font = fontkit.create(new Uint8Array(readFileSync(`public${LOCALES.he.fontUrl}`)));
  const SIZE = 36;
  const scale = SIZE / font.unitsPerEm;
  const isMark = (text: string) => /^\p{M}+$/u.test(text);

  // Where a mark's ink lands, relative to its letter: 0 is the letter's left edge, 1 its right edge. In a right-to-left
  // run the engine returns each letter's marks just before the letter (visual order).
  function markPositions(name: string): { mark: string; base: string; at: number }[] {
    const placed = placeGlyphs(font, name, SIZE)!;
    return placed.glyphs.flatMap((g, i) => {
      if (!isMark(g.text)) return [];
      const base = placed.glyphs.slice(i + 1).find((b) => !isMark(b.text))!;
      const width = font.layout(base.text).glyphs[0].advanceWidth * scale;
      const { minX, maxX } = font.layout(g.text).glyphs[0].bbox;
      return [{ mark: g.text, base: base.text, at: (g.x + ((minX + maxX) / 2) * scale - base.x) / width }];
    });
  }

  it('centres vowel points and dagesh on their letter', () => {
    const centred = [
      ...markPositions('שָׁלוֹם').filter((p) => p.mark === '\u05B8'), // qamats under shin
      ...markPositions('דָּנִי').filter((p) => p.base === 'ד' || p.base === 'נ'), // qamats, dagesh, hiriq
    ];
    expect(centred).toHaveLength(4);
    for (const p of centred) expect(Math.abs(p.at - 0.5), JSON.stringify(p)).toBeLessThan(0.25);
  });

  it('puts the shin dot on the right of the shin', () => {
    const [dot] = markPositions('שָׁלוֹם').filter((p) => p.mark === '\u05C1');
    expect(dot.at).toBeGreaterThan(0.6);
  });

  it('keeps the width of the run (marks take no room)', () => {
    const plain = placeGlyphs(font, 'שלום', SIZE)!.width;
    expect(placeGlyphs(font, 'שָׁלוֹם', SIZE)!.width).toBeCloseTo(plain, 1);
  });

  it('draws names with marks with real glyphs, and names without them exactly as before', async () => {
    const he = LOCALES.he;
    const heAssets: Assets = {
      template: new Uint8Array(readFileSync(`public${he.templateUrl}`)),
      font: new Uint8Array(readFileSync(`public${he.fontUrl}`)),
      dir: he.dir,
      name: he.nameStyle,
      title: he.messages.pdfTitle,
    };
    const [marked, plain] = await pageTexts(await renderCertificates(heAssets, ['שָׁלוֹם כֹּהֵן', 'שלום כהן']));
    for (const ch of 'שלוםכהן') expect(marked).toContain(ch);
    expect(plain).toContain('שלום');
    expect(plain).toContain('כהן');
  });
});

describe('createEngineProbe', () => {
  // fontkit picks the direction from the first lettered character, even if the font has no glyph for it.
  const reverses = createEngineProbe(assets.font);

  it('reverses text whose first letter is Hebrew or Arabic', () => {
    expect(reverses('דני')).toBe(true);
    expect(reverses('(דני)')).toBe(true);
    expect(reverses('12 דני')).toBe(true);
    expect(reverses('דני Ivan')).toBe(true);
    expect(reverses('مرحبا')).toBe(true);
  });

  it('leaves text alone whose first letter is not right-to-left', () => {
    expect(reverses('Ivan')).toBe(false);
    expect(reverses('Тарас Шевченко')).toBe(false);
    expect(reverses('Ivan דני')).toBe(false);
    expect(reverses('12')).toBe(false);
    expect(reverses(' ')).toBe(false);
    expect(reverses('')).toBe(false);
  });
});
