import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { renderCertificates, type Assets } from '../src/certificate';
import { LOCALES } from '../src/locales';

const assets: Assets = {
  template: new Uint8Array(readFileSync(`public${LOCALES.uk.templateUrl}`)),
  font: new Uint8Array(readFileSync(`public${LOCALES.uk.fontUrl}`)),
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
});
