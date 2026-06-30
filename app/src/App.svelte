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
</script>

<div class="app">
  <Sidebar />
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
</style>
