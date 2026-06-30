<script lang="ts">
  import { appState } from '../lib/store';
  import { setUnit, addRoom, selRoom, selItem, delPlaced, duplicatePlaced,
           selWall, selOpening,
           addFurnishing, wLen } from '../lib/actions';
  import { fmtIn, toIn, snap } from '../lib/utils';
  import LibraryPanel from './LibraryPanel.svelte';

  $: s = $appState;
  $: isFt = s.unit === 'ft';

  let collapsed: Record<string, boolean> = { flist: true, 'flist-walls': true, 'flist-openings': true };
  function toggle(key: string) { collapsed[key] = !collapsed[key]; collapsed = collapsed; }

  let fname = '', fwFt = 3, fwIn = 0, fhFt = 1, fhIn = 6;
  let fwM = '0.9', fhM = '0.45', fcolor = '#cfc9c0';

  function onAddFurnishing() {
    let w: number, h: number;
    if (isFt) {
      w = snap(Math.max(6, fwFt * 12 + fwIn));
      h = snap(Math.max(6, fhFt * 12 + fhIn));
    } else {
      w = snap(toIn(parseFloat(fwM) || 0.9));
      h = snap(toIn(parseFloat(fhM) || 0.45));
    }
    addFurnishing(fname || 'Item', w, h, fcolor);
    fname = '';
  }
</script>

<aside class="sidebar">

  <!-- Units -->
  <div class="sec units-sec">
    <div class="utog">
      <button class:act={isFt} on:click={() => setUnit('ft')}>ft / in</button>
      <button class:act={!isFt} on:click={() => setUnit('m')}>meters</button>
    </div>
  </div>

  <!-- Rooms -->
  <div class="sec">
    <div class="sec-head" on:click={() => toggle('rooms')}>
      <h3>Rooms <span class="arr" class:open={!collapsed['rooms']}>▾</span></h3>
      <button class="sm" on:click|stopPropagation={addRoom}>+ Add</button>
    </div>
    {#if !collapsed['rooms']}
      <div class="sec-body">
        {#if s.rooms.length === 0}
          <div class="empty">No rooms</div>
        {:else}
          {#each s.rooms as room}
            <div class="list-item" class:sel={room.id === s.selRoomId} on:click={() => selRoom(room.id)}>
              <div class="room-swatch" style="background:{room.color}"></div>
              <span class="li-name">{room.name}</span>
              <span class="li-dims">{fmtIn(room.w)} × {fmtIn(room.h)}</span>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <!-- Room Furnishings with Walls and Windows & Doors nested inside -->
  <div class="sec">
    <div class="sec-head" on:click={() => toggle('flist')}>
      <h3>
        {(s.rooms.find(r => r.id === s.selRoomId)?.name ?? 'Room')} Furnishings
        <span class="arr" class:open={!collapsed['flist']}>▾</span>
      </h3>
    </div>
    {#if !collapsed['flist']}
      {@const items = s.placed.filter(p => p.roomId === s.selRoomId)}
      {@const roomWalls = s.walls.filter(w => w.roomId === s.selRoomId)}
      {@const roomWallIds = new Set(roomWalls.map(w => w.id))}
      {@const roomOpenings = s.openings.filter(o => roomWallIds.has(o.wallId))}
      <div class="sec-body">

        <!-- Placed furnishings flat list -->
        {#if items.length === 0}
          <div class="empty">None placed yet</div>
        {:else}
          {#each items as p}
            <div class="list-item" class:sel={p.id === s.selId} on:click={() => selItem(p.id)}>
              <div class="fswatch" style="background:{p.color}"></div>
              <span class="li-name">{p.name}</span>
              <span class="li-dims">{fmtIn(p.w)} × {fmtIn(p.h)}</span>
              <button class="dup sm icon" title="Duplicate" on:click|stopPropagation={() => duplicatePlaced(p.id)}>+</button>
              <button class="del sm icon" title="Delete" on:click|stopPropagation={() => delPlaced(p.id)}>✕</button>
            </div>
          {/each}
        {/if}

        <!-- Walls sub-dropdown -->
        <div class="sub-sec">
          <div class="sub-head" on:click={() => toggle('flist-walls')}>
            <span>Walls <span class="sub-count">({roomWalls.length})</span></span>
            <span class="arr" class:open={!collapsed['flist-walls']}>▾</span>
          </div>
          {#if !collapsed['flist-walls']}
            <div class="sub-body">
              {#if roomWalls.length === 0}
                <div class="empty">No walls yet</div>
              {:else}
                {#each roomWalls as w, i}
                  <div class="list-item" class:sel={w.id === s.selWallId} on:click={() => selWall(w.id)}>
                    <span class="li-name">Wall {i + 1}</span>
                    <span class="li-dims">{fmtIn(Math.round(wLen(w)))}</span>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>

        <!-- Windows & Doors sub-dropdown -->
        <div class="sub-sec">
          <div class="sub-head" on:click={() => toggle('flist-openings')}>
            <span>Windows &amp; Doors <span class="sub-count">({roomOpenings.length})</span></span>
            <span class="arr" class:open={!collapsed['flist-openings']}>▾</span>
          </div>
          {#if !collapsed['flist-openings']}
            <div class="sub-body">
              {#if roomOpenings.length === 0}
                <div class="empty">None added — select a wall</div>
              {:else}
                {#each roomOpenings as o}
                  {@const wallIdx = s.walls.findIndex(w => w.id === o.wallId)}
                  <div class="list-item" class:sel={o.id === s.selOId} on:click={() => selOpening(o.id)}>
                    <span class="obadge" class:door={o.type === 'door'} class:win={o.type === 'win'}>{o.type === 'door' ? 'D' : 'W'}</span>
                    <span class="li-name">{o.type === 'door' ? 'Door' : 'Window'}</span>
                    <span class="li-dims">Wall {wallIdx + 1} · {fmtIn(o.width)}</span>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>

      </div>
    {/if}
  </div>

  <!-- Furnishings library -->
  <div class="sec lib-sec">
    <div class="sec-head" on:click={() => toggle('lib')}>
      <h3>Furnishings <span class="arr" class:open={!collapsed['lib']}>▾</span></h3>
    </div>
    {#if !collapsed['lib']}
      <div class="sec-body">
        <div class="new-furn-box">
          <label>Name</label>
          <input type="text" bind:value={fname} placeholder="e.g. Sofa">
          <div class="r2">
            {#if isFt}
              <div>
                <label>Width</label>
                <div class="ftin-group">
                  <input type="number" bind:value={fwFt} min="0" step="1">
                  <span class="ftin-lbl">ft</span>
                  <input type="number" bind:value={fwIn} min="0" max="11" step="1">
                  <span class="ftin-lbl">in</span>
                </div>
              </div>
              <div>
                <label>Depth</label>
                <div class="ftin-group">
                  <input type="number" bind:value={fhFt} min="0" step="1">
                  <span class="ftin-lbl">ft</span>
                  <input type="number" bind:value={fhIn} min="0" max="11" step="1">
                  <span class="ftin-lbl">in</span>
                </div>
              </div>
            {:else}
              <div><label>Width (m)</label><input type="number" bind:value={fwM} step="0.25" min="0.1"></div>
              <div><label>Depth (m)</label><input type="number" bind:value={fhM} step="0.25" min="0.1"></div>
            {/if}
          </div>
          <label style="margin-top:8px">Color</label>
          <input type="color" bind:value={fcolor}>
          <button class="pri" style="width:100%;margin-top:10px" on:click={onAddFurnishing}>Create Furnishing</button>
        </div>
        <div class="lib-divider"></div>
        <LibraryPanel />
      </div>
    {/if}
  </div>

</aside>

<style>
  .sidebar {
    width: 272px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,.13), 0 1px 4px rgba(0,0,0,.08);
    display: flex; flex-direction: column;
    overflow-y: auto; overflow-x: hidden; z-index: 10;
    position: fixed;
    top: 16px; left: 16px;
    max-height: calc(100vh - 32px);
  }
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
  .sec { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; }
  .sec.lib-sec { flex: 1; min-height: 60px; }
  h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #aaa; }
  .sec-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; padding-bottom: 10px; }
  .sec-head:hover h3 { color: #888; }
  .sec-body { padding-top: 2px; }
  .arr { font-size: 9px; color: #bbb; display: inline-block; transform: rotate(-90deg); transition: transform .15s; margin-left: 4px; }
  .arr.open { transform: rotate(0deg); }
  label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; margin-top: 8px; }
  label:first-of-type { margin-top: 0; }
  input[type=text], input[type=number] { width: 100%; padding: 6px 9px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px; background: #fafafa; color: #222; outline: none; }
  input[type=color] { padding: 2px 3px; height: 32px; cursor: pointer; width: 100%; border-radius: 6px; border: 1px solid #e0e0e0; }
  .r2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ftin-group { display: flex; align-items: center; gap: 4px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; padding: 2px 6px; height: 32px; }
  .ftin-group input { flex: 1; min-width: 26px; border: none; background: transparent; padding: 2px; text-align: center; outline: none; font-size: 13px; }
  .ftin-lbl { font-size: 11px; color: #999; flex-shrink: 0; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 11px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #333; white-space: nowrap; }
  button:hover { background: #f4f4f4; }
  button.pri { background: #222; color: #fff; border-color: #222; }
  button.pri:hover { background: #3a3a3a; }
  button.del { color: #b44; border-color: #e0c0c0; }
  button.del:hover { background: #fdf0f0; }
  button.dup { color: #2a7a2a; border-color: #c0dcc0; }
  button.dup:hover { background: #f0faf0; }
  button.sm { font-size: 11px; padding: 4px 8px; }
  button.icon { font-size: 10px; padding: 2px 5px; }
  .units-sec { padding-top: 10px; padding-bottom: 10px; }
  .utog { display: flex; background: #f0f0f0; border-radius: 6px; padding: 2px; }
  .utog button { flex: 1; padding: 5px; font-size: 12px; border: none; background: transparent; border-radius: 4px; color: #666; font-weight: 500; }
  .utog button.act { background: #fff; color: #222; box-shadow: 0 1px 3px rgba(0,0,0,.1); border: none; }
  .list-item { display: flex; align-items: center; gap: 7px; padding: 6px 4px; border-radius: 5px; cursor: pointer; font-size: 12px; }
  .list-item:hover { background: #f4f4f4; }
  .list-item.sel { background: #e8f0fe; }
  .li-name { flex: 1; color: #333; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .li-dims { font-size: 11px; color: #aaa; white-space: nowrap; flex-shrink: 0; }
  .room-swatch { width: 11px; height: 11px; border-radius: 2px; border: 1px solid rgba(0,0,0,.12); flex-shrink: 0; }
  .fswatch { width: 14px; height: 14px; border-radius: 3px; border: 1px solid rgba(0,0,0,.1); flex-shrink: 0; }
  .obadge { font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 3px; text-transform: uppercase; letter-spacing: .06em; flex-shrink: 0; }
  .obadge.door { background: #fde8d0; color: #c05a0e; }
  .obadge.win  { background: #d0e8fd; color: #0e6bc0; }
  .empty { font-size: 12px; color: #bbb; padding: 4px 0; }
  .lib-divider { border-top: 1px solid #f0f0f0; margin: 12px 0 8px; }
  .new-furn-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px 12px; background: #fafafa; }
  .sub-sec { margin-top: 8px; border-top: 1px solid #f4f4f4; padding-top: 4px; }
  .sub-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; padding: 4px 4px; border-radius: 4px; }
  .sub-head:hover { background: #f9f9f9; }
  .sub-head > span:first-child { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #bbb; }
  .sub-count { font-weight: 400; color: #ccc; }
  .sub-body { padding-left: 4px; padding-top: 2px; }
</style>
