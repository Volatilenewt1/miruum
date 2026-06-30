import { appState, uid, ROOM_COLORS } from './store';
import { snap, snapPt, toIn } from './utils';
import type { AppState, ExtKey, Furnishing, ItemShape, OpeningType, PlacedItem } from './types';

// ── Rooms ─────────────────────────────────────────────────────────────────────

export function addRoom(): void {
  appState.update(s => {
    const maxX = s.rooms.reduce((m, r) => Math.max(m, r.x + r.w), 0);
    const color = ROOM_COLORS[s.rooms.length % ROOM_COLORS.length];
    const room = { id: s._nid, name: `Room ${s.rooms.length + 1}`, x: maxX + 24, y: 0, w: 144, h: 120, color };
    return { ...s, _nid: s._nid + 1, rooms: [...s.rooms, room],
      selRoomId: room.id, selId: null, selWallId: null, selOId: null, roomPanelVisible: true };
  });
}

export function selRoom(id: number): void {
  appState.update(s => ({ ...s, selRoomId: id, selId: null, selWallId: null, selOId: null, roomPanelVisible: true }));
}

export function delSelRoom(): void {
  appState.update(s => {
    if (!s.selRoomId || s.rooms.length <= 1) return s;
    const wallIds = new Set(s.walls.filter(w => w.roomId === s.selRoomId).map(w => w.id));
    const rooms    = s.rooms.filter(r => r.id !== s.selRoomId);
    const walls    = s.walls.filter(w => w.roomId !== s.selRoomId);
    const openings = s.openings.filter(o => !wallIds.has(o.wallId));
    const placed   = s.placed.filter(p => p.roomId !== s.selRoomId);
    return { ...s, rooms, walls, openings, placed, selRoomId: rooms[0].id,
      selId: null, selWallId: null, selOId: null };
  });
}

export function applyRoomName(name: string): void {
  appState.update(s => ({
    ...s, rooms: s.rooms.map(r => r.id === s.selRoomId ? { ...r, name: name || r.name } : r),
  }));
}

export function applyRoomColor(color: string): void {
  appState.update(s => ({
    ...s, rooms: s.rooms.map(r => r.id === s.selRoomId ? { ...r, color } : r),
  }));
}

export function applyRoomSize(wIn: number, hIn: number): void {
  appState.update(s => ({
    ...s, rooms: s.rooms.map(r => r.id === s.selRoomId ? { ...r, w: snap(wIn), h: snap(hIn) } : r),
  }));
}

// ── Walls ──────────────────────────────────────────────────────────────────────

export function setMode(mode: 'select' | 'wall'): void {
  appState.update(s => ({ ...s, mode, wverts: mode !== 'wall' ? [] : s.wverts }));
}

export function commitWalls(): void {
  appState.update(s => {
    const newWalls = [];
    for (let i = 0; i < s.wverts.length - 1; i++) {
      newWalls.push({ id: s._nid + i, roomId: s.selRoomId,
        x1: s.wverts[i].x, y1: s.wverts[i].y,
        x2: s.wverts[i + 1].x, y2: s.wverts[i + 1].y });
    }
    return { ...s, _nid: s._nid + newWalls.length,
      walls: [...s.walls, ...newWalls], wverts: [] };
  });
}

export function finishWall(): void { commitWalls(); setMode('select'); }
export function cancelWall(): void { appState.update(s => ({ ...s, wverts: [], mode: 'select' })); }

export function selWall(id: number): void {
  appState.update(s => {
    const wall = s.walls.find(w => w.id === id);
    return { ...s, selWallId: id, selId: null, selOId: null,
      selRoomId: wall?.roomId ?? s.selRoomId, roomPanelVisible: false };
  });
}

export function delSelWall(): void {
  appState.update(s => {
    if (!s.selWallId) return s;
    const wall = s.walls.find(w => w.id === s.selWallId);
    if (wall?.locked) return s;
    const openings = s.openings.filter(o => o.wallId !== s.selWallId);
    const walls    = s.walls.filter(w => w.id !== s.selWallId);
    return { ...s, walls, openings, selWallId: null };
  });
}

export function toggleWallLock(): void {
  appState.update(s => {
    if (!s.selWallId) return s;
    return { ...s, walls: s.walls.map(w => w.id === s.selWallId ? { ...w, locked: !w.locked } : w) };
  });
}

export function delWall(id: number): void {
  appState.update(s => ({
    ...s,
    walls:    s.walls.filter(w => w.id !== id),
    openings: s.openings.filter(o => o.wallId !== id),
    selWallId: s.selWallId === id ? null : s.selWallId,
  }));
}

export function wLen(w: { x1: number; y1: number; x2: number; y2: number }): number {
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Openings ───────────────────────────────────────────────────────────────────

export function addOpenings(type: OpeningType, count: number, widthIn: number): string | null {
  let msg: string | null = null;
  appState.update(s => {
    const roomWalls = s.walls.filter(w => w.roomId === s.selRoomId);
    if (!roomWalls.length) { msg = 'Draw walls first!'; return s; }
    const newOpenings = [];
    let nid = s._nid;
    if (s.selWallId !== null) {
      const wall = roomWalls.find(wl => wl.id === s.selWallId);
      if (wall) {
        for (let i = 0; i < count; i++) {
          const t = count === 1 ? 0.5 : 0.15 + (0.7 / Math.max(1, count - 1)) * i;
          const o: any = { id: nid++, type, wallId: wall.id, t, width: widthIn };
          if (type === 'door') o.swing = 0;
          newOpenings.push(o);
        }
      }
    } else {
      const usage = roomWalls.map(wall => s.openings.filter(o => o.wallId === wall.id).length);
      let start = usage.indexOf(Math.min(...usage));
      for (let i = 0; i < count; i++) {
        const wall = roomWalls[(start + i) % roomWalls.length];
        const t = count === 1 ? 0.5 : 0.15 + (0.7 / Math.max(1, count - 1)) * i;
        const o: any = { id: nid++, type, wallId: wall.id, t, width: widthIn };
        if (type === 'door') o.swing = 0;
        newOpenings.push(o);
      }
    }
    return { ...s, _nid: nid, openings: [...s.openings, ...newOpenings] };
  });
  return msg;
}

export function selOpening(id: number): void {
  appState.update(s => ({ ...s, selOId: id, selId: null, selWallId: null, roomPanelVisible: false }));
}

export function delSelOpening(): void {
  appState.update(s => ({
    ...s, openings: s.openings.filter(o => o.id !== s.selOId), selOId: null,
  }));
}

export function delOpening(id: number): void {
  appState.update(s => ({
    ...s, openings: s.openings.filter(o => o.id !== id),
    selOId: s.selOId === id ? null : s.selOId,
  }));
}

export function applyOpeningWidth(widthIn: number): void {
  appState.update(s => ({
    ...s, openings: s.openings.map(o => o.id === s.selOId ? { ...o, width: widthIn } : o),
  }));
}

export function cycleDoorSwing(): void {
  appState.update(s => ({
    ...s, openings: s.openings.map(o =>
      o.id === s.selOId && o.type === 'door' ? { ...o, swing: ((o.swing ?? 0) + 1) % 4 } : o),
  }));
}

// ── Items ──────────────────────────────────────────────────────────────────────

const ITEM_COLORS = [
  '#c8d8e8','#d4c8e8','#c8e8d4','#e8d8c8','#e8c8d4',
  '#c8e8e8','#e8e4c8','#d8c8b8','#b8ccd8','#c8b8d8','#d8e8c8','#e8ccc8',
];

function pickItemColor(placed: { color: string }[]): string {
  const used = new Set(placed.map(p => p.color));
  const avail = ITEM_COLORS.filter(c => !used.has(c));
  const pool = avail.length > 0 ? avail : ITEM_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function addFurnishing(name: string, wIn: number, hIn: number, _color: string): void {
  appState.update(s => {
    const room = s.rooms.find(r => r.id === s.selRoomId) || s.rooms[0];
    const w = snap(Math.max(6, wIn)), h = snap(Math.max(6, hIn));
    const itemName = name || 'Item';
    const color = pickItemColor(s.placed);
    const x = snap(room.x + (room.w - w) / 2);
    const y = snap(room.y + (room.h - h) / 2);
    const furnId = s._nid;
    const placedId = s._nid + 1;
    const furn: Furnishing = { id: furnId, name: itemName, w, h, color };
    const p: PlacedItem = { id: placedId, roomId: room.id, furnId,
      name: itemName, w, h, color, x, y, rot: 0, floating: false, _lx: x, _ly: y };
    return { ...s, _nid: s._nid + 2,
      furnishings: [...s.furnishings, furn],
      placed: [...s.placed, p],
      selId: p.id, selWallId: null, selOId: null };
  });
}

export function placeCustomFurnishing(furn: Furnishing): void {
  appState.update(s => {
    const room = s.rooms.find(r => r.id === s.selRoomId) || s.rooms[0];
    const { w, h, name, id: furnId } = furn;
    const twin = s.placed.find(p => p.furnId === furnId && p.roomId === room.id);
    const color = twin ? twin.color : pickItemColor(s.placed);
    const x = snap(room.x + (room.w - w) / 2);
    const y = snap(room.y + (room.h - h) / 2);
    const p: PlacedItem = { id: s._nid, roomId: room.id, furnId,
      name, w, h, color, x, y, rot: 0, floating: false, _lx: x, _ly: y };
    return { ...s, _nid: s._nid + 1, placed: [...s.placed, p],
      selId: p.id, selWallId: null, selOId: null };
  });
}

export function placePreset(name: string, w: number, h: number, shape?: ItemShape): void {
  appState.update(s => {
    const room = s.rooms.find(r => r.id === s.selRoomId) || s.rooms[0];
    const twin = s.placed.find(p => p.name === name && p.roomId === room.id);
    const color = twin ? twin.color : pickItemColor(s.placed);
    const x = snap(room.x + (room.w - w) / 2);
    const y = snap(room.y + (room.h - h) / 2);
    const p: PlacedItem = { id: s._nid, roomId: room.id, furnId: 0,
      name, w, h, color, shape: shape || 'rect', x, y, rot: 0, floating: false, _lx: x, _ly: y };
    return { ...s, _nid: s._nid + 1, placed: [...s.placed, p],
      selId: p.id, selWallId: null, selOId: null };
  });
}

export function selItem(id: number): void {
  appState.update(s => {
    const item = s.placed.find(p => p.id === id);
    return { ...s, selId: id, selWallId: null, selOId: null,
      selRoomId: item?.roomId ?? s.selRoomId, roomPanelVisible: false };
  });
}

export function desel(): void {
  appState.update(s => ({ ...s, selId: null, selWallId: null, selOId: null, roomPanelVisible: false }));
}

export function delSelected(): void {
  appState.update(s => ({
    ...s, placed: s.placed.filter(p => p.id !== s.selId), selId: null,
  }));
}

export function delPlaced(id: number): void {
  appState.update(s => ({
    ...s, placed: s.placed.filter(p => p.id !== id),
    selId: s.selId === id ? null : s.selId,
  }));
}

export function duplicatePlaced(id: number): void {
  appState.update(s => {
    const orig = s.placed.find(p => p.id === id); if (!orig) return s;
    const offset = 12;
    const copy: PlacedItem = { ...orig, id: s._nid, x: snap(orig.x + offset), y: snap(orig.y + offset), _lx: snap(orig.x + offset), _ly: snap(orig.y + offset) };
    return { ...s, _nid: s._nid + 1, placed: [...s.placed, copy], selId: copy.id };
  });
}

export function applyItemName(name: string): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => p.id === s.selId ? { ...p, name: name || p.name } : p),
  }));
}

export function applyItemSize(wIn: number, hIn: number): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => p.id === s.selId
      ? { ...p, w: snap(Math.max(6, wIn)), h: snap(Math.max(6, hIn)) } : p),
  }));
}

export function applyItemColor(color: string): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => p.id === s.selId ? { ...p, color } : p),
  }));
}

export function applyRot(rot: number): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => p.id === s.selId
      ? { ...p, rot: ((rot % 360) + 360) % 360 } : p),
  }));
}

export function applyFlo(floating: boolean): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => p.id === s.selId ? { ...p, floating } : p),
  }));
}

// ── Extensions ────────────────────────────────────────────────────────────────

export function applyExtension(key: ExtKey, data: { name: string; color: string; amount?: number; size?: number }): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => {
      if (p.id !== s.selId) return p;
      const ext = { ...(p.extensions || {}) };
      if (key === 'sizeIncrease') {
        ext.sizeIncrease = { name: data.name, color: data.color, amount: data.amount ?? 0 };
      } else {
        (ext as any)[key] = { name: data.name, color: data.color, size: data.size ?? 0 };
      }
      return { ...p, extensions: ext };
    }),
  }));
}

export function removeExtension(key: ExtKey): void {
  appState.update(s => ({
    ...s, placed: s.placed.map(p => {
      if (p.id !== s.selId) return p;
      const ext = { ...(p.extensions || {}) };
      (ext as any)[key] = null;
      return { ...p, extensions: ext };
    }),
  }));
}

// ── Units ─────────────────────────────────────────────────────────────────────

export function setUnit(u: 'ft' | 'm'): void {
  appState.update(s => ({ ...s, unit: u }));
}

// ── JSON load ─────────────────────────────────────────────────────────────────

export function loadState(d: any): void {
  appState.update(s => {
    let rooms = d.rooms;
    let selRoomId = d.selRoomId;
    if (!rooms) {
      const room = d.room || { w: 144, h: 120 };
      rooms = [{ id: 1, name: 'Room 1', x: 0, y: 0, w: room.w, h: room.h, color: ROOM_COLORS[0] }];
      selRoomId = 1;
      (d.walls  || []).forEach((w: any) => w.roomId = 1);
      (d.placed || []).forEach((p: any) => p.roomId = 1);
    }
    return { ...s,
      unit:        d.unit        || 'ft',
      rooms,
      selRoomId:   selRoomId     || rooms[0]?.id || 1,
      walls:       d.walls       || [],
      furnishings: d.furnishings || [],
      placed:      d.placed      || [],
      openings:    d.openings    || [],
      _nid:        d.nid         || 1,
      scale:       d.scale       || 5.5,
      panX:        d.panX        || 60,
      panY:        d.panY        || 60,
      selId: null, selWallId: null, selOId: null, roomPanelVisible: false,
    };
  });
}

// ── Fit to view ───────────────────────────────────────────────────────────────

export function fitRoom(canvasW: number, canvasH: number): void {
  appState.update(s => {
    if (!s.rooms.length) return s;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    s.rooms.forEach(r => {
      minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
    });
    const tw = maxX - minX, th = maxY - minY;
    const cw2 = canvasW - 120, ch2 = canvasH - 120;
    const scale = Math.min(25, Math.max(1.5, Math.min(cw2 / tw, ch2 / th)));
    const panX = (canvasW - tw * scale) / 2 - minX * scale;
    const panY = (canvasH - th * scale) / 2 - minY * scale;
    return { ...s, scale, panX, panY };
  });
}
