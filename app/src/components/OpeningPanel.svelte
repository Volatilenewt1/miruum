<script lang="ts">
  import { appState } from '../lib/store';
  import { applyOpeningWidth, cycleDoorSwing, delSelOpening } from '../lib/actions';
  import { toIn } from '../lib/utils';

  $: opening = $appState.openings.find(o => o.id === $appState.selOId);
  $: unit = $appState.unit;
  $: isFt = unit === 'ft';

  let wFt = 3, wIn = 0, wM = '0.91';

  $: if (opening) {
    wFt = Math.floor(opening.width / 12);
    wIn = Math.round(opening.width % 12);
    wM  = (opening.width * 0.0254).toFixed(2);
  }

  function onWidth() {
    if (!opening) return;
    if (isFt) {
      applyOpeningWidth(Math.max(6, wFt * 12 + wIn));
    } else {
      applyOpeningWidth(Math.max(6, toIn(parseFloat(wM) || 0.5)));
    }
  }
</script>

{#if opening}
  <div class="panel">
    <h4>{opening.type === 'door' ? 'Door' : 'Window'}</h4>

    {#if isFt}
      <label>Width</label>
      <div class="ftin-group">
        <input type="number" bind:value={wFt} min="0" step="1" on:change={onWidth}>
        <span class="ftin-lbl">ft</span>
        <input type="number" bind:value={wIn} min="0" max="11" step="1" on:change={onWidth}>
        <span class="ftin-lbl">in</span>
      </div>
    {:else}
      <label>Width (m)</label>
      <input type="number" bind:value={wM} step="0.01" min="0.1" on:change={onWidth}>
    {/if}

    {#if opening.type === 'door'}
      <div style="margin-top:8px">
        <button style="width:100%" on:click={cycleDoorSwing}>&#8635; Cycle Swing</button>
      </div>
    {/if}

    <button class="del" style="width:100%;margin-top:12px" on:click={delSelOpening}>Delete</button>
  </div>
{/if}

<style>
  .panel {
    position: absolute; right: 12px; top: 56px; width: 210px;
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
  h4 { font-size: 13px; font-weight: 700; color: #222; margin-bottom: 6px; }
  label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; margin-top: 8px; }
  input[type=number] { width: 100%; padding: 6px 9px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px; background: #fafafa; color: #222; outline: none; }
  .ftin-group { display: flex; align-items: center; gap: 4px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; padding: 2px 6px; height: 32px; }
  .ftin-group input { flex: 1; min-width: 26px; border: none; background: transparent; padding: 2px; text-align: center; outline: none; font-size: 13px; }
  .ftin-lbl { font-size: 11px; color: #999; }
  button { display: inline-flex; align-items: center; justify-content: center; padding: 6px 11px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #333; }
  button:hover { background: #f4f4f4; }
  button.del { color: #b44; border-color: #e0c0c0; }
  button.del:hover { background: #fdf0f0; }
</style>
