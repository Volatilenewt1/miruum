import { writable, get } from 'svelte/store';
import type { AppState } from './types';
import { makeRoomWallsAndOpenings } from './utils';

export const ROOM_COLORS = ['#f0f0f5', '#f0f5f0', '#f5f0f0', '#f5f5e8', '#f0f5f5', '#f5f0f5'];

const savedFurnishings = (() => {
  try { return JSON.parse(localStorage.getItem('customFurnishings') || '[]'); } catch { return []; }
})();

const initialRoom = { id: 1, name: 'Room 1', x: 0, y: 0, w: 144, h: 120, color: ROOM_COLORS[0] };
const { walls: initialWalls, openings: initialOpenings, nextNid: initialNid } = makeRoomWallsAndOpenings(initialRoom, 2);

const initialState: AppState = {
  unit: 'ft',
  rooms: [initialRoom],
  selRoomId: 1,
  roomPanelVisible: false,
  walls: initialWalls,
  furnishings: savedFurnishings,
  placed: [],
  openings: initialOpenings,
  mode: 'select',
  wverts: [],
  selId: null,
  selWallId: null,
  selOId: null,
  scale: 5.5,
  panX: 60,
  panY: 60,
  showGrid: true,
  drag: null,
  _mouseR: null,
  _wallDragIdx: null,
  _nid: initialNid,
};

export const appState = writable<AppState>(initialState);

appState.subscribe(s => {
  try { localStorage.setItem('customFurnishings', JSON.stringify(s.furnishings)); } catch {}
});

export function uid(): number {
  let id = 0;
  appState.update(s => { id = s._nid; return { ...s, _nid: s._nid + 1 }; });
  return id;
}

export function getState(): AppState {
  return get(appState);
}
