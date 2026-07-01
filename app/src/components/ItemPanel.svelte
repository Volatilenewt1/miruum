<script lang="ts">
  import { appState } from '../lib/store';
  import {
    applyItemName, applyItemSize, applyItemColor, applyRot, applyFlo,
    delSelected, applyExtension, removeExtension,
  } from '../lib/actions';
  import { toIn, snap, extSizes, fmtIn } from '../lib/utils';
  import type { ExtKey } from '../lib/types';

  $: item = $appState.placed.find(p => p.id === $appState.selId);
  $: unit = $appState.unit;
  $: isFt = unit === 'ft';

  $: wFt = item ? Math.floor(item.w / 12) : 0;
  $: wIn = item ? Math.round(item.w % 12) : 0;
  $: hFt = item ? Math.floor(item.h / 12) : 0;
  $: hIn = item ? Math.round(item.h % 12) : 0;
  $: wM  = item ? (item.w * 0.0254).toFixed(2) : '0';
  $: hM  = item ? (item.h * 0.0254).toFixed(2) : '0';
  $: rot = item ? Math.round(item.rot) : 0;

  $: totalSize = item ? (() => {
    const { eT, eB, eL, eR } = extSizes(item);
    if (!eT && !eB && !eL && !eR) return '';
    return `Total: ${fmtIn(item.w + eL + eR)} × ${fmtIn(item.h + eT + eB)}`;
  })() : '';

  function onName(e: Event) { applyItemName((e.target as HTMLInputElement).value); }
  function onColor(e: Event) { applyItemColor((e.target as HTMLInputElement).value); }
  function onFlo(e: Event) { applyFlo((e.target as HTMLInputElement).checked); }
  function onRot(e: Event) { applyRot(parseFloat((e.target as HTMLInputElement).value) || 0); }

  function onSize() {
    if (!item) return;
    if (isFt) {
      applyItemSize(Math.max(6, wFt * 12 + wIn), Math.max(6, hFt * 12 + hIn));
    } else {
      applyItemSize(toIn(parseFloat(wM) || 0.5), toIn(parseFloat(hM) || 0.5));
    }
  }

  // extension state
  type ExtData = { open: boolean; name: string; color: string; ft: number; inch: number; m: string };
  const EXT_KEYS: ExtKey[] = ['sizeIncrease', 'top', 'right', 'bottom', 'left'];
  const EXT_LABELS: Record<ExtKey, string> = {
    sizeIncrease: 'Size Increase (all sides)', top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left',
  };

  function getExtData(key: ExtKey): ExtData {
    if (!item) return { open: false, name: '', color: '#c8b8a8', ft: 0, inch: 6, m: '0.15' };
    const e = item.extensions?.[key];
    const val = key === 'sizeIncrease' ? ((e as any)?.amount ?? 0) : ((e as any)?.size ?? 0);
    return {
      open: !!e,
      name: e?.name ?? '',
      color: e?.color ?? (key === 'sizeIncrease' ? '#d4c8b8' : '#c8b8a8'),
      ft: Math.floor(val / 12), inch: Math.round(val % 12),
      m: (val * 0.0254).toFixed(2),
    };
  }

  function applyExt(key: ExtKey, data: ExtData) {
    const amount = isFt ? snap(Math.max(0, data.ft * 12 + data.inch))
                        : snap(toIn(parseFloat(data.m) || 0));
    applyExtension(key, { name: data.name, color: data.color,
      ...(key === 'sizeIncrease' ? { amount } : { size: amount }) });
  }

  function removeExt(key: ExtKey) { removeExtension(key); }
</script>

{#if item}
  <div class="panel">
    <h4>{item.name}</h4>

    <label>Name</label>
    <input type="text" value={item.name} on:input={onName}>

    {#if isFt}
      <label>Width</label>
      <div class="ftin-group">
        <input type="number" bind:value={wFt} min="0" step="1" on:change={onSize}>
        <span class="ftin-lbl">ft</span>
        <input type="number" bind:value={wIn} min="0" max="11" step="1" on:change={onSize}>
        <span class="ftin-lbl">in</span>
      </div>
      <label>Depth</label>
      <div class="ftin-group">
        <input type="number" bind:value={hFt} min="0" step="1" on:change={onSize}>
        <span class="ftin-lbl">ft</span>
        <input type="number" bind:value={hIn} min="0" max="11" step="1" on:change={onSize}>
        <span class="ftin-lbl">in</span>
      </div>
    {:else}
      <label>Width (m)</label>
      <input type="number" bind:value={wM} step="0.01" min="0.1" on:change={onSize}>
      <label>Depth (m)</label>
      <input type="number" bind:value={hM} step="0.01" min="0.1" on:change={onSize}>
    {/if}

    <label style="margin-top:6px">Color</label>
    <input type="color" value={item.color} on:change={onColor}>

    <label style="margin-top:6px">Rotation (°)</label>
    <input type="number" value={rot} min="0" max="359" step="1" on:change={onRot}>

    <div class="togrow">
      <span>Floating</span>
      <label class="toglabel">
        <input type="checkbox" checked={item.floating} on:change={onFlo}>
        <div class="togtrack"></div>
        <div class="togthumb"></div>
      </label>
    </div>

    <button class="del" style="width:100%;margin-top:12px" on:click={delSelected}>Delete Item</button>

    <!-- Extensions -->
    <div class="ext-section">
      <div class="ext-title">Extensions</div>
      {#if totalSize}<div class="total-size">{totalSize}</div>{/if}

      {#each EXT_KEYS as key}
        {@const d = getExtData(key)}
        <div class="ext-group">
          <div class="ext-head" on:click={() => {
            if (!d.open) applyExt(key, { ...d, open: true });
            else {/* just toggling visibility; extension data stays */}
          }}>
            <span class="ext-label">{EXT_LABELS[key]}</span>
            <span class="ext-btn">{d.open ? '▾' : '+ Add'}</span>
          </div>
          {#if d.open}
            <div class="ext-body">
              <label>Name</label>
              <input type="text" value={d.name}
                on:input={e => applyExt(key, { ...d, name: (e.target as HTMLInputElement).value })}>
              <label>Color</label>
              <input type="color" value={d.color}
                on:change={e => applyExt(key, { ...d, color: (e.target as HTMLInputElement).value })}>
              {#if isFt}
                <label>{key === 'sizeIncrease' ? 'Amount per side' : 'Depth'}</label>
                <div class="ftin-group">
                  <input type="number" value={d.ft} min="0" step="1"
                    on:change={e => applyExt(key, { ...d, ft: +(e.target as HTMLInputElement).value })}>
                  <span class="ftin-lbl">ft</span>
                  <input type="number" value={d.inch} min="0" max="11" step="1"
                    on:change={e => applyExt(key, { ...d, inch: +(e.target as HTMLInputElement).value })}>
                  <span class="ftin-lbl">in</span>
                </div>
              {:else}
                <label>{key === 'sizeIncrease' ? 'Amount per side (m)' : 'Depth (m)'}</label>
                <input type="number" value={d.m} step="0.05" min="0"
                  on:change={e => applyExt(key, { ...d, m: (e.target as HTMLInputElement).value })}>
              {/if}
              <button class="del sm" style="width:100%;margin-top:6px"
                on:click|stopPropagation={() => removeExt(key)}>Remove</button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .panel {
    position: absolute; right: 12px; top: 56px; width: 220px;
    background: #fff; border: 1px solid #e0e0e0; border-radius: 10px;
    padding: 14px; box-shadow: 0 2px 14px rgba(0,0,0,.1); z-index: 20;
    overflow-y: auto; max-height: calc(100vh - 68px);
  }

  @media (max-width: 767px) {
    .panel {
      right: 0; left: 0; bottom: 0; top: auto;
      width: 100%; max-width: 100%;
      border-radius: 16px 16px 0 0;
      border: none; border-top: 1px solid #e0e0e0;
      box-shadow: 0 -4px 24px rgba(0,0,0,.15);
      max-height: 62vh;
      padding: 16px 16px 24px;
    }
    h4 { font-size: 15px; }
    button { min-height: 44px; }
    button.sm { min-height: 32px; }
    label { font-size: 13px; }
    input[type=text], input[type=number] { font-size: 15px; padding: 9px; }
    input[type=color] { height: 40px; }
  }
  h4 { font-size: 13px; font-weight: 700; color: #222; margin-bottom: 6px; }
  label { display: block; font-size: 11px; color: #666; margin-bottom: 3px; margin-top: 8px; }
  label:first-of-type { margin-top: 0; }
  input[type=text], input[type=number] { width: 100%; padding: 6px 9px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px; background: #fafafa; color: #222; outline: none; }
  input[type=color] { padding: 2px 3px; height: 32px; cursor: pointer; width: 100%; border-radius: 6px; border: 1px solid #e0e0e0; }
  .ftin-group { display: flex; align-items: center; gap: 4px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; padding: 2px 6px; height: 32px; }
  .ftin-group input { flex: 1; min-width: 26px; border: none; background: transparent; padding: 2px; text-align: center; outline: none; font-size: 13px; }
  .ftin-lbl { font-size: 11px; color: #999; flex-shrink: 0; }
  button { display: inline-flex; align-items: center; justify-content: center; padding: 6px 11px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #333; }
  button:hover { background: #f4f4f4; }
  button.del { color: #b44; border-color: #e0c0c0; }
  button.del:hover { background: #fdf0f0; }
  button.sm { font-size: 11px; padding: 4px 8px; }
  .togrow { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .togrow span { font-size: 12px; color: #555; }
  .toglabel { position: relative; width: 36px; height: 20px; cursor: pointer; }
  .toglabel input { opacity: 0; width: 0; height: 0; }
  .togtrack { position: absolute; inset: 0; background: #ddd; border-radius: 20px; transition: background .2s; }
  .toglabel input:checked + .togtrack { background: #4a90e2; }
  .togthumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: left .2s; pointer-events: none; }
  .toglabel input:checked ~ .togthumb { left: 19px; }
  .ext-section { margin-top: 12px; border-top: 1px solid #ebebeb; padding-top: 10px; }
  .ext-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #aaa; margin-bottom: 6px; }
  .total-size { font-size: 11px; color: #4a90e2; font-weight: 600; margin-bottom: 8px; }
  .ext-group { margin-bottom: 6px; }
  .ext-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 5px; border-radius: 5px; user-select: none; }
  .ext-head:hover { background: #f4f4f4; }
  .ext-label { font-size: 11px; font-weight: 600; color: #555; }
  .ext-btn { font-size: 10px; padding: 2px 6px; border: 1px solid #ddd; border-radius: 4px; background: #f4f4f4; color: #666; white-space: nowrap; }
  .ext-body { background: #f7f7f7; border: 1px solid #ebebeb; border-radius: 6px; padding: 8px; margin-top: 3px; }
  .ext-body label { font-size: 11px; color: #666; margin-top: 6px; }
  .ext-body label:first-of-type { margin-top: 0; }
</style>
