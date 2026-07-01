<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../lib/store';
  import { render, initRenderer } from '../lib/renderer';
  import { ts, tr, snap, snapPt, d2 } from '../lib/utils';
  import { hitItem, hitHandles, hitWall, hitWallEndpoint, hitOpening, hitRoom, anyCollide, anyRoomCollide } from '../lib/physics';
  import { selItem, selWall, selOpening, selRoom, desel, commitWalls, setMode, fitRoom,
           delSelected, delSelWall, delSelOpening, duplicatePlaced, applyRot } from '../lib/actions';
  import type { PlacedItem } from '../lib/types';

  let canvas: HTMLCanvasElement;
  let wrapper: HTMLDivElement;
  let hint = '';

  let clipboard: PlacedItem | null = null;

  let panning = false;
  let panStart = { x: 0, y: 0 };
  let panOrig  = { x: 0, y: 0 };
  let t2Start: { d: number; scale: number; px: number; py: number; mx: number; my: number } | null = null;

  onMount(() => {
    initRenderer(canvas);

    let fitted = false;
    const ro = new ResizeObserver(() => {
      canvas.width  = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
      if (!fitted && canvas.width > 0 && canvas.height > 0) {
        fitted = true;
        fitRoom(canvas.width, canvas.height);
      }
      render();
    });
    ro.observe(wrapper);

    const unsub = appState.subscribe(() => render());

    return () => { ro.disconnect(); unsub(); };
  });

  function cpos(e: MouseEvent | Touch): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function tDist(e: TouchEvent): number {
    return d2(e.touches[0].clientX, e.touches[0].clientY,
               e.touches[1].clientX, e.touches[1].clientY);
  }

  // ── Keyboard ──────────────────────────────────────────────────
  function onKeydown(e: KeyboardEvent): void {
    const tag = (document.activeElement as HTMLElement)?.tagName;
    const s = $appState;

    if (e.key === 'Escape') { s.mode === 'wall' ? cancelWall() : desel(); return; }
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (s.selId !== null) delSelected();
      else if (s.selWallId !== null) delSelWall();
      else if (s.selOId !== null) delSelOpening();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      clipboard = s.selId !== null ? ({ ...s.placed.find(p => p.id === s.selId)! }) : null;
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      e.preventDefault();
      const item = s.selId !== null ? s.placed.find(p => p.id === s.selId) : null;
      if (item) { clipboard = { ...item }; delSelected(); }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      if (!clipboard) return;
      const src = clipboard;
      appState.update(st => {
        const nx = snap(src.x + 12), ny = snap(src.y + 12);
        const copy: PlacedItem = { ...src, id: st._nid, x: nx, y: ny, _lx: nx, _ly: ny };
        return { ...st, _nid: st._nid + 1, placed: [...st.placed, copy], selId: copy.id, selWallId: null, selOId: null };
      });
      clipboard = { ...clipboard, x: snap(clipboard.x + 12), y: snap(clipboard.y + 12) };
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (s.selId !== null) duplicatePlaced(s.selId);
      return;
    }

    if ((e.key === 'r' || e.key === 'R') && s.selId) {
      const item = s.placed.find(p => p.id === s.selId);
      if (item) applyRot((item.rot + 90) % 360);
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      fitRoom(canvas.width, canvas.height);
      return;
    }

    if (e.key === 'w' || e.key === 'W') {
      setMode(s.mode === 'wall' ? 'select' : 'wall');
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (s.selId === null) return;
      e.preventDefault();
      const step = e.shiftKey ? 1 : 6;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      appState.update(st => ({
        ...st, placed: st.placed.map(p => p.id !== s.selId ? p
          : { ...p, x: p.x + dx, y: p.y + dy, _lx: p.x + dx, _ly: p.y + dy }),
      }));
      return;
    }
  }

  function cancelWall(): void {
    appState.update(s => ({ ...s, wverts: [], mode: 'select' }));
    hint = '';
  }

  // ── Mouse down ─────────────────────────────────────────────────
  function onDown(e: MouseEvent): void {
    if (e.button === 2 || e.button === 1) {
      if ($appState.mode === 'wall') {
        commitWalls();
        setMode('select');
        hint = '';
        return;
      }
      panning = true;
      const p = cpos(e); panStart = { x: p.x, y: p.y };
      panOrig = { x: $appState.panX, y: $appState.panY };
      return;
    }
    if ($appState.mode === 'wall') return;
    const { x, y } = cpos(e);
    const s = $appState;

    if (s.selId !== null) {
      const item = s.placed.find(p => p.id === s.selId);
      if (item) {
        const h = hitHandles(item, x, y);
        if (h) {
          const rm = tr(x, y);
          const sp = ts(item.x, item.y);
          const sw = item.w * s.scale, sh = item.h * s.scale;
          appState.update(st => ({ ...st, drag: {
            type: h.type === 'rotate' ? 'rotate' : 'resize',
            id: item.id, h: h.type === 'resize' ? h.h : undefined,
            rm0: { ...rm },
            orig: { ...item, rot: item.rot },
            ang0: Math.atan2(y - (sp.y + sh / 2), x - (sp.x + sw / 2)),
            rot0: item.rot,
          }}));
          return;
        }
      }
    }

    for (let i = s.placed.length - 1; i >= 0; i--) {
      const item = s.placed[i];
      if (hitItem(item, x, y)) {
        selItem(item.id);
        const rm = tr(x, y);
        appState.update(st => ({
          ...st,
          placed: st.placed.map(p => p.id === item.id ? { ...p, _lx: p.x, _ly: p.y } : p),
          drag: { type: 'move', id: item.id, ox: rm.x - item.x, oy: rm.y - item.y },
        }));
        return;
      }
    }

    for (let i = s.openings.length - 1; i >= 0; i--) {
      const o = s.openings[i];
      if (hitOpening(o, x, y)) {
        selOpening(o.id);
        const wall = s.walls.find(w => w.id === o.wallId);
        appState.update(st => ({ ...st, drag: { type: 'opening', id: o.id, wall } }));
        return;
      }
    }

    // Endpoint drag on the currently selected unlocked wall
    if (s.selWallId !== null) {
      const sw = s.walls.find(w => w.id === s.selWallId);
      if (sw && !sw.locked) {
        const ep = hitWallEndpoint(sw, x, y);
        if (ep !== null) {
          appState.update(st => ({ ...st, drag: { type: 'wall-ep', id: sw.id, ep } }));
          return;
        }
      }
    }

    for (let i = s.walls.length - 1; i >= 0; i--) {
      const w = s.walls[i];
      if (hitWall(w, x, y)) {
        selWall(w.id);
        if (!w.locked) {
          const rmW = tr(x, y);
          appState.update(st => {
            const wall = st.walls.find(wl => wl.id === w.id)!;
            return { ...st, drag: { type: 'wall-move', id: w.id, ox: rmW.x - wall.x1, oy: rmW.y - wall.y1 } };
          });
        }
        return;
      }
    }

    for (let i = s.rooms.length - 1; i >= 0; i--) {
      const room = s.rooms[i];
      if (hitRoom(room, x, y)) {
        selRoom(room.id);
        const rm = tr(x, y);
        appState.update(st => ({ ...st, drag: { type: 'room', id: room.id, ox: rm.x - room.x, oy: rm.y - room.y } }));
        return;
      }
    }

    desel();
  }

  // ── Mouse move ──────────────────────────────────────────────────
  function onMove(e: MouseEvent): void {
    const { x, y } = cpos(e);

    if (panning) {
      appState.update(s => ({
        ...s, panX: panOrig.x + (x - panStart.x), panY: panOrig.y + (y - panStart.y),
      }));
      return;
    }

    const rm = tr(x, y);
    appState.update(s => ({ ...s, _mouseR: snapPt(rm.x, rm.y) }));

    const s = $appState;
    if (s.mode === 'wall') return;
    if (!s.drag) { updCursor(x, y); return; }

    const drag = s.drag;

    if (drag.type === 'move') {
      const item = s.placed.find(p => p.id === drag.id); if (!item) return;
      const nx = snap(rm.x - (drag.ox ?? 0)), ny = snap(rm.y - (drag.oy ?? 0));
      appState.update(st => {
        const placed = st.placed.map(p => {
          if (p.id !== drag.id) return p;
          const updated = { ...p, x: nx, y: ny };
          if (anyCollide(updated)) return { ...p };
          return { ...updated, _lx: nx, _ly: ny };
        });
        return { ...st, placed };
      });

    } else if (drag.type === 'rotate') {
      const item = s.placed.find(p => p.id === drag.id); if (!item) return;
      const sp = ts(item.x + item.w / 2, item.y + item.h / 2);
      const angle = Math.atan2(y - sp.y, x - sp.x) * 180 / Math.PI + 90;
      appState.update(st => ({
        ...st, placed: st.placed.map(p => p.id === drag.id
          ? { ...p, rot: ((angle % 360) + 360) % 360 } : p),
      }));

    } else if (drag.type === 'resize') {
      const item = s.placed.find(p => p.id === drag.id); if (!item) return;
      appState.update(st => ({ ...st, placed: st.placed.map(p =>
        p.id === drag.id ? doResize(p, drag, rm.x, rm.y) : p) }));

    } else if (drag.type === 'opening') {
      const wall = drag.wall; if (!wall) return;
      const dx = wall.x2 - wall.x1, dy = wall.y2 - wall.y1;
      const len2 = dx * dx + dy * dy; if (len2 === 0) return;
      const t = Math.max(0.05, Math.min(0.95, ((rm.x - wall.x1) * dx + (rm.y - wall.y1) * dy) / len2));
      appState.update(st => ({
        ...st, openings: st.openings.map(o => o.id === drag.id ? { ...o, t } : o),
      }));

    } else if (drag.type === 'wall-ep') {
      const snapped = snapPt(rm.x, rm.y);
      appState.update(st => ({
        ...st, walls: st.walls.map(w => {
          if (w.id !== drag.id || w.locked) return w;
          return drag.ep === 1
            ? { ...w, x1: snapped.x, y1: snapped.y }
            : { ...w, x2: snapped.x, y2: snapped.y };
        }),
      }));

    } else if (drag.type === 'wall-move') {
      const wm = s.walls.find(w => w.id === drag.id); if (!wm || wm.locked) return;
      const nx1 = snap(rm.x - (drag.ox ?? 0)), ny1 = snap(rm.y - (drag.oy ?? 0));
      const dx = nx1 - wm.x1, dy = ny1 - wm.y1;
      if (dx === 0 && dy === 0) return;
      appState.update(st => ({
        ...st, walls: st.walls.map(w => w.id !== drag.id ? w
          : { ...w, x1: w.x1 + dx, y1: w.y1 + dy, x2: w.x2 + dx, y2: w.y2 + dy }),
      }));

    } else if (drag.type === 'room') {
      const newX = snap(rm.x - (drag.ox ?? 0)), newY = snap(rm.y - (drag.oy ?? 0));
      appState.update(st => {
        const room = st.rooms.find(r => r.id === drag.id); if (!room) return st;
        const dx = newX - room.x, dy = newY - room.y;
        if (dx === 0 && dy === 0) return st;
        const updated = { ...room, x: newX, y: newY };
        if (anyRoomCollide(updated)) return st;
        return {
          ...st,
          rooms: st.rooms.map(r => r.id === drag.id ? updated : r),
          walls: st.walls.map(w => w.roomId === drag.id
            ? { ...w, x1: w.x1 + dx, y1: w.y1 + dy, x2: w.x2 + dx, y2: w.y2 + dy } : w),
          placed: st.placed.map(p => p.roomId === drag.id
            ? { ...p, x: p.x + dx, y: p.y + dy, _lx: p.x + dx, _ly: p.y + dy } : p),
        };
      });
    }
  }

  // ── Mouse up ────────────────────────────────────────────────────
  function onUp(): void {
    panning = false;
    const s = $appState;
    if (s.drag?.type === 'move') {
      appState.update(st => {
        const item = st.placed.find(p => p.id === st.drag?.id);
        if (!item) return { ...st, drag: null };
        if (anyCollide(item)) {
          return { ...st, drag: null,
            placed: st.placed.map(p => p.id === item.id ? { ...p, x: p._lx ?? p.x, y: p._ly ?? p.y } : p) };
        }
        const cx = item.x + item.w / 2, cy = item.y + item.h / 2;
        const newRoom = st.rooms.find(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
        const placed = newRoom && newRoom.id !== item.roomId
          ? st.placed.map(p => p.id === item.id ? { ...p, roomId: newRoom.id } : p)
          : st.placed;
        return { ...st, drag: null, placed,
          selRoomId: newRoom ? newRoom.id : st.selRoomId };
      });
    } else {
      appState.update(st => ({ ...st, drag: null }));
    }
  }

  // ── Double click (wall mode) ────────────────────────────────────
  function onDbl(e: MouseEvent): void {
    if ($appState.mode !== 'wall') return;
    const { x, y } = cpos(e);
    const rm = tr(x, y);
    appState.update(s => ({ ...s, wverts: [...s.wverts, snapPt(rm.x, rm.y)] }));
    commitWalls();
    setMode('select');
    hint = '';
  }

  // ── Click (wall vertex placement) ───────────────────────────────
  function onClick(e: MouseEvent): void {
    if ($appState.mode !== 'wall') return;
    const { x, y } = cpos(e);
    const rm = tr(x, y);
    appState.update(s => ({ ...s, wverts: [...s.wverts, snapPt(rm.x, rm.y)] }));
  }

  // ── Wheel / zoom ────────────────────────────────────────────────
  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const { x, y } = cpos(e);
    const f = e.deltaY < 0 ? 1.1 : 0.9;
    const rm = tr(x, y);
    appState.update(s => {
      const scale = Math.max(1.5, Math.min(25, s.scale * f));
      return { ...s, scale, panX: x - rm.x * scale, panY: y - rm.y * scale };
    });
  }

  // ── Touch ───────────────────────────────────────────────────────
  function onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 2) {
      const s = $appState;
      t2Start = { d: tDist(e), scale: s.scale, px: s.panX, py: s.panY,
        mx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        my: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
      return;
    }
    const t = e.touches[0];
    onDown({ clientX: t.clientX, clientY: t.clientY, button: 0 } as MouseEvent);
  }

  function onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 2 && t2Start) {
      const nd = tDist(e), factor = nd / t2Start.d;
      const ns = Math.max(1.5, Math.min(25, t2Start.scale * factor));
      const rect = canvas.getBoundingClientRect();
      const mx = t2Start.mx - rect.left, my = t2Start.my - rect.top;
      const rx = (mx - t2Start.px) / t2Start.scale;
      const ry = (my - t2Start.py) / t2Start.scale;
      appState.update(s => ({ ...s, scale: ns, panX: mx - rx * ns, panY: my - ry * ns }));
      return;
    }
    const t = e.touches[0];
    onMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent);
  }

  function onTouchEnd(e: TouchEvent): void {
    e.preventDefault(); t2Start = null; onUp();
  }

  // ── Cursor ──────────────────────────────────────────────────────
  function updCursor(x: number, y: number): void {
    const s = $appState;
    if (s.selId !== null) {
      const item = s.placed.find(p => p.id === s.selId);
      if (item) {
        const h = hitHandles(item, x, y);
        if (h) { canvas.style.cursor = h.type === 'rotate' ? 'crosshair' : ((h as any).h?.cur || 'crosshair'); return; }
        if (hitItem(item, x, y)) { canvas.style.cursor = 'move'; return; }
      }
    }
    for (let i = s.placed.length - 1; i >= 0; i--) {
      if (hitItem(s.placed[i], x, y)) { canvas.style.cursor = 'move'; return; }
    }
    if (s.selWallId !== null) {
      const sw = s.walls.find(w => w.id === s.selWallId);
      if (sw && !sw.locked) {
        if (hitWallEndpoint(sw, x, y) !== null) { canvas.style.cursor = 'crosshair'; return; }
        if (hitWall(sw, x, y)) { canvas.style.cursor = 'move'; return; }
      }
    }
    for (const w of s.walls) { if (hitWall(w, x, y)) { canvas.style.cursor = w.locked ? 'pointer' : 'move'; return; } }
    for (const room of s.rooms) { if (hitRoom(room, x, y)) { canvas.style.cursor = 'grab'; return; } }
    canvas.style.cursor = s.mode === 'wall' ? 'crosshair' : 'default';
  }

  // ── Resize helper ────────────────────────────────────────────────
  function doResize(item: any, drag: any, rmx: number, rmy: number): any {
    const h = drag.h, orig = drag.orig;
    if (!h || !orig) return item;
    const icx = orig.x + orig.w / 2, icy = orig.y + orig.h / 2;
    const rad = orig.rot * Math.PI / 180;
    const cos = Math.cos(-rad), sin = Math.sin(-rad);
    const lx = (rmx - icx) * cos - (rmy - icy) * sin;
    const ly = (rmx - icx) * sin + (rmy - icy) * cos;

    let nw = orig.w, nh = orig.h, ox = 0, oy = 0;
    if (h.dx !== 0) { const hw = h.dx > 0 ? lx : -lx; nw = snap(Math.max(6, hw * 2)); if (h.dx < 0) ox = orig.w - nw; }
    if (h.dy !== 0) { const hh = h.dy > 0 ? ly : -ly; nh = snap(Math.max(6, hh * 2)); if (h.dy < 0) oy = orig.h - nh; }

    const cos2 = Math.cos(rad), sin2 = Math.sin(rad);
    return { ...item, w: nw, h: nh,
      x: snap(orig.x + ox * cos2 - oy * sin2),
      y: snap(orig.y + ox * sin2 + oy * cos2) };
  }

  export function setHint(t: string): void { hint = t; }
</script>

<svelte:window on:keydown={onKeydown} />

<div bind:this={wrapper} class="canvas-wrapper">
  <canvas
    bind:this={canvas}
    on:mousedown={onDown}
    on:mousemove={onMove}
    on:mouseup={onUp}
    on:dblclick={onDbl}
    on:click={onClick}
    on:wheel={onWheel}
    on:contextmenu={e => e.preventDefault()}
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
  ></canvas>

  {#if hint}
    <div class="hint">{hint}</div>
  {/if}
</div>

<style>
  .canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #e8e8e8;
  }
  canvas {
    display: block;
    cursor: default;
    width: 100%;
    height: 100%;
  }
  .hint {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.62);
    color: #fff;
    font-size: 12px;
    padding: 6px 16px;
    border-radius: 20px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 30;
  }
</style>
