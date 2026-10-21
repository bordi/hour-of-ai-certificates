export type Measure = (text: string, size: number) => number;

export interface NameLayout {
  size: number;
  lines: { text: string; y: number }[];
}

/** Where and how big the name may be, in PDF points of one template (origin bottom-left). */
export interface NameBox {
  centerX: number;
  maxWidth: number;
  baselineY: number;
  maxSize: number;
  minSize: number;
  twoLineMaxSize: number;
  twoLineBottomY: number;
  lineHeight: number;
}

/** The 2025 Ukrainian template (842 × 595). Each locale picks its box in its own file. */
export const NAME_BOX: NameBox = {
  centerX: 421,
  maxWidth: 520,
  baselineY: 350,
  maxSize: 36,
  minSize: 20,
  twoLineMaxSize: 26,
  twoLineBottomY: 346,
  lineHeight: 1.15,
};

export function layoutName(name: string, measure: Measure, box = NAME_BOX): NameLayout {
  const fit = (text: string, max: number) => Math.min(max, box.maxWidth / measure(text, 1));

  const single: NameLayout = { size: fit(name, box.maxSize), lines: [{ text: name, y: box.baselineY }] };
  if (single.size >= box.minSize) return single;

  const words = name.split(' ');
  if (words.length < 2) return single;

  let best: [string, string] | null = null;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const top = words.slice(0, i).join(' ');
    const bottom = words.slice(i).join(' ');
    const width = Math.max(measure(top, 1), measure(bottom, 1));
    if (width < bestWidth) {
      bestWidth = width;
      best = [top, bottom];
    }
  }
  const [top, bottom] = best!;
  const size = Math.min(fit(top, box.twoLineMaxSize), fit(bottom, box.twoLineMaxSize));
  if (size <= single.size) return single;
  return {
    size,
    lines: [
      { text: top, y: box.twoLineBottomY + size * box.lineHeight },
      { text: bottom, y: box.twoLineBottomY },
    ],
  };
}
