<script lang="ts">
  import { store } from '../store.svelte';
  import { requestNav } from '../navigation.svelte';
  import type { SidebarItem, CollectionItem } from '../types';
  import CollectionNode from './CollectionNode.svelte';

  let {
    items,
    parentId,
    onrequestcontextmenu = (_e: MouseEvent, _item: SidebarItem) => {},
    oncollectioncontextmenu = (_e: MouseEvent, _col: CollectionItem) => {},
  }: {
    items: SidebarItem[];
    parentId: string;
    onrequestcontextmenu?: (e: MouseEvent, item: SidebarItem) => void;
    oncollectioncontextmenu?: (e: MouseEvent, col: CollectionItem) => void;
  } = $props();

  let uniqueItems = $derived.by(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const id = item.type === 'request' ? item.request.id : item.collection.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });

  let dragOverItemId = $state<string | null>(null);
  let dragOverType: 'collection' | 'container' | null = $state(null);

  function getMethodColorClass(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return 'badge-get';
      case 'POST': return 'badge-post';
      case 'PUT': return 'badge-put';
      case 'DELETE': return 'badge-delete';
      default: return 'badge-other';
    }
  }

  function handleItemDragStart(e: DragEvent, item: SidebarItem) {
    const id = item.type === 'request' ? item.request.id : item.collection.id;
    e.dataTransfer?.setData('text/plain', JSON.stringify({ itemId: id, type: item.type, parentId }));
    e.dataTransfer!.effectAllowed = 'move';
  }

  function handleContainerDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }

  function handleCollectionDragOver(e: DragEvent, col: CollectionItem) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer!.dropEffect = 'move';
    dragOverItemId = col.id;
    dragOverType = 'collection';
  }

  function handleCollectionDragLeave() {
    dragOverItemId = null;
    dragOverType = null;
  }

  function handleContainerDrop(e: DragEvent) {
    e.preventDefault();
    dragOverItemId = null;
    dragOverType = null;
    const raw = e.dataTransfer?.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.parentId === parentId) return;
    store.moveItem(data.itemId, parentId);
  }

  function handleCollectionDrop(e: DragEvent, col: CollectionItem) {
    e.preventDefault();
    e.stopPropagation();
    dragOverItemId = null;
    dragOverType = null;
    const raw = e.dataTransfer?.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.itemId === col.id) return;
    store.moveItem(data.itemId, col.id);
  }

  function handleItemDragEnd() {
    dragOverItemId = null;
    dragOverType = null;
  }

  function toggleCollectionExpand(colId: string) {
    requestNav.toggleCollection(colId);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="items-container"
  class:drag-over={dragOverType === 'container'}
  ondragover={handleContainerDragOver}
  ondrop={handleContainerDrop}
  ondragend={handleItemDragEnd}
>
  {#each uniqueItems as item (item.type === 'request' ? item.request.id : item.collection.id)}
    {#if item.type === 'request'}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <button
        type="button"
        class="request-item {store.activeRequest.id === item.request.id ? 'active' : ''}"
        data-request-id={item.request.id}
        draggable="true"
        ondragstart={(e) => handleItemDragStart(e, item)}
        onclick={() => store.loadRequest(item.request)}
        oncontextmenu={(e) => onrequestcontextmenu(e, item)}
      >
        <span class="method-badge {getMethodColorClass(item.request.method)}">{item.request.method}</span>
        <span class="request-name">{item.request.name}</span>
      </button>
    {:else if item.type === 'collection'}
      <div class="collection-wrapper">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_role_has_required_aria_props -->
        <div
          class="collection-header"
          class:drag-over-collection={dragOverItemId === item.collection.id && dragOverType === 'collection'}
          data-collection-id={item.collection.id}
          data-collection-name={item.collection.name}
          draggable="true"
          tabindex="0"
          role="treeitem"
          ondragstart={(e) => handleItemDragStart(e, item)}
          ondragover={(e) => handleCollectionDragOver(e, item.collection)}
          ondragleave={handleCollectionDragLeave}
          ondrop={(e) => handleCollectionDrop(e, item.collection)}
          ondragend={handleItemDragEnd}
          onclick={() => toggleCollectionExpand(item.collection.id)}
          oncontextmenu={(e) => oncollectioncontextmenu(e, item.collection)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCollectionExpand(item.collection.id); }}
        >
          <span class="collection-icon">
            {requestNav.isCollectionExpanded(item.collection.id) ? '▼' : '▶'}
          </span>
          <span class="collection-name">{item.collection.name}</span>
        </div>

        {#if requestNav.isCollectionExpanded(item.collection.id)}
          <div class="collection-children">
            <CollectionNode
              items={item.collection.items}
              parentId={item.collection.id}
              {onrequestcontextmenu}
              {oncollectioncontextmenu}
            />
          </div>
        {/if}
      </div>
    {/if}
  {/each}

  {#if items.length === 0}
    <div class="empty-text">empty</div>
  {/if}
</div>

<style>
  .items-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 8px;
    transition: background-color 0.15s ease;
  }

  .items-container.drag-over {
    background-color: var(--bauhaus-yellow);
    opacity: 0.5;
  }

  .collection-wrapper {
    display: flex;
    flex-direction: column;
  }

  .collection-header {
    background: none;
    border: 2px solid transparent;
    width: 100%;
    text-align: left;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.9rem;
    text-transform: lowercase;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 0;
    cursor: grab;
    color: var(--bauhaus-black);
    transition: border-color 0.15s ease, background-color 0.15s ease;
    user-select: none;
  }

  .collection-header:hover {
    color: var(--bauhaus-blue);
  }

  .collection-header:active {
    cursor: grabbing;
  }

  .collection-header.drag-over-collection {
    border-color: var(--bauhaus-blue);
    background-color: rgba(0, 86, 179, 0.08);
  }

  .collection-icon {
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .collection-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .collection-children {
    padding-left: 14px;
    border-left: 2px dashed var(--bauhaus-black);
    margin-left: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 2px;
    margin-bottom: 2px;
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

  .empty-text {
    font-family: var(--font-body);
    font-size: 0.8rem;
    color: #8A8A85;
    font-style: italic;
    padding: 4px;
    text-transform: lowercase;
  }
</style>
