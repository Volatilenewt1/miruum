import { getState } from './store';
import { ts, extSizes, d2, dToSeg } from './utils';
import type { PlacedItem, Wall, Opening, Room, DragHandle } from './types';

export function hitItem(item: PlacedItem, sx: number, sy: number): boolean {
  const s = getState();
  const sp = ts(item.x, item.y);
  const sw = item.w * s.scale, sh = item.h * s.scale;
  const icx = sp.x + sw / 2, icy = sp.y + sh / 2;
  const rad = -item.rot * Math.PI / 180;
  const lx = (sx - icx) * Math.cos(rad) - (sy - icy) * Math.sin(rad);
  const ly = (sx - icx) * Math.sin(rad) + (sy - icy) * Math.cos(rad);
  const hw = sw / 2, hh = sh / 2;

  if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) return true;

  const ext = item.extensions;
  if (!ext) return false;

  const si_px = (ext.sizeIncrease?.amount ?? 0) * s.scale;
  const hw_e = hw + si_px, hh_e = hh + si_px;

  if (si_px > 0 && Math.abs(lx) <= hw_e && Math.abs(ly) <= hh_e) return true;
  if (ext.top?.size) {
    const te = ext.top.size * s.scale;
    if (lx >= -hw_e && lx <= hw_e && ly >= -hh_e - te && ly <= -hh_e) return true;
  }
  if (ext.bottom?.size) {
    const be = ext.bottom.size * s.scale;
    if (lx >= -hw_e && lx <= hw_e && ly >= hh_e && ly <= hh_e + be) return true;
  }
  if (ext.left?.size) {
    const le = ext.left.size * s.scale;
    if (lx >= -hw_e - le && lx <= -hw_e && ly >= -hh_e && ly <= hh_e) return true;
  }
  if (ext.right?.size) {
    const re = ext.right.size * s.scale;
    if (lx >= hw_e && lx <= hw_e + re && ly >= -hh_e && ly <= hh_e) return true;
  }
  return false;
}

export function handles(sw: number, sh: number): DragHandle[] {
  const hw = sw / 2, hh = sh / 2;
  return [
    { x: -hw, y: -hh, cur: 'nw-resize', dx: -1, dy: -1 },
    { x:  hw, y: -hh, cur: 'ne-resize', dx:  1, dy: -1 },
    { x: -hw, y:  hh, cur: 'sw-resize', dx: -1, dy:  1 },
    { x:  hw, y:  hh, cur: 'se-resize', dx:  1, dy:  1 },
    { x:   0, y: -hh, cur: 'n-resize',  dx:  0, dy: -1 },
    { x:   0, y:  hh, cur: 's-resize',  dx:  0, dy:  1 },
    { x: -hw, y:   0, cur: 'w-resize',  dx: -1, dy:  0 },
    { x:  hw, y:   0, cur: 'e-resize',  dx:  1, dy:  0 },
  ];
}

export function hitHandles(item: PlacedItem, sx: number, sy: number): { type: 'rotate' } | { type: 'resize'; h: DragHandle } | null {
  const s = getState();
  const sp = ts(item.x, item.y);
  const sw = item.w * s.scale, sh = item.h * s.scale;
  const icx = sp.x + sw / 2, icy = sp.y + sh / 2;
  const rad = item.rot * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  function toScreen(lx: number, ly: number) {
    return { x: icx + lx * cos - ly * sin, y: icy + lx * sin + ly * cos };
  }

  const rh = toScreen(0, -sh / 2 - 22);
  if (d2(sx, sy, rh.x, rh.y) <= 9) return { type: 'rotate' };

  for (const h of handles(sw, sh)) {
    const hs = toScreen(h.x, h.y);
    if (d2(sx, sy, hs.x, hs.y) <= 8) return { type: 'resize', h };
  }
  return null;
}

export function hitWall(w: Wall, sx: number, sy: number): boolean {
  const a = ts(w.x1, w.y1), b = ts(w.x2, w.y2);
  return dToSeg(sx, sy, a.x, a.y, b.x, b.y) < 8;
}

export function hitWallEndpoint(w: Wall, sx: number, sy: number): 1 | 2 | null {
  const a = ts(w.x1, w.y1), b = ts(w.x2, w.y2);
  if (d2(sx, sy, a.x, a.y) <= 9) return 1;
  if (d2(sx, sy, b.x, b.y) <= 9) return 2;
  return null;
}

export function hitOpening(o: Opening, sx: number, sy: number): boolean {
  const s = getState();
  const wall = s.walls.find(w => w.id === o.wallId);
  if (!wall) return false;
  const { ocx, ocy } = oGeom(wall, o);
  const sp = ts(ocx, ocy);
  return d2(sx, sy, sp.x, sp.y) < (o.width / 2) * s.scale + 8;
}

export function hitRoom(room: Room, sx: number, sy: number): boolean {
  const rs = ts(room.x, room.y), re = ts(room.x + room.w, room.y + room.h);
  return sx >= rs.x && sx <= re.x && sy >= rs.y && sy <= re.y;
}

export function oGeom(wall: Wall, o: Opening): { ocx: number; ocy: number; ang: number } {
  const dx = wall.x2 - wall.x1, dy = wall.y2 - wall.y1;
  return { ocx: wall.x1 + dx * o.t, ocy: wall.y1 + dy * o.t, ang: Math.atan2(dy, dx) };
}

export function bounds(item: PlacedItem) {
  const { eT, eB, eL, eR } = extSizes(item);
  const icx = item.x + item.w / 2, icy = item.y + item.h / 2;
  const rad = item.rot * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const lx1 = -(item.w / 2 + eL), lx2 = item.w / 2 + eR;
  const ly1 = -(item.h / 2 + eT), ly2 = item.h / 2 + eB;
  const corners = [[lx1, ly1], [lx2, ly1], [lx2, ly2], [lx1, ly2]].map(([lx, ly]) => ({
    x: icx + lx * cos - ly * sin, y: icy + lx * sin + ly * cos,
  }));
  return {
    minX: Math.min(...corners.map(c => c.x)), maxX: Math.max(...corners.map(c => c.x)),
    minY: Math.min(...corners.map(c => c.y)), maxY: Math.max(...corners.map(c => c.y)),
  };
}

export function collide(a: PlacedItem, b: PlacedItem): boolean {
  if (a.floating || b.floating || a.id === b.id || a.roomId !== b.roomId) return false;
  const ab = bounds(a), bb = bounds(b);
  return !(ab.maxX <= bb.minX || ab.minX >= bb.maxX || ab.maxY <= bb.minY || ab.minY >= bb.maxY);
}

export function anyCollide(item: PlacedItem): boolean {
  if (item.floating) return false;
  return getState().placed.some(o => o.id !== item.id && collide(item, o));
}

export function roomsOverlap(a: Room, b: Room): boolean {
  if (a.id === b.id) return false;
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

export function anyRoomCollide(room: Room): boolean {
  return getState().rooms.some(r => roomsOverlap(room, r));
}
