<script lang="ts">
  import { appState } from '../lib/store';
  import { applyRoomName, applyRoomColor, applyRoomSize, delSelRoom } from '../lib/actions';
  import { toIn, snap } from '../lib/utils';

  $: room = $appState.rooms.find(r => r.id === $appState.selRoomId);
  $: unit = $appState.unit;
  $: isFt = unit === 'ft';

  $: wFt = room ? Math.floor(room.w / 12) : 12;
  $: wIn = room ? Math.round(room.w % 12) : 0;
  $: hFt = room ? Math.floor(room.h / 12) : 10;
  $: hIn = room ? Math.round(room.h % 12) : 0;
  $: wM  = room ? (room.w * 0.0254).toFixed(2) : '3.66';
  $: hM  = room ? (room.h * 0.0254).toFixed(2) : '3.05';

  function onName(e: Event) {
    applyRoomName((e.target as HTMLInputElement).value);
  }
  function onColor(e: Event) {
    applyRoomColor((e.target as HTMLInputElement).value);
  }
  function onSize() {
    if (!room) return;
    if (isFt) {
      const w = Math.max(12, wFt * 12 + wIn);
      const h = Math.max(12, hFt * 12 + hIn);
      applyRoomSize(w, h);
    } else {
      const w = toIn(parseFloat(wM) || 3.66);
      const h = toIn(parseFloat(hM) || 3.05);
      applyRoomSize(w, h);
    }
  }
</script>

{#if room}
  <div class="panel">
    <h4>Room</h4>

    <label>Name</label>
    <input type="text" value={room.name} on:input={onName}>

    <div class="r2">
      {#if isFt}
        <div>
          <label>Width</label>
          <div class="ftin-group">
            <input type="number" bind:value={wFt} min="0" step="1" on:change={onSize}>
            <span class="ftin-lbl">ft</span>
            <input type="number" bind:value={wIn} min="0" max="11" step="1" on:change={onSize}>
            <span class="ftin-lbl">in</span>
          </div>
        </div>
        <div>
          <label>Depth</label>
          <div class="ftin-group">
            <input type="number" bind:value={hFt} min="0" step="1" on:change={onSize}>
            <span class="ftin-lbl">ft</span>
            <input type="number" bind:value={hIn} min="0" max="11" step="1" on:change={onSize}>
            <span class="ftin-lbl">in</span>
          </div>
        </div>
      {:else}
        <div>
          <label>Width (m)</label>
          <input type="number" bind:value={wM} step="0.01" min="0.1" on:change={onSize}>
        </div>
        <div>
          <label>Depth (m)</label>
          <input type="number" bind:value={hM} step="0.01" min="0.1" on:change={onSize}>
        </div>
      {/if}
    </div>

    <label style="margin-top:8px">Color</label>
    <input type="color" value={room.color} on:change={onColor}>

    <button class="del" style="width:100%;margin-top:12px" on:click={delSelRoom}>Delete Room</button>
  </div>
{/if}

<style>
  .panel {
    position: absolute;
    right: 12px;
    top: 56px;
    width: 210px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 14px;
    box-shadow: 0 2px 14px rgba(0,0,0,.1);
    z-index: 20;
  }

  @media (max-width: 767px) {
    .panel {
      left: 12px; right: 12px; bottom: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); top: auto;
      width: auto; max-width: none;
      border-radius: 16px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 8px 28px rgba(0,0,0,.18);
      max-height: 62vh; max-height: min(62dvh, calc(100dvh - 24px));
      overflow-y: auto;
      padding: 16px 16px 20px;
    }
    h4 { font-size: 15px; }
    button { min-height: 44px; }
    label { font-size: 13px; }
    input[type=text], input[type=number] { font-size: 15px; padding: 9px; }
    input[type=color] { height: 40px; }
  }
  h4 { font-size: 13px; font-weight: 700; color: #222; margin-bottom: 6px; }
  label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; margin-top: 8px; }
  label:first-of-type { margin-top: 0; }
  input[type=text], input[type=number] {
    width: 100%; padding: 6px 9px; border: 1px solid #e0e0e0; border-radius: 6px;
    font-size: 13px; background: #fafafa; color: #222; outline: none;
  }
  input[type=color] { padding: 2px 3px; height: 32px; cursor: pointer; width: 100%; border-radius: 6px; border: 1px solid #e0e0e0; }
  .r2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .ftin-group {
    display: flex; align-items: center; gap: 4px;
    border: 1px solid #e0e0e0; border-radius: 6px;
    background: #fafafa; padding: 2px 6px; height: 32px;
  }
  .ftin-group input { flex: 1; min-width: 26px; border: none; background: transparent; padding: 2px; text-align: center; outline: none; font-size: 13px; }
  .ftin-lbl { font-size: 11px; color: #999; flex-shrink: 0; }
  button { display: inline-flex; align-items: center; justify-content: center; padding: 6px 11px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #333; }
  button:hover { background: #f4f4f4; }
  button.del { color: #b44; border-color: #e0c0c0; }
  button.del:hover { background: #fdf0f0; }
</style>
