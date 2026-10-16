import type { FileNameStrategy } from './locales';

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia',
};
const WORD_START: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };
const APOSTROPHE = /['ʼ’`]/;

const isCyr = (ch: string) => Object.prototype.hasOwnProperty.call(MAP, ch.toLowerCase());

export function transliterate(input: string): string {
  let out = '';
  let prev = '';
  for (const ch of input) {
    if (APOSTROPHE.test(ch)) {
      prev = ch;
      continue;
    }
    const lower = ch.toLowerCase();
    if (!isCyr(ch)) {
      out += ch;
      prev = ch;
      continue;
    }
    const atWordStart = !(prev && (isCyr(prev) || APOSTROPHE.test(prev)));
    let latin = atWordStart && WORD_START[lower] ? WORD_START[lower] : MAP[lower];
    if (lower === 'г' && prev.toLowerCase() === 'з') latin = 'gh';
    if (ch !== lower && latin) latin = latin[0].toUpperCase() + latin.slice(1);
    out += latin;
    prev = ch;
  }
  return out;
}

// Invisible direction marks (LRM, RLM, ALM, embeddings, isolates) turn up in pasted Hebrew; they must not reach a file name.
const BIDI_CONTROLS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;
// Dropped, not replaced, so "O'Brien" becomes "OBrien" in every language (as the transliteration already does).
const APOSTROPHES = /['ʼ’`׳]/gu;
const MAX_SLUG_BYTES = 100;

/** Cuts on grapheme boundaries so a letter never loses its accent or vowel marks. */
function truncate(slug: string): string {
  const encoder = new TextEncoder();
  let out = '';
  let bytes = 0;
  for (const { segment } of new Intl.Segmenter().segment(slug)) {
    bytes += encoder.encode(segment).length;
    if (bytes > MAX_SLUG_BYTES) break;
    out += segment;
  }
  return out.replace(/_+$/, '');
}

/**
 * `NN_<name>.pdf`. The number comes first: it keeps entries unique and anchors the order when the name is right-to-left.
 * Letters, combining marks and digits of any script are kept; everything else (including characters Windows forbids)
 * collapses to `_`.
 */
export function certificateFileName(index: number, total: number, name: string, strategy: FileNameStrategy): string {
  const width = Math.max(2, String(total).length);
  const number = String(index + 1).padStart(width, '0');
  const text = name.normalize('NFC');
  const source = strategy === 'kmu-2010' ? transliterate(text) : text;
  const slug = truncate(
    source
      .replace(BIDI_CONTROLS, '')
      .replace(APOSTROPHES, '')
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, ''),
  );
  return `${number}_${slug || 'student'}.pdf`;
}
