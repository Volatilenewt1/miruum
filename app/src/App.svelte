<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from './lib/store';
  import { loadFromURL } from './lib/exportio';
  import Canvas from './components/Canvas.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import RoomPanel from './components/RoomPanel.svelte';
  import ItemPanel from './components/ItemPanel.svelte';
  import WallPanel from './components/WallPanel.svelte';
  import OpeningPanel from './components/OpeningPanel.svelte';
  import HelpModal from './components/HelpModal.svelte';

  onMount(() => { loadFromURL(); });

  $: s = $appState;
  $: showItem    = s.selId !== null;
  $: showWall    = s.selWallId !== null;
  $: showOpening = s.selOId !== null;
  $: showRoom    = s.roomPanelVisible && !showItem && !showWall && !showOpening;

  // Flagged logic change: local state required to wire hamburger ↔ sidebar on mobile.
  // No store or TS type changes — desktop layout is unaffected (sidebar always visible via CSS).
  let sidebarOpen = false;
</script>

<!-- Hamburger: fixed 44×44px button, only shown on mobile when sidebar is closed -->
<button
  class="hamburger"
  class:vis={!sidebarOpen}
  on:click={() => (sidebarOpen = true)}
  aria-label="Open menu"
>&#9776;</button>

<!-- Tap-outside-to-close backdrop, only rendered on mobile when sidebar is open -->
<div
  class="mob-backdrop"
  class:vis={sidebarOpen}
  on:click={() => (sidebarOpen = false)}
></div>

<div class="app">
  <Sidebar bind:open={sidebarOpen} />
  <div class="canvas-area full">
    <Canvas />
    <Toolbar />
    {#if showItem}
      <ItemPanel />
    {:else if showWall}
      <WallPanel />
    {:else if showOpening}
      <OpeningPanel />
    {:else if showRoom}
      <RoomPanel />
    {/if}
  </div>
</div>

<HelpModal />

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f0f0f0;
    overflow: hidden;
    color: #222;
  }
  .app {
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
  .canvas-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .canvas-area.full {
    width: 100%;
  }

  /* ── Hamburger ─────────────────────────────────────────────────── */
  .hamburger {
    display: none; /* hidden on desktop; shown via media query below */
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 150;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid #e0e0e0;
    background: #fff;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .hamburger:hover { background: #f4f4f4; }

  /* ── Mobile backdrop ───────────────────────────────────────────── */
  .mob-backdrop {
    display: none; /* hidden on desktop */
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.4);
    z-index: 95;
  }

  @media (max-width: 767px) {
    .hamburger.vis { display: flex; }
    .mob-backdrop.vis { display: block; }
  }
</style>
