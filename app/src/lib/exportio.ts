import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';
import { getState } from './store';
import { getCanvas, renderClean } from './renderer';
import { loadState } from './actions';

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

function download(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// Renders a clean version of the layout (no grid, no dimension labels, no selection UI)
// onto a same-sized temp canvas, then crops to the rooms bounding box + padding.
function cropForExport(pad = 60): HTMLCanvasElement {
  const s = getState();
  const live = getCanvas();

  const temp = document.createElement('canvas');
  temp.width = live.width;
  temp.height = live.height;
  renderClean(temp);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  s.rooms.forEach(r => {
    minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
  });

  const sMinX = s.panX + minX * s.scale - pad;
  const sMinY = s.panY + minY * s.scale - pad;
  const sMaxX = s.panX + maxX * s.scale + pad;
  const sMaxY = s.panY + maxY * s.scale + pad;

  const out = document.createElement('canvas');
  out.width  = Math.max(1, Math.round(sMaxX - sMinX));
  out.height = Math.max(1, Math.round(sMaxY - sMinY));
  out.getContext('2d')!.drawImage(temp, -sMinX, -sMinY);
  return out;
}

// Builds a standalone furnishings-list canvas (white background, item rows).
function buildFurnishingsList(): HTMLCanvasElement | null {
  const s = getState();
  if (s.placed.length === 0) return null;

  const fmt = (n: number) => {
    if (s.unit === 'm') return (n * 0.0254).toFixed(2) + ' m';
    const ft = Math.floor(n / 12), i = Math.round((n % 12) * 4) / 4;
    if (ft === 0) return i + '"';
    if (i === 0) return ft + "'";
    return ft + "' " + i + '"';
  };

  const PAD = 48, ROW_H = 28, SWATCH = 14, GAP = 10;
  const titleH = 36;
  const H = PAD + titleH + GAP + s.placed.length * ROW_H + PAD;
  const W = 800;

  const oc = document.createElement('canvas');
  oc.width = W; oc.height = H;
  const c = oc.getContext('2d')!;

  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, W, H);

  c.fillStyle = '#333';
  c.font = 'bold 20px sans-serif';
  c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillText('Furnishings', PAD, PAD);

  s.placed.forEach((item, i) => {
    const iy = PAD + titleH + GAP + i * ROW_H;
    c.fillStyle = item.color || '#cfc9c0';
    c.fillRect(PAD, iy + (ROW_H - SWATCH) / 2, SWATCH, SWATCH);
    c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 1;
    c.strokeRect(PAD, iy + (ROW_H - SWATCH) / 2, SWATCH, SWATCH);
    c.fillStyle = '#333'; c.font = '14px sans-serif'; c.textBaseline = 'middle';
    c.fillText(`${item.name}  —  ${fmt(item.w)} × ${fmt(item.h)}`, PAD + SWATCH + 10, iy + ROW_H / 2);
  });

  return oc;
}

export function exportPNG(): void {
  const s = getState();
  if (s.rooms.length === 0) {
    download(getCanvas(), 'room-layout.png');
    return;
  }
  download(cropForExport(60), 'room-layout.png');
  const list = buildFurnishingsList();
  if (list) download(list, 'room-layout-furnishings.png');
}

export function exportInstagramStory(): void {
  const s = getState();
  if (s.rooms.length === 0) { alert('No rooms to export.'); return; }

  const crop = cropForExport(50);

  const CW = 1080, CH = 1920;
  const EDGE = 60;
  const CARD_PAD = 28;
  const RZ_TOP = 100;
  const RZ_BOT = Math.round(CH * 0.62);
  const RZ_H = RZ_BOT - RZ_TOP;

  const cardX = EDGE, cardW = CW - EDGE * 2;
  const innerW = cardW - CARD_PAD * 2;
  const innerH = RZ_H - CARD_PAD * 2;

  const fitScale = Math.min(innerW / crop.width, innerH / crop.height);
  const drawW = crop.width * fitScale, drawH = crop.height * fitScale;
  const cardH = drawH + CARD_PAD * 2;
  const cardY = RZ_TOP + (RZ_H - cardH) / 2;
  const drawX = cardX + CARD_PAD + (innerW - drawW) / 2;
  const drawY = cardY + CARD_PAD;

  const oc = document.createElement('canvas');
  oc.width = CW; oc.height = CH;
  const c = oc.getContext('2d')!;

  // Background
  c.fillStyle = '#f4efe9';
  c.fillRect(0, 0, CW, CH);

  // Eyebrow label
  c.fillStyle = '#a8998e';
  c.font = '500 26px sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'bottom';
  (c as any).letterSpacing = '4px';
  c.fillText('FLOOR PLAN', CW / 2, cardY - 16);
  (c as any).letterSpacing = '0px';

  // Card shadow + fill
  c.save();
  c.shadowColor = 'rgba(80,60,40,0.18)';
  c.shadowBlur = 40; c.shadowOffsetY = 10;
  roundRect(c, cardX, cardY, cardW, cardH, 18);
  c.fillStyle = '#ffffff';
  c.fill();
  c.restore();

  // Live view crop into card
  c.save();
  roundRect(c, drawX, drawY, drawW, drawH, 10);
  c.clip();
  c.drawImage(crop, drawX, drawY, drawW, drawH);
  c.restore();

  download(oc, 'room-layout-story.png');
}

function encodeState(data: object): string {
  const compressed = deflateSync(strToU8(JSON.stringify(data)), { level: 9 });
  let binary = '';
  for (let i = 0; i < compressed.length; i++) binary += String.fromCharCode(compressed[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeState(encoded: string): unknown {
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(strFromU8(inflateSync(bytes)));
  } catch {
    // Fall back to old uncompressed format
    return JSON.parse(decodeURIComponent(
      Array.prototype.map.call(atob(encoded), (c: string) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    ));
  }
}

export function saveURL(): string {
  const s = getState();
  const data = { v: 2, unit: s.unit, rooms: s.rooms, selRoomId: s.selRoomId,
    walls: s.walls, furnishings: s.furnishings,
    placed: s.placed.map(p => ({ ...p })), openings: s.openings,
    nid: s._nid, scale: s.scale, panX: s.panX, panY: s.panY };
  window.location.hash = 'data=' + encodeState(data);
  return window.location.href;
}

export function loadFromURL(): void {
  const hash = window.location.hash;
  if (!hash.startsWith('#data=')) return;
  try {
    const d = decodeState(hash.slice('#data='.length));
    loadState(d as any);
  } catch (err: any) {
    console.error('Failed to load layout from URL:', err);
  }
}
