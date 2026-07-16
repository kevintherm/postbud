<script lang="ts">
  import { store } from '../store.svelte';
  import type { RequestItem, SidebarItem } from '../types';

  let {
    onrequestcontextmenu = (_e: MouseEvent, _item: SidebarItem) => {},
  }: {
    onrequestcontextmenu?: (e: MouseEvent, item: SidebarItem) => void;
  } = $props();

  function getMethodColorClass(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return 'badge-get';
      case 'POST': return 'badge-post';
      case 'PUT': return 'badge-put';
      case 'DELETE': return 'badge-delete';
      default: return 'badge-other';
    }
  }

  function handleDragStart(e: DragEvent, req: RequestItem) {
    e.dataTransfer?.setData('text/plain', JSON.stringify({ itemId: req.id, type: 'request', collectionId: null }));
    e.dataTransfer!.effectAllowed = 'move';
  }

  function handleContextMenu(e: MouseEvent, req: RequestItem) {
    const item: SidebarItem = { type: 'request', request: req };
    onrequestcontextmenu(e, item);
  }
</script>

{#if store.topLevelRequests.length > 0}
  <div class="top-level-list">
    {#each store.topLevelRequests as req (req.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <button
        type="button"
        class="request-item {store.activeRequest.id === req.id ? 'active' : ''}"
        data-request-id={req.id}
        draggable="true"
        ondragstart={(e) => handleDragStart(e, req)}
        onclick={() => store.loadRequest(req)}
        oncontextmenu={(e) => handleContextMenu(e, req)}
      >
        <span class="method-badge {getMethodColorClass(req.method)}">{req.method}</span>
        <span class="request-name">{req.name}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .top-level-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .request-item {
    background: none;
    border: 2px solid transparent;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    cursor: grab;
    font-family: var(--font-body);
    font-size: 0.85rem;
    transition: border-color 0.15s ease, background-color 0.15s ease;
    user-select: none;
  }

  .request-item:hover {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-black);
  }

  .request-item:active {
    cursor: grabbing;
  }

  .request-item.active {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-black);
    font-weight: 700;
  }

  .request-item:focus {
    outline: none;
  }

  .request-item:focus-visible {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-black);
    outline: 2px dashed var(--bauhaus-blue);
    outline-offset: -2px;
  }

  .method-badge {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.6rem;
    padding: 2px 4px;
    border: 1px solid var(--bauhaus-black);
    min-width: 44px;
    text-align: center;
    flex-shrink: 0;
  }

  .badge-get { background-color: var(--bauhaus-blue); color: var(--bauhaus-white); }
  .badge-post { background-color: var(--bauhaus-yellow); color: var(--bauhaus-black); }
  .badge-put { background-color: var(--bauhaus-red); color: var(--bauhaus-white); }
  .badge-delete { background-color: var(--bauhaus-black); color: var(--bauhaus-white); }
  .badge-other { background-color: var(--bauhaus-white); color: var(--bauhaus-black); }
  .request-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
