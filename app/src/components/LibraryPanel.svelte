<script lang="ts">
  import { appState } from '../lib/store';
  import { placePreset, placeCustomFurnishing } from '../lib/actions';
  import { fmtIn } from '../lib/utils';
  import { PRESETS } from '../lib/presets';
  import type { ItemShape } from '../lib/types';

  let query = '';
  let collapsed: Record<string, boolean> = Object.fromEntries(
    PRESETS.map(g => ['room-' + g.room, true])
  );

  $: unit = $appState.unit;
  $: customFurnishings = $appState.furnishings;

  function shapeTag(shape?: ItemShape): string {
    if (!shape || shape === 'rect') return '';
    const labels: Record<string, string> = { round: '●', oval: '◉', lshape: 'L', tri: '△' };
    return labels[shape] || shape;
  }

  function matches(name: string, cat: string, room: string): boolean {
    if (!query) return true;
    return (name + ' ' + cat + ' ' + room).toLowerCase().includes(query.toLowerCase());
  }

  function toggleSection(key: string) {
    collapsed[key] = !collapsed[key];
    collapsed = collapsed;
  }
</script>

<div class="lib">
  <input type="text" placeholder="Search 180+ items…" bind:value={query} class="search">

  {#if customFurnishings.length > 0}
    {@const cfKey = 'custom-furnishings'}
    {@const cfFiltered = customFurnishings.filter(f => !query || f.name.toLowerCase().includes(query.toLowerCase()))}
    {#if cfFiltered.length > 0}
      <div class="room-sec">
        <div class="room-head" on:click={() => toggleSection(cfKey)}>
          <span>Custom Furnishing</span>
          <span class="arr" class:open={!collapsed[cfKey]}>▾</span>
        </div>
        {#if !collapsed[cfKey] || query}
          <div class="room-body">
            {#each cfFiltered as furn}
              <div class="lib-item" on:click={() => placeCustomFurnishing(furn)}>
                <span class="cf-swatch" style="background:{furn.color}"></span>
                <span class="li-name">{furn.name}</span>
                <span class="li-dims">{fmtIn(furn.w)}×{fmtIn(furn.h)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}

  {#each PRESETS as group}
    {@const roomKey = 'room-' + group.room}
    {@const hasMatch = group.cats.some(c => c.items.some(it => matches(it.name, c.cat, group.room)))}
    {#if hasMatch}
      <div class="room-sec">
        <div class="room-head" on:click={() => toggleSection(roomKey)}>
          <span>{group.room}</span>
          <span class="arr" class:open={!collapsed[roomKey]}>▾</span>
        </div>
        {#if !collapsed[roomKey] || query}
          <div class="room-body">
            {#each group.cats as cat}
              {@const catKey = roomKey + '-' + cat.cat}
              {@const catItems = cat.items.filter(it => matches(it.name, cat.cat, group.room))}
              {#if catItems.length}
                {#if cat.items.length === 1}
                  {#each catItems as item}
                    <div class="lib-item" on:click={() => placePreset(item.name, item.w, item.h, item.shape)}>
                      <span class="li-name">{item.name}{#if shapeTag(item.shape)}&nbsp;<span class="shape-tag">{shapeTag(item.shape)}</span>{/if}</span>
                      <span class="li-dims">{fmtIn(item.w)}×{fmtIn(item.h)}</span>
                    </div>
                  {/each}
                {:else}
                  <div class="cat-sec">
                    <div class="cat-head" on:click|stopPropagation={() => toggleSection(catKey)}>
                      <span>{cat.cat}</span>
                      <span class="arr" class:open={!collapsed[catKey]}>▾</span>
                    </div>
                    {#if !collapsed[catKey] || query}
                      <div class="cat-body">
                        {#each catItems as item}
                          <div class="lib-item" on:click={() => placePreset(item.name, item.w, item.h, item.shape)}>
                            <span class="li-name">{item.name}{#if shapeTag(item.shape)}&nbsp;<span class="shape-tag">{shapeTag(item.shape)}</span>{/if}</span>
                            <span class="li-dims">{fmtIn(item.w)}×{fmtIn(item.h)}</span>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .lib { font-size: 12px; }
  .search { width: 100%; padding: 5px 9px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; background: #fafafa; outline: none; margin-bottom: 8px; }
  .room-sec { margin-bottom: 2px; }
  .room-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; padding: 5px 4px; border-radius: 4px; }
  .room-head:hover { background: #f4f4f4; }
  .room-head > span:first-child { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #666; }
  .room-body { padding-left: 6px; padding-bottom: 4px; }
  .cat-sec { margin-bottom: 1px; }
  .cat-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; padding: 3px 4px; border-radius: 4px; }
  .cat-head:hover { background: #f4f4f4; }
  .cat-head > span:first-child { font-size: 11px; font-weight: 600; color: #888; }
  .cat-body { padding-left: 8px; }
  .lib-item { display: flex; align-items: center; gap: 5px; padding: 4px 6px; border-radius: 4px; cursor: pointer; }
  .lib-item:hover { background: #eef4ff; }
  .li-name { flex: 1; font-size: 11px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .li-dims { font-size: 10px; color: #bbb; white-space: nowrap; flex-shrink: 0; }
  .shape-tag { font-size: 9px; color: #999; background: #f0f0f0; padding: 1px 3px; border-radius: 3px; }
  .arr { font-size: 9px; color: #bbb; display: inline-block; transform: rotate(-90deg); transition: transform .15s; }
  .arr.open { transform: rotate(0deg); }
  .cf-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; border: 1px solid rgba(0,0,0,.1); flex-shrink: 0; }
</style>
