import { getState } from './store';
import { ts, isDark, extSizes } from './utils';
import { handles, oGeom } from './physics';
import type { PlacedItem, Wall, Opening, Room } from './types';

let ctx: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;

export function initRenderer(cv: HTMLCanvasElement): void {
  canvas = cv;
  ctx = cv.getContext('2d')!;
}

export function getCanvas(): HTMLCanvasElement {
  return canvas;
}

// Renders the layout to an arbitrary target canvas: no grid, no dimension labels,
// no selection highlights or handles. Used by export functions.
export function renderClean(target: HTMLCanvasElement): void {
  const prev = ctx;
  ctx = target.getContext('2d')!;
  const s = getState();
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, target.width, target.height);
  s.rooms.forEach(room => {
    const rs = ts(room.x, room.y);
    const re = ts(room.x + room.w, room.y + room.h);
    const rw = re.x - rs.x, rh = re.y - rs.y;
    ctx.fillStyle = room.color || '#f0f0f5';
    ctx.fillRect(rs.x, rs.y, rw, rh);
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.strokeRect(rs.x, rs.y, rw, rh);
    // Pill label pinned to top-left of room
    const fs = Math.max(11, Math.min(18, rw / 8));
    ctx.font = `600 ${fs}px -apple-system,sans-serif`;
    const tw = ctx.measureText(room.name).width;
    const ph = fs + 10, pw = tw + fs;
    if (pw < rw * 0.95 && ph < rh * 0.6) {
      const px = rs.x + 8, py = rs.y + 8;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, ph / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(room.name, px + pw / 2, py + ph / 2);
      ctx.restore();
    }
  });
  s.walls.forEach(w => drawWall(w, false));
  s.openings.forEach(o => drawOpening(o, false));
  s.placed.forEach(p => drawItem(p, false));
  ctx = prev;
}

export function render(): void {
  if (!ctx || !canvas) return;
  const s = getState();
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, W, H);

  s.rooms.forEach(room => {
    const rs = ts(room.x, room.y);
    const re = ts(room.x + room.w, room.y + room.h);
    const sel = room.id === s.selRoomId;

    ctx.fillStyle = room.color || '#f0f0f5';
    ctx.fillRect(rs.x, rs.y, re.x - rs.x, re.y - rs.y);

    drawGrid(room);

    ctx.strokeStyle = sel ? '#4a90e2' : '#ccc';
    ctx.lineWidth   = sel ? 2 : 1;
    ctx.setLineDash([]);
    ctx.strokeRect(rs.x, rs.y, re.x - rs.x, re.y - rs.y);

    drawRoomLabel(room);
  });

  s.walls.forEach(w => drawWall(w, w.id === s.selWallId));

  if (s.mode === 'wall' && s.wverts.length > 0) drawWallPrev();

  s.openings.forEach(o => drawOpening(o, o.id === s.selOId));
  s.placed.forEach(p => drawItem(p, p.id === s.selId));
  s.rooms.forEach(room => drawRoomDims(room));
}

function drawGrid(room: Room): void {
  const s = getState();
  const step = 12 * s.scale;
  const rs = ts(room.x, room.y);
  const re = ts(room.x + room.w, room.y + room.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rs.x, rs.y, re.x - rs.x, re.y - rs.y);
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,.22)';
  ctx.lineWidth = 0.5;
  for (let x = rs.x; x <= re.x; x += step) {
    ctx.beginPath(); ctx.moveTo(x, rs.y); ctx.lineTo(x, re.y); ctx.stroke();
  }
  for (let y = rs.y; y <= re.y; y += step) {
    ctx.beginPath(); ctx.moveTo(rs.x, y); ctx.lineTo(re.x, y); ctx.stroke();
  }
  ctx.restore();
}

function drawRoomLabel(room: Room): void {
  const rs = ts(room.x, room.y);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.font = '11px -apple-system,sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(room.name, rs.x + 6, rs.y + 5);
  ctx.restore();
}

function drawWall(w: Wall, sel: boolean): void {
  const a = ts(w.x1, w.y1), b = ts(w.x2, w.y2);
  ctx.save();
  ctx.strokeStyle = sel ? '#4a90e2' : '#2a2a2a';
  ctx.lineWidth = sel ? 7 : 6;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

  if (sel && !w.locked) {
    // draggable endpoint handles
    [a, b].forEach(p => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  } else {
    ctx.fillStyle = sel ? '#4a90e2' : '#444';
    ctx.setLineDash([]);
    [a, b].forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    });
  }
  ctx.restore();
}

function drawWallPrev(): void {
  const s = getState();
  ctx.save();
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineCap = 'round';
  for (let i = 0; i < s.wverts.length - 1; i++) {
    const a = ts(s.wverts[i].x, s.wverts[i].y);
    const b = ts(s.wverts[i + 1].x, s.wverts[i + 1].y);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  if (s._mouseR && s.wverts.length > 0) {
    const a = ts(s.wverts[s.wverts.length - 1].x, s.wverts[s.wverts.length - 1].y);
    const b = ts(s._mouseR.x, s._mouseR.y);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.setLineDash([]);
  s.wverts.forEach((v, i) => {
    const p = ts(v.x, v.y);
    const dragging = i === s._wallDragIdx;
    ctx.fillStyle = dragging ? '#e2974a' : '#4a90e2';
    ctx.beginPath(); ctx.arc(p.x, p.y, dragging ? 8 : 5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

function drawOpening(o: Opening, sel: boolean): void {
  const s = getState();
  const wall = s.walls.find(w => w.id === o.wallId);
  if (!wall) return;
  const { ocx, ocy, ang } = oGeom(wall, o);
  const sp = ts(ocx, ocy);
  const hw = (o.width / 2) * s.scale;
  const hh = Math.max(6, 4 * s.scale);

  ctx.save();
  ctx.translate(sp.x, sp.y);
  ctx.rotate(ang);

  if (o.type === 'door') {
    ctx.fillStyle   = sel ? '#fde8d0' : '#fffaf5';
    ctx.strokeStyle = sel ? '#c05a0e' : '#c07840';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(-hw, -hh / 2, hw * 2, hh); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = sel ? '#c05a0e' : '#d09060';
    ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    const swingData = [
      { hx: -hw, a0: -Math.PI / 2, a1: 0,           ccw: false },
      { hx:  hw, a0:  Math.PI,     a1: -Math.PI / 2, ccw: false },
      { hx: -hw, a0:  0,           a1:  Math.PI / 2, ccw: false },
      { hx:  hw, a0:  Math.PI,     a1:  Math.PI / 2, ccw: true  },
    ][o.swing ?? 0];
    ctx.beginPath(); ctx.arc(swingData.hx, 0, hw * 2, swingData.a0, swingData.a1, swingData.ccw); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#a06030';
    ctx.font = `bold ${Math.max(9, Math.min(12, hw * 0.4))}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('D', 0, 0);
  } else {
    ctx.fillStyle   = sel ? '#d0e8fd' : '#eef6ff';
    ctx.strokeStyle = sel ? '#0e6bc0' : '#4090c0';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(-hw, -hh / 2, hw * 2, hh); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = sel ? '#4a90e2' : '#80b8e0'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.4, -hh / 2); ctx.lineTo(-hw * 0.4, hh / 2);
    ctx.moveTo( hw * 0.4, -hh / 2); ctx.lineTo( hw * 0.4, hh / 2);
    ctx.stroke();
    ctx.fillStyle = '#2060a0';
    ctx.font = `bold ${Math.max(9, Math.min(12, hw * 0.4))}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('W', 0, 0);
  }
  ctx.restore();
}

function itemPath(hw: number, hh: number, shape?: string): void {
  switch (shape) {
    case 'round': case 'oval':
      ctx.beginPath();
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      break;
    case 'lshape':
      ctx.beginPath();
      ctx.moveTo(-hw, -hh); ctx.lineTo(hw, -hh); ctx.lineTo(hw, -hh * 0.2);
      ctx.lineTo(-hw * 0.1, -hh * 0.2); ctx.lineTo(-hw * 0.1, hh); ctx.lineTo(-hw, hh);
      ctx.closePath();
      break;
    case 'tri':
      ctx.beginPath();
      ctx.moveTo(-hw, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh);
      ctx.closePath();
      break;
    default:
      rrect(-hw, -hh, hw * 2, hh * 2, 4);
  }
}

function shapeTxtOff(hw: number, hh: number, shape?: string): [number, number] {
  if (shape === 'lshape') return [0, -hh * 0.6];
  if (shape === 'tri')    return [-hw * 0.25, hh * 0.3];
  return [0, 0];
}

export function rrect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function hCircle(x: number, y: number, r: number): void {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawHandles(sw: number, sh: number): void {
  ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 1; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(0, -sh / 2); ctx.lineTo(0, -sh / 2 - 16); ctx.stroke();
  hCircle(0, -sh / 2 - 22, 6);
  handles(sw, sh).forEach(h => hCircle(h.x, h.y, 5));
}

function drawItem(item: PlacedItem, sel: boolean): void {
  const s = getState();
  const sp = ts(item.x, item.y);
  const sw = item.w * s.scale, sh = item.h * s.scale;
  const icx = sp.x + sw / 2, icy = sp.y + sh / 2;
  const hw = sw / 2, hh = sh / 2;

  ctx.save();
  ctx.translate(icx, icy);
  ctx.rotate(item.rot * Math.PI / 180);
  ctx.shadowColor = 'transparent';
  if (item.floating) ctx.globalAlpha = 0.65;

  const ext = item.extensions;
  if (ext) {
    const si_px = (ext.sizeIncrease?.amount ?? 0) * s.scale;
    const hw_e = hw + si_px, hh_e = hh + si_px;

    if (si_px > 0) {
      ctx.fillStyle = ext.sizeIncrease!.color || '#d4c8b8';
      if (sel) { ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); }
      else     { ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 0.5; ctx.setLineDash([]); }
      rrect(-hw_e, -hh_e, hw_e * 2, hh_e * 2, 4);
      ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }

    (['top', 'right', 'bottom', 'left'] as const).forEach(side => {
      const se = ext[side]; if (!se?.size) return;
      const sp_px = se.size * s.scale;
      ctx.fillStyle = se.color || '#c8b8a8';
      if (sel) { ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); }
      else     { ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 0.5; ctx.setLineDash([]); }
      ctx.beginPath();
      if (side === 'top')    ctx.rect(-hw_e, -hh_e - sp_px, hw_e * 2, sp_px);
      else if (side === 'bottom') ctx.rect(-hw_e, hh_e, hw_e * 2, sp_px);
      else if (side === 'left')   ctx.rect(-hw_e - sp_px, -hh_e, sp_px, hh_e * 2);
      else                        ctx.rect(hw_e, -hh_e, sp_px, hh_e * 2);
      ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    });

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (si_px >= 10 && ext.sizeIncrease?.name) {
      const c = ext.sizeIncrease.color || '#d4c8b8';
      ctx.fillStyle = isDark(c) ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.5)';
      ctx.font = `500 ${Math.max(7, Math.min(10, si_px * 0.5))}px sans-serif`;
      ctx.fillText(ext.sizeIncrease.name, 0, hh + si_px / 2);
    }
    (['top', 'right', 'bottom', 'left'] as const).forEach(side => {
      const se = ext[side]; if (!se?.size || !se.name) return;
      const sp_px = se.size * s.scale; if (sp_px < 10) return;
      const c = se.color || '#c8b8a8';
      ctx.fillStyle = isDark(c) ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.5)';
      ctx.font = `500 ${Math.max(7, Math.min(10, sp_px * 0.5))}px sans-serif`;
      const { eT, eB, eL, eR } = extSizes(item);
      const hw_e2 = hw + eL * s.scale, hh_e2 = hh + eT * s.scale;
      if (side === 'top')         ctx.fillText(se.name, 0, -hh_e2 - sp_px / 2);
      else if (side === 'bottom') ctx.fillText(se.name, 0,  hh_e2 + sp_px / 2);
      else if (side === 'left') {
        ctx.save(); ctx.translate(-hw_e2 - sp_px / 2, 0); ctx.rotate(-Math.PI / 2);
        ctx.fillText(se.name, 0, 0); ctx.restore();
      } else {
        ctx.save(); ctx.translate(hw_e2 + sp_px / 2, 0); ctx.rotate(Math.PI / 2);
        ctx.fillText(se.name, 0, 0); ctx.restore();
      }
    });
  }

  ctx.fillStyle = item.color || '#cfc9c0';
  if (sel) {
    ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 2; ctx.setLineDash(item.floating ? [6, 4] : []);
  } else if (item.floating) {
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.setLineDash([]);
  }
  ctx.shadowColor = sel ? 'rgba(74,144,226,.18)' : 'rgba(0,0,0,.13)';
  ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
  itemPath(hw, hh, item.shape);
  ctx.fill(); ctx.stroke();

  ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1; ctx.setLineDash([]);
  ctx.fillStyle = isDark(item.color || '#cfc9c0') ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.55)';

  // Local-space centroid for each shape, transformed to screen-space for upright text
  const [tx, ty] = shapeTxtOff(hw, hh, item.shape);
  const rotRad = item.rot * Math.PI / 180;
  const cosR = Math.cos(rotRad), sinR = Math.sin(rotRad);
  const ax = tx * cosR - ty * sinR;
  const ay = tx * sinR + ty * cosR;

  // Max horizontal width for upright text guaranteed to fit inside the rotated shape
  const cosA = Math.abs(cosR), sinA = Math.abs(sinR);
  let availW: number;
  if (item.shape === 'round' || item.shape === 'oval') {
    // Exact ellipse chord at screen y=0
    availW = 2 / Math.sqrt(cosA * cosA / (hw * hw) + sinA * sinA / (hh * hh)) * 0.85;
  } else if (item.shape === 'lshape') {
    // Inscribed circle of the top-bar subregion (rotation-conservative)
    availW = Math.min(hw * 1.1, hh * 0.8) * 0.75;
  } else if (item.shape === 'tri') {
    availW = Math.min(hw, hh) * 0.85;
  } else {
    // Exact horizontal chord through center of rotated rectangle
    const halfW = sinA < 0.01 ? hw : cosA < 0.01 ? hh : Math.min(hh / sinA, hw / cosA);
    availW = halfW * 2 * 0.85;
  }

  let fs = Math.max(9, Math.min(13, availW / 3.5));
  ctx.font = `600 ${fs}px -apple-system,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (ctx.measureText(item.name).width > availW - 6) { fs = Math.max(8, fs - 2); ctx.font = `600 ${fs}px -apple-system,sans-serif`; }
  ctx.save();
  ctx.rotate(-rotRad);
  ctx.fillText(item.name, ax, ay);
  ctx.restore();

  if (sel) drawHandles(sw, sh);
  ctx.restore();
}

function drawRoomDims(room: Room): void {
  const rs = ts(room.x, room.y), re = ts(room.x + room.w, room.y + room.h);
  const s = getState();
  ctx.save();
  ctx.fillStyle = '#aaa'; ctx.font = '12px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // format inline to avoid importing fmtIn (which reads unit from store)
  const fmt = (n: number) => {
    if (s.unit === 'm') return (n * 0.0254).toFixed(2) + ' m';
    const ft = Math.floor(n / 12), i = Math.round((n % 12) * 4) / 4;
    if (ft === 0) return i + '"';
    if (i === 0)  return ft + "'";
    return ft + "' " + i + '"';
  };

  ctx.fillText(fmt(room.w), (rs.x + re.x) / 2, rs.y - 16);
  ctx.save();
  ctx.translate(rs.x - 20, (rs.y + re.y) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(fmt(room.h), 0, 0);
  ctx.restore();
  ctx.restore();
}
