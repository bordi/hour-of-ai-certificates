import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { layoutName, NAME_BOX } from './layout';

export interface Assets {
  template: Uint8Array;
  font: Uint8Array;
}

/** Template blue, read from the template's content stream. */
export const NAME_COLOR = rgb(0.180392, 0.317647, 0.956863);

function drawName(page: PDFPage, font: PDFFont, name: string): void {
  const layout = layoutName(name, (t, s) => font.widthOfTextAtSize(t, s));
  for (const line of layout.lines) {
    page.drawText(line.text, {
      x: NAME_BOX.centerX - font.widthOfTextAtSize(line.text, layout.size) / 2,
      y: line.y,
      size: layout.size,
      font,
      color: NAME_COLOR,
    });
  }
}

export async function renderCertificates(assets: Assets, names: string[]): Promise<Uint8Array> {
  const template = await PDFDocument.load(assets.template);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(assets.font, { subset: true });
  const pages = await doc.copyPages(template, names.map(() => 0));
  pages.forEach((page, i) => {
    doc.addPage(page);
    drawName(page, font, names[i]);
  });
  doc.setTitle(names.length === 1 ? `Сертифікат — ${names[0]}` : 'Сертифікати — Година ШІ');
  return doc.save();
}
