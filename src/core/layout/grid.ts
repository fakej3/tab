import { clamp } from '@core/utils/clamp';
import type { GridConfig, GridRect } from './LayoutTypes';

export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hasCollision(rect: GridRect, others: GridRect[], ignoreIndex = -1): boolean {
  return others.some((other, index) => index !== ignoreIndex && rectsOverlap(rect, other));
}

export function clampRectToGrid(rect: GridRect, columns: number, maxRows: number): GridRect {
  const w = clamp(rect.w, 1, columns);
  const h = clamp(rect.h, 1, maxRows);
  const x = clamp(rect.x, 0, columns - w);
  const y = clamp(rect.y, 0, Math.max(0, maxRows - h));
  return { x, y, w, h };
}

/** Finds the first collision-free slot for a new widget, scanning row by row. */
export function findFreeSlot(existing: GridRect[], size: { w: number; h: number }, columns: number, maxRows = 200): GridRect {
  for (let y = 0; y < maxRows; y += 1) {
    for (let x = 0; x <= columns - size.w; x += 1) {
      const candidate: GridRect = { x, y, w: size.w, h: size.h };
      if (!hasCollision(candidate, existing)) return candidate;
    }
  }
  return { x: 0, y: maxRows, w: size.w, h: size.h };
}

export function pixelsToGridDelta(deltaPx: { x: number; y: number }, config: GridConfig, columnWidthPx: number) {
  const cellW = columnWidthPx + config.gapPx;
  const cellH = config.rowHeightPx + config.gapPx;
  return {
    x: Math.round(deltaPx.x / cellW),
    y: Math.round(deltaPx.y / cellH)
  };
}

export function gridRectToPixels(rect: GridRect, config: GridConfig, columnWidthPx: number) {
  const cellW = columnWidthPx + config.gapPx;
  const cellH = config.rowHeightPx + config.gapPx;
  return {
    left: rect.x * cellW,
    top: rect.y * cellH,
    width: rect.w * columnWidthPx + (rect.w - 1) * config.gapPx,
    height: rect.h * config.rowHeightPx + (rect.h - 1) * config.gapPx
  };
}
