<script lang="ts">
  import { store } from '../store.svelte';
  import { requestNav } from '../navigation.svelte';
  import type { SidebarItem, FolderItem } from '../types';
  import CollectionFolder from './CollectionFolder.svelte';

  let {
    items,
    collectionId,
    parentFolderId,
    onrequestcontextmenu = (_e: MouseEvent, _item: SidebarItem) => {},
    onfoldercontextmenu = (_e: MouseEvent, _folder: FolderItem, _colId: string) => {},
  }: {
    items: SidebarItem[];
    collectionId: string;
    parentFolderId?: string;
    onrequestcontextmenu?: (e: MouseEvent, item: SidebarItem) => void;
    onfoldercontextmenu?: (e: MouseEvent, folder: FolderItem, collectionId: string) => void;
  } = $props();

  let dragOverItemId = $state<string | null>(null);
  let dragOverType: 'folder' | 'container' | null = $state(null);

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
    const id = item.type === 'request' ? item.request.id : item.folder.id;
    e.dataTransfer?.setData('text/plain', JSON.stringify({ itemId: id, type: item.type, collectionId }));
    e.dataTransfer!.effectAllowed = 'move';
  }

  function handleContainerDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }

  function handleFolderDragOver(e: DragEvent, folder: FolderItem) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer!.dropEffect = 'move';
    dragOverItemId = folder.id;
    dragOverType = 'folder';
  }

  function handleFolderDragLeave() {
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
    // Don't move if same location
    if (data.collectionId === collectionId && !parentFolderId) return;
    store.moveItem(data.itemId, collectionId, parentFolderId);
  }

  function handleFolderDrop(e: DragEvent, folder: FolderItem) {
    e.preventDefault();
    e.stopPropagation();
    dragOverItemId = null;
    dragOverType = null;
    const raw = e.dataTransfer?.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.itemId === folder.id) return;
    store.moveItem(data.itemId, collectionId, folder.id);
  }

  function handleItemDragEnd() {
    dragOverItemId = null;
    dragOverType = null;
  }

  function toggleFolderExpand(folderId: string) {
    requestNav.toggleFolder(folderId);
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
  {#each items as item (item.type === 'request' ? item.request.id : item.folder.id)}
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
    {:else if item.type === 'folder'}
      <div class="folder-wrapper">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_role_has_required_aria_props -->
        <div
          class="folder-header"
          class:drag-over-folder={dragOverItemId === item.folder.id && dragOverType === 'folder'}
          data-folder-id={item.folder.id}
          data-folder-name={item.folder.name}
          draggable="true"
          tabindex="0"
          role="treeitem"
          ondragstart={(e) => handleItemDragStart(e, item)}
          ondragover={(e) => handleFolderDragOver(e, item.folder)}
          ondragleave={handleFolderDragLeave}
          ondrop={(e) => handleFolderDrop(e, item.folder)}
          ondragend={handleItemDragEnd}
          onclick={() => toggleFolderExpand(item.folder.id)}
          oncontextmenu={(e) => onfoldercontextmenu(e, item.folder, collectionId)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFolderExpand(item.folder.id); }}
        >
          <span class="folder-icon">
            {requestNav.isFolderExpanded(item.folder.id) ? '▼' : '▶'}
          </span>
          <span class="folder-name">{item.folder.name}</span>
        </div>

        {#if requestNav.isFolderExpanded(item.folder.id)}
          <div class="folder-children">
            <CollectionFolder
              items={item.folder.items}
              collectionId={collectionId}
              parentFolderId={item.folder.id}
              {onrequestcontextmenu}
              {onfoldercontextmenu}
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

  .folder-wrapper {
    display: flex;
    flex-direction: column;
  }

  .folder-header {
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

  .folder-header:hover {
    color: var(--bauhaus-blue);
  }

  .folder-header:active {
    cursor: grabbing;
  }

  .folder-header.drag-over-folder {
    border-color: var(--bauhaus-blue);
    background-color: rgba(0, 86, 179, 0.08);
  }

  .folder-icon {
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .folder-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folder-children {
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
