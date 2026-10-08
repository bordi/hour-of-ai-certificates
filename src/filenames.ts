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

export function certificateFileName(index: number, total: number, name: string): string {
  const width = Math.max(2, String(total).length);
  const number = String(index + 1).padStart(width, '0');
  const slug = transliterate(name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'student';
  return `${number}_${slug}.pdf`;
}
