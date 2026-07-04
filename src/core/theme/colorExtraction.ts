/**
 * Extracts a small palette from a wallpaper image via canvas pixel sampling.
 * Deliberately simple (average + saturation-weighted dominant bucket) —
 * good enough to drive "match theme to wallpaper" today, and isolated here
 * so it can be swapped for a proper k-means/quantization later without
 * touching ThemeEngine's public API.
 */
export interface ExtractedPalette {
  dominant: string;
  average: string;
  isDark: boolean;
  /** Relative luminance of the average color, 0 (black) to 1 (white). */
  luminance: number;
}

export async function extractPaletteFromImage(source: HTMLImageElement | ImageBitmap): Promise<ExtractedPalette> {
  const canvas = document.createElement('canvas');
  const sampleSize = 48;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(source, 0, 0, sampleSize, sampleSize);
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const buckets = new Map<string, { rgb: [number, number, number]; weight: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i]!;
    const pg = data[i + 1]!;
    const pb = data[i + 2]!;
    const alpha = data[i + 3]!;
    if (alpha < 200) continue;

    r += pr;
    g += pg;
    b += pb;
    count += 1;

    const bucketKey = `${pr >> 5}-${pg >> 5}-${pb >> 5}`;
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const weight = 1 + saturation * 2;
    const existing = buckets.get(bucketKey);
    if (existing) existing.weight += weight;
    else buckets.set(bucketKey, { rgb: [pr, pg, pb], weight });
  }

  if (count === 0) {
    return { dominant: '#8b7cf6', average: '#8b7cf6', isDark: true, luminance: 0.2 };
  }

  const average: [number, number, number] = [r / count, g / count, b / count];
  let dominant = average;
  let bestWeight = -Infinity;
  for (const bucket of buckets.values()) {
    if (bucket.weight > bestWeight) {
      bestWeight = bucket.weight;
      dominant = bucket.rgb;
    }
  }

  const luminance = (0.2126 * average[0] + 0.7152 * average[1] + 0.0722 * average[2]) / 255;

  return {
    dominant: rgbToHex(dominant),
    average: rgbToHex(average),
    isDark: luminance < 0.5,
    luminance
  };
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (value: number) => Math.round(clamp255(value)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, value));
}
