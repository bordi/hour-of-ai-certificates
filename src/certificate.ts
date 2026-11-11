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
import fontkit, { type Font } from '@pdf-lib/fontkit';
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
  const font = shaperFor(fontBytes);
  return (text) => text !== '' && font.layout(text).direction === 'rtl';
}

/** A glyph drawn on its own: the text that encodes it, and where it goes relative to the run's start (points). */
export interface PlacedGlyph {
  text: string;
  x: number;
  y: number;
}

/**
 * pdf-lib draws glyphs by their advance widths only and drops the font's mark positioning (GPOS), so Hebrew niqqud
 * or a combining accent lands beside its letter. This places every glyph of a run where fontkit's layout puts it.
 * Returns undefined when a glyph cannot be drawn on its own (pdf-lib would encode a different glyph for its text);
 * the run is then drawn as a whole, as before.
 */
export function placeGlyphs(font: Font, text: string, size: number): { glyphs: PlacedGlyph[]; width: number } | undefined {
  const { glyphs, positions } = font.layout(text);
  const scale = size / font.unitsPerEm;
  const placed: PlacedGlyph[] = [];
  let pen = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const { xAdvance, xOffset, yOffset } = positions[i];
    const alone = String.fromCodePoint(...glyph.codePoints);
    const encoded = alone === '' ? [] : font.layout(alone).glyphs;
    if (encoded.length !== 1 || encoded[0].id !== glyph.id) return undefined;
    placed.push({ text: alone, x: (pen + xOffset) * scale, y: yOffset * scale });
    pen += xAdvance;
  }
  return { glyphs: placed, width: pen * scale };
}

const shapers = new WeakMap<Uint8Array, Font>();
function shaperFor(fontBytes: Uint8Array): Font {
  let font = shapers.get(fontBytes);
  if (!font) shapers.set(fontBytes, (font = fontkit.create(fontBytes)));
  return font;
}

// Combining marks (niqqud, accents left decomposed) are the only glyphs whose position pdf-lib gets wrong.
const MARKS = /\p{M}/u;

/**
 * pdf-lib's subsetting breaks fonts with CFF outlines (.otf, file signature "OTTO"): macOS Preview then draws the
 * wrong glyphs (`!"#$%…` in place of the letters), while pdf.js happens to cope. Such fonts are embedded whole;
 * TrueType fonts (.ttf) are subset as before. A TrueType build of the font avoids the problem altogether.
 */
export function canSubset(fontBytes: Uint8Array): boolean {
  return String.fromCharCode(...fontBytes.subarray(0, 4)) !== 'OTTO';
}

const subsettable = new WeakMap<Uint8Array, boolean>();
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
      const placed = MARKS.test(text) ? placeGlyphs(shaperFor(assets.font), text, layout.size) : undefined;
      return { text, placed, width: placed?.width ?? font.widthOfTextAtSize(text, layout.size) };
    });
    let x = box.centerX - runs.reduce((sum, run) => sum + run.width, 0) / 2;
    for (const run of runs) {
      if (run.placed) {
        for (const g of run.placed.glyphs) page.drawText(g.text, { x: x + g.x, y: line.y + g.y, size: layout.size, font, color });
      } else {
        page.drawText(run.text, { x, y: line.y, size: layout.size, font, color });
      }
      x += run.width;
    }
  }
  if (emboldening > 0) page.pushOperators(popGraphicsState());
}

export async function renderCertificates(assets: Assets, names: string[]): Promise<Uint8Array> {
  const template = await PDFDocument.load(assets.template);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  let subset = subsettable.get(assets.font);
  if (subset === undefined) subsettable.set(assets.font, (subset = canSubset(assets.font)));
  const font = await doc.embedFont(assets.font, { subset });
  const pages = await doc.copyPages(template, names.map(() => 0));
  pages.forEach((page, i) => {
    doc.addPage(page);
    drawName(page, font, names[i], assets);
  });
  doc.setTitle(names.length === 1 ? `Сертифікат — ${names[0]}` : 'Сертифікати — Година ШІ');
  return doc.save();
}
