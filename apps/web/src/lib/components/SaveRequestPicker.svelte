<script lang="ts">
  import { store } from '../store.svelte';

  let { onclose } = $props<{
    onclose: () => void;
  }>();

  function saveTo(collectionId: string) {
    store.saveToCollection(collectionId);
    onclose();
  }

  function saveTopLevel() {
    store.saveAsTopLevel();
    onclose();
  }

  interface FlatCollection {
    id: string;
    name: string;
    level: number;
  }

  function getFlatCollections(items: any[], level = 0): FlatCollection[] {
    const list: FlatCollection[] = [];
    for (const item of items) {
      if (item.type === 'collection') {
        list.push({ id: item.collection.id, name: item.collection.name, level });
        list.push(...getFlatCollections(item.collection.items, level + 1));
      }
    }
    return list;
  }

  let flatCollectionsList = $derived.by(() => {
    const list: FlatCollection[] = [];
    for (const col of store.collections) {
      list.push({ id: col.id, name: col.name, level: 0 });
      list.push(...getFlatCollections(col.items, 1));
    }
    return list;
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="save-picker"
  role="menu"
  tabindex="0"
  onclick={(e) => e.stopPropagation()}
  oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
>
  <button
    type="button"
    class="picker-item picker-top"
    onclick={saveTopLevel}
  >
    <span class="picker-top-icon">☆</span>
    <span class="picker-name">top level</span>
  </button>
  {#if flatCollectionsList.length > 0}
    {#each flatCollectionsList as col}
      <button
        type="button"
        class="picker-item picker-collection"
        style="padding-left: {12 + col.level * 12}px; font-weight: {col.level === 0 ? 700 : 500};"
        onclick={() => saveTo(col.id)}
      >
        <span class="picker-icon">{col.level === 0 ? '▦' : '↳'}</span>
        <span class="picker-name">{col.name}</span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .save-picker {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 100;
    margin-top: 4px;
    background-color: var(--bauhaus-white);
    border: 2px solid var(--bauhaus-black);
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .picker-item {
    background: none;
    border: none;
    border-bottom: 1px solid var(--bauhaus-black);
    padding: 8px 12px;
    text-align: left;
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: lowercase;
    transition: background-color 0.1s ease;
  }

  .picker-item:last-child {
    border-bottom: none;
  }

  .picker-item:hover {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .picker-collection {
    font-weight: 700;
    border-top: 2px solid var(--bauhaus-black);
  }

  .picker-collection:first-child {
    border-top: none;
  }

  .picker-top {
    font-weight: 700;
    border-bottom: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-grid-bg);
  }

  .picker-top-icon {
    width: 16px;
    text-align: center;
    flex-shrink: 0;
    font-size: 0.9rem;
    color: var(--bauhaus-blue);
  }



  .picker-icon {
    width: 16px;
    text-align: center;
    flex-shrink: 0;
    font-size: 0.7rem;
  }

  .picker-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
