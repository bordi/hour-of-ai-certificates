import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFName } from 'pdf-lib';
import { canSubset, createEngineProbe, renderCertificates, type Assets } from '../src/certificate';
import { LOCALES } from '../src/locales';

const assets: Assets = {
  template: new Uint8Array(readFileSync(`public${LOCALES.uk.templateUrl}`)),
  font: new Uint8Array(readFileSync(`public${LOCALES.uk.fontUrl}`)),
  dir: LOCALES.uk.dir,
  name: LOCALES.uk.nameStyle,
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

describe('renderCertificates for the Hebrew locale (real Hebrew glyphs)', () => {
  const he = LOCALES.he;
  const heAssets: Assets = {
    template: new Uint8Array(readFileSync(`public${he.templateUrl}`)),
    font: new Uint8Array(readFileSync(`public${he.fontUrl}`)),
    dir: he.dir,
    name: he.nameStyle,
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
