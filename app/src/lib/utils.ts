import { getState } from './store';
import type { PlacedItem } from './types';

export function toIn(v: number): number {
  return getState().unit === 'm' ? v / 0.0254 : v * 12;
}

export function fmtIn(n: number): string {
  const s = getState();
  if (s.unit === 'm') return (n * 0.0254).toFixed(2) + ' m';
  const ft = Math.floor(n / 12);
  const i = Math.round((n % 12) * 4) / 4;
  if (ft === 0) return i + '"';
  if (i === 0) return ft + "'";
  return ft + "' " + i + '"';
}

export function snap(n: number): number {
  return Math.round(n);
}

export function snapPt(x: number, y: number): { x: number; y: number } {
  return { x: snap(x), y: snap(y) };
}

export function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

export function ts(ix: number, iy: number): { x: number; y: number } {
  const s = getState();
  return { x: s.panX + ix * s.scale, y: s.panY + iy * s.scale };
}

export function tr(sx: number, sy: number): { x: number; y: number } {
  const s = getState();
  return { x: (sx - s.panX) / s.scale, y: (sy - s.panY) / s.scale };
}

export function extSizes(item: PlacedItem) {
  const ext = item.extensions;
  if (!ext) return { si: 0, eT: 0, eB: 0, eL: 0, eR: 0 };
  const si = ext.sizeIncrease?.amount ?? 0;
  return {
    si,
    eT: si + (ext.top?.size    ?? 0),
    eB: si + (ext.bottom?.size ?? 0),
    eL: si + (ext.left?.size   ?? 0),
    eR: si + (ext.right?.size  ?? 0),
  };
}

export function d2(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function dToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  if (l2 === 0) return d2(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return d2(px, py, ax + t * dx, ay + t * dy);
}
