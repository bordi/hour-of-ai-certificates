import bidiFactory from 'bidi-js';
import type { Direction } from './locales';

const bidi = bidiFactory();
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
// U+FFFC is a single UTF-16 unit of bidi class ON ("other neutral"); it stands in for characters outside the BMP.
const STAND_IN = '\uFFFC';

/** A stretch of text with one direction. `text` is in logical (typing) order. */
export interface Run {
  text: string;
  rtl: boolean;
}

/**
 * Splits a name into runs and returns them in visual order, left to right (Unicode UAX #9; `base` is the
 * locale's paragraph direction). pdf-lib cannot do this: it draws glyphs in the order given. Hebrew,
 * or Hebrew mixed with Latin words and digits, therefore has to be drawn run by run.
 *
 * Works on grapheme clusters, so a letter keeps its vowel marks (niqqud) or accents; brackets inside
 * right-to-left runs are replaced by their mirror image. Left-to-right text is a single run.
 */
export function visualRuns(text: string, base: Direction): Run[] {
  const clusters = [...segmenter.segment(text)].map((part) => part.segment);
  if (clusters.length === 0) return [];

  // One BMP stand-in per cluster, so the library's UTF-16 indices are cluster indices.
  const proxy = clusters
    .map((cluster) => {
      const first = String.fromCodePoint(cluster.codePointAt(0)!);
      return first.length === 1 ? first : STAND_IN;
    })
    .join('');

  const resolved = bidi.getEmbeddingLevels(proxy, base);
  const mirrored = bidi.getMirroredCharactersMap(proxy, resolved.levels);
  const cluster = (index: number) => {
    const mirror = mirrored.get(index);
    return mirror ? mirror + clusters[index].slice(1) : clusters[index];
  };

  // Consecutive clusters of the same direction form a run. In visual order a right-to-left run reads
  // backwards, so reversing it gives the logical text.
  const runs: Run[] = [];
  let group: string[] = [];
  let rtl = false;
  const flush = () => {
    if (group.length > 0) runs.push({ text: (rtl ? group.reverse() : group).join(''), rtl });
    group = [];
  };
  for (const index of bidi.getReorderedIndices(proxy, resolved)) {
    const isRtl = (resolved.levels[index] & 1) === 1;
    if (isRtl !== rtl) flush();
    rtl = isRtl;
    group.push(cluster(index));
  }
  flush();
  return runs;
}

/**
 * The text to hand to a shaping engine so that the run ends up drawn in visual order. Engines such as
 * fontkit reverse all glyphs of a run whose first lettered character belongs to a right-to-left script
 * (`engineReverses`); that is right for a right-to-left run and wrong for anything else. Where the engine
 * disagrees with the run, reverse the text ourselves (code points, so marks follow the engine's reversal).
 */
export function glyphOrderInput(run: Run, engineReverses: boolean): string {
  return run.rtl === engineReverses ? run.text : [...run.text].reverse().join('');
}
