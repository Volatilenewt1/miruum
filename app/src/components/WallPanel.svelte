<script lang="ts">
  import { appState } from '../lib/store';
  import { delSelWall, toggleWallLock, wLen, addOpenings, selOpening } from '../lib/actions';
  import { fmtIn, toIn } from '../lib/utils';

  $: s = $appState;
  $: wall = s.walls.find(w => w.id === s.selWallId);
  $: isFt = s.unit === 'ft';
  $: wallOpenings = wall ? s.openings.filter(o => o.wallId === wall!.id) : [];

  let ocnt = 1, owFt = 3, owIn = 0, owM = '0.9';
  let hint = '';

  function onAdd(type: 'door' | 'win') {
    const w = isFt
      ? Math.max(6, owFt * 12 + owIn)
      : Math.max(6, toIn(parseFloat(owM) || 0.9));
    const msg = addOpenings(type, ocnt, w);
    if (msg) { hint = msg; setTimeout(() => hint = '', 2500); }
  }
</script>

{#if wall}
  <div class="panel">
    <div class="header-row">
      <h4>Wall</h4>
      <button class="lock-btn" class:locked={wall.locked} on:click={toggleWallLock} title={wall.locked ? 'Unlock wall' : 'Lock wall'}>
        {wall.locked ? '🔒 Locked' : '🔓 Unlocked'}
      </button>
    </div>
    <div class="info">Length: {fmtIn(Math.round(wLen(wall)))}</div>

    {#if !wall.locked}
      <div class="form-group">
        <div class="r2">
          <div><label>Count</label><input type="number" bind:value={ocnt} min="1" max="20"></div>
          {#if isFt}
            <div>
              <label>Width</label>
              <div class="ftin-group">
                <input type="number" bind:value={owFt} min="0" step="1">
                <span class="ftin-lbl">ft</span>
                <input type="number" bind:value={owIn} min="0" max="11" step="1">
                <span class="ftin-lbl">in</span>
              </div>
            </div>
          {:else}
            <div><label>Width (m)</label><input type="number" bind:value={owM} min="0.1" step="0.05"></div>
          {/if}
        </div>
        <div class="brow">
          <button style="flex:1" on:click={() => onAdd('door')}>+ Door(s)</button>
          <button style="flex:1" on:click={() => onAdd('win')}>+ Window(s)</button>
        </div>
        {#if hint}<div class="hint-msg">{hint}</div>{/if}
      </div>

      {#if wallOpenings.length > 0}
        <div class="opening-list">
          {#each wallOpenings as o}
            <div class="list-item" class:sel={o.id === s.selOId} on:click={() => selOpening(o.id)}>
              <span class="obadge" class:door={o.type === 'door'} class:win={o.type === 'win'}>{o.type === 'door' ? 'D' : 'W'}</span>
              <span class="li-name">{o.type === 'door' ? 'Door' : 'Window'}</span>
              <span class="li-dims">{fmtIn(o.width)}</span>
            </div>
          {/each}
        </div>
      {/if}

      <button class="del" style="width:100%;margin-top:12px" on:click={delSelWall}>Delete Wall</button>
    {:else}
      <p class="locked-msg">Unlock this wall to move, resize, add openings, or delete it.</p>
    {/if}
  </div>
{/if}

<style>
  .panel {
    position: absolute; right: 12px; top: 56px; width: 220px;
    background: #fff; border: 1px solid #e0e0e0; border-radius: 10px;
    padding: 14px; box-shadow: 0 2px 14px rgba(0,0,0,.1); z-index: 20;
  }

  @media (max-width: 767px) {
    .panel {
      right: 0; left: 0; bottom: 0; top: auto;
      width: 100%; max-width: 100%;
      border-radius: 16px 16px 0 0;
      border: none; border-top: 1px solid #e0e0e0;
      box-shadow: 0 -4px 24px rgba(0,0,0,.15);
      max-height: 62vh;
      overflow-y: auto;
      padding: 16px 16px 24px;
    }
    h4 { font-size: 15px; }
    button { min-height: 44px; }
    label { font-size: 13px; }
    input[type=number] { font-size: 15px; padding: 9px; }
  }
  .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  h4 { font-size: 13px; font-weight: 700; color: #222; }
  .lock-btn {
    font-size: 10px; padding: 3px 8px; border-radius: 5px;
    border: 1px solid #e0e0e0; background: #fafafa; color: #666;
    cursor: pointer; font-family: inherit;
  }
  .lock-btn:hover { background: #f0f0f0; }
  .lock-btn.locked { background: #fff8e8; border-color: #f0c060; color: #a07000; }
  .lock-btn.locked:hover { background: #fef0cc; }
  .locked-msg { font-size: 11px; color: #aaa; margin-top: 8px; line-height: 1.5; }
  .info { font-size: 11px; color: #999; margin-bottom: 10px; }
  .form-group { border-top: 1px solid #f0f0f0; padding-top: 10px; }
  label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; margin-top: 8px; }
  label:first-of-type { margin-top: 0; }
  input[type=number] { width: 100%; padding: 6px 9px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px; background: #fafafa; color: #222; outline: none; }
  .r2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ftin-group { display: flex; align-items: center; gap: 3px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; padding: 2px 5px; height: 32px; }
  .ftin-group input { flex: 1; min-width: 22px; border: none; background: transparent; padding: 2px; text-align: center; outline: none; font-size: 13px; }
  .ftin-lbl { font-size: 11px; color: #999; }
  .brow { display: flex; gap: 5px; margin-top: 8px; }
  button { display: inline-flex; align-items: center; justify-content: center; padding: 6px 11px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #333; }
  button:hover { background: #f4f4f4; }
  button.del { color: #b44; border-color: #e0c0c0; }
  button.del:hover { background: #fdf0f0; }
  .hint-msg { font-size: 11px; color: #e07020; margin-top: 6px; }
  .opening-list { border-top: 1px solid #f0f0f0; margin-top: 10px; padding-top: 6px; }
  .list-item { display: flex; align-items: center; gap: 6px; padding: 5px 4px; border-radius: 5px; cursor: pointer; font-size: 12px; }
  .list-item:hover { background: #f4f4f4; }
  .list-item.sel { background: #e8f0fe; }
  .li-name { flex: 1; color: #333; font-weight: 500; }
  .li-dims { font-size: 11px; color: #aaa; white-space: nowrap; }
  .obadge { font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 3px; text-transform: uppercase; letter-spacing: .06em; flex-shrink: 0; }
  .obadge.door { background: #fde8d0; color: #c05a0e; }
  .obadge.win  { background: #d0e8fd; color: #0e6bc0; }
</style>
