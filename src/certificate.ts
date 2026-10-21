import {
  LineJoinStyle,
  PDFDocument,
  TextRenderingMode,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setLineJoin,
  setLineWidth,
  setStrokingColor,
  setTextRenderingMode,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { glyphOrderInput, visualRuns } from './bidi';
import { layoutName } from './layout';
import type { Direction, NameStyle } from './locales';

export interface Assets {
  template: Uint8Array;
  font: Uint8Array;
  /** Paragraph direction of the locale; right-to-left names are reordered before drawing. */
  dir: Direction;
  name: NameStyle;
}

/**
 * fontkit (inside pdf-lib) reverses every glyph of a text whose first lettered character is from a
 * right-to-left script, however the rest is written. Ask it, so `glyphOrderInput` can compensate.
 */
export function createEngineProbe(fontBytes: Uint8Array): (text: string) => boolean {
  const font = fontkit.create(fontBytes);
  return (text) => text !== '' && font.layout(text).direction === 'rtl';
}

const probes = new WeakMap<Uint8Array, (text: string) => boolean>();
function probeFor(fontBytes: Uint8Array): (text: string) => boolean {
  let probe = probes.get(fontBytes);
  if (!probe) probes.set(fontBytes, (probe = createEngineProbe(fontBytes)));
  return probe;
}

function drawName(page: PDFPage, font: PDFFont, name: string, assets: Assets): void {
  const { box, emboldening } = assets.name;
  const color = rgb(...assets.name.color);
  // Wrapping and sizing work on the logical text (widths do not depend on order); drawing goes run by run.
  const layout = layoutName(name, (t, s) => font.widthOfTextAtSize(t, s), box);
  const engineReverses = probeFor(assets.font);
  if (emboldening > 0) {
    // Fill and outline the glyphs: the stroke thickens them evenly (a bold look for fonts that only have one weight).
    page.pushOperators(
      pushGraphicsState(),
      setTextRenderingMode(TextRenderingMode.FillAndOutline),
      setLineWidth(emboldening * layout.size),
      setLineJoin(LineJoinStyle.Round),
      setStrokingColor(color),
    );
  }
  for (const line of layout.lines) {
    const runs = visualRuns(line.text, assets.dir).map((run) => {
      const text = glyphOrderInput(run, engineReverses(run.text));
      return { text, width: font.widthOfTextAtSize(text, layout.size) };
    });
    let x = box.centerX - runs.reduce((sum, run) => sum + run.width, 0) / 2;
    for (const run of runs) {
      page.drawText(run.text, { x, y: line.y, size: layout.size, font, color });
      x += run.width;
    }
  }
  if (emboldening > 0) page.pushOperators(popGraphicsState());
}

export async function renderCertificates(assets: Assets, names: string[]): Promise<Uint8Array> {
  const template = await PDFDocument.load(assets.template);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(assets.font, { subset: true });
  const pages = await doc.copyPages(template, names.map(() => 0));
  pages.forEach((page, i) => {
    doc.addPage(page);
    drawName(page, font, names[i], assets);
  });
  doc.setTitle(names.length === 1 ? `Сертифікат — ${names[0]}` : 'Сертифікати — Година ШІ');
  return doc.save();
}
