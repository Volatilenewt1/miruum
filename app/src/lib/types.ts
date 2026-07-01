export type Unit = 'ft' | 'm';
export type Mode = 'select' | 'wall';
export type ItemShape = 'rect' | 'round' | 'oval' | 'lshape' | 'tri';
export type OpeningType = 'door' | 'win';
export type ExtKey = 'sizeIncrease' | 'top' | 'right' | 'bottom' | 'left';

export interface Room {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface Wall {
  id: number;
  roomId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  locked?: boolean;
}

export interface ExtensionSide {
  name: string;
  color: string;
  size: number;
}

export interface ExtensionSizeIncrease {
  name: string;
  color: string;
  amount: number;
}

export interface Extensions {
  sizeIncrease?: ExtensionSizeIncrease | null;
  top?: ExtensionSide | null;
  right?: ExtensionSide | null;
  bottom?: ExtensionSide | null;
  left?: ExtensionSide | null;
}

export interface PlacedItem {
  id: number;
  roomId: number;
  furnId: number;
  name: string;
  w: number;
  h: number;
  color: string;
  shape?: ItemShape;
  x: number;
  y: number;
  rot: number;
  floating: boolean;
  extensions?: Extensions;
  _lx?: number;
  _ly?: number;
}

export interface Opening {
  id: number;
  type: OpeningType;
  wallId: number;
  t: number;
  width: number;
  swing?: number;
}

export interface Furnishing {
  id: number;
  name: string;
  w: number;
  h: number;
  color: string;
}

export interface DragHandle {
  x: number;
  y: number;
  cur: string;
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
}

export interface DragState {
  type: 'move' | 'rotate' | 'resize' | 'opening' | 'room' | 'wall-move' | 'wall-ep';
  id: number;
  h?: DragHandle;
  ox?: number;
  oy?: number;
  ep?: 1 | 2;
  rm0?: { x: number; y: number };
  orig?: PlacedItem;
  ang0?: number;
  rot0?: number;
  wall?: Wall;
}

export interface AppState {
  unit: Unit;
  rooms: Room[];
  selRoomId: number;
  roomPanelVisible: boolean;
  walls: Wall[];
  furnishings: Furnishing[];
  placed: PlacedItem[];
  openings: Opening[];
  mode: Mode;
  wverts: { x: number; y: number }[];
  selId: number | null;
  selWallId: number | null;
  selOId: number | null;
  scale: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  drag: DragState | null;
  _mouseR: { x: number; y: number } | null;
  _wallDragIdx: number | null;
  _nid: number;
}

export interface PresetItem {
  name: string;
  w: number;
  h: number;
  shape?: ItemShape;
}

export interface PresetCat {
  cat: string;
  items: PresetItem[];
}

export interface PresetGroup {
  room: string;
  cats: PresetCat[];
}
