<script lang="ts">
  import { appState } from '../lib/store';
  import { setMode, finishWall, cancelWall } from '../lib/actions';
  import { exportPNG, exportInstagramStory, saveURL } from '../lib/exportio';

  $: mode = $appState.mode;

  let shareOpen = false;
  let savedUrl = '';
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  function closeShare() { shareOpen = false; }

  function pick(fn: () => void) {
    fn();
    shareOpen = false;
  }

  function handleSave() {
    savedUrl = saveURL();
  }

  function copyUrl() {
    navigator.clipboard.writeText(savedUrl);
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copied = false; }, 2000);
  }
</script>

<svelte:window on:click={closeShare} />

<div class="toolbar">
  <div class="toolbar-row">
    <button class:act={mode === 'select'} on:click={() => setMode('select')}>&#9654; Select</button>
    <button class:act={mode === 'wall'}   on:click={() => setMode('wall')}>&#9998; Draw Wall</button>
    {#if mode === 'wall'}
      <button class="pri" on:click={finishWall}>&#10003; Done</button>
      <button on:click={cancelWall}>&#x2715; Cancel</button>
    {/if}
    <div class="sep"></div>

    <div class="share-wrap" on:click|stopPropagation>
      <button class:act={shareOpen} on:click={() => shareOpen = !shareOpen}>&#8679; Share</button>
      {#if shareOpen}
        <div class="share-menu">
          <button on:click={() => pick(exportPNG)}>
            <span class="icon">&#128444;</span>
            <span class="label">
              Flat PNG
              <small>Top-down layout, scaled to fit</small>
            </span>
          </button>
          <button on:click={() => pick(exportInstagramStory)}>
            <span class="icon">&#128247;</span>
            <span class="label">
              Instagram Story
              <small>1080 × 1920 px · 9:16</small>
            </span>
          </button>
        </div>
      {/if}
    </div>

    <button on:click={handleSave} title="Save project to URL">&#128190; Save</button>
  </div>
  {#if mode === 'wall'}
    <div class="hotkeys desktop-hint">Left click: place point &nbsp;·&nbsp; Right click: finish</div>
    <div class="hotkeys mobile-hint">Tap: place point &nbsp;·&nbsp; Hold + drag a point: move it &nbsp;·&nbsp; Done/Cancel above</div>
  {/if}
  {#if savedUrl}
    <div class="url-row">
      <input class="url-input" type="text" readonly value={savedUrl} on:click={e => (e.target as HTMLInputElement).select()} />
      <button on:click={copyUrl}>{copied ? '✓ Copied' : '⎘ Copy'}</button>
      <button on:click={() => savedUrl = ''} title="Dismiss">&#x2715;</button>
    </div>
  {/if}
</div>

<style>
  .toolbar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 6px 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,.09);
    z-index: 20;
  }
  .toolbar-row {
    display: flex;
    gap: 5px;
    flex-wrap: nowrap;
    align-items: center;
  }
  button {
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    background: #fff;
    color: #333;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  button:hover { background: #f4f4f4; }
  button.act  { background: #e8f0fe; border-color: #4a90e2; color: #1a56c4; }
  button.pri  { background: #222; color: #fff; border-color: #222; }
  button.pri:hover { background: #3a3a3a; }
  .sep {
    width: 1px;
    background: #e4e4e4;
    margin: 0 2px;
  }
  .hotkeys {
    font-size: 10px;
    color: #888;
    text-align: center;
    padding: 0 4px 2px;
    white-space: nowrap;
  }
  .mobile-hint { display: none; }

  .share-wrap {
    position: relative;
  }
  .share-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,.12);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 190px;
    z-index: 30;
  }

  /* ── Mobile toolbar ────────────────────────────────────────────── */
  @media (max-width: 767px) {
    .toolbar {
      left: 50%;
      transform: translateX(-50%);
      max-width: calc(100vw - 32px);
      top: 16px;
    }
    .toolbar-row {
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px;
    }
    button {
      font-size: 12px;
      padding: 8px 11px;
      min-height: 40px;
    }
    .sep { display: none; }
    .share-menu {
      left: 50%;
      transform: translateX(-50%);
      right: auto;
    }
    .url-row { flex-wrap: wrap; }
    .url-input { min-width: 0; flex: 1 1 120px; }
    .desktop-hint { display: none; }
    .mobile-hint { display: block; white-space: normal; }
  }

  @media (max-width: 479px) {
    .toolbar {
      max-width: calc(100vw - 24px);
    }
    button {
      padding: 7px 9px;
      font-size: 11px;
    }
  }
  .share-menu button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: none;
    border-radius: 7px;
    text-align: left;
    width: 100%;
  }
  .share-menu button:hover { background: #f4f4f4; }
  .icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  .label {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .label small {
    font-size: 10px;
    color: #888;
    font-weight: 400;
  }

  .url-row {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 2px 0;
  }
  .url-input {
    flex: 1;
    font-size: 10px;
    padding: 4px 6px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background: #f9f9f9;
    color: #444;
    min-width: 0;
    cursor: text;
  }
</style>
