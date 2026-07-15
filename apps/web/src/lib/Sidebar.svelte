<script lang="ts">
  import { store } from './store.svelte';
  import { requestNav } from './navigation.svelte';
  import Select from './components/Select.svelte';
  import HistorySection from './components/HistorySection.svelte';
  import AuthSidebarFooter from './AuthSidebarFooter.svelte';
  import RequestContextMenu from './components/RequestContextMenu.svelte';
  import FolderContextMenu from './components/FolderContextMenu.svelte';
  import RenameRequestModal from './components/RenameRequestModal.svelte';
  import CollectionFolder from './components/CollectionFolder.svelte';
  import type { SidebarItem, FolderItem, RequestItem } from './types';

  let collectionsExpanded = $state(true);

  // ── Request context menu ──
  let requestCtxVisible = $state(false);
  let requestCtxX = $state(0);
  let requestCtxY = $state(0);
  let requestCtxTargetId = $state('');
  let requestCtxTargetName = $state('');

  // ── Folder context menu ──
  let folderCtxVisible = $state(false);
  let folderCtxX = $state(0);
  let folderCtxY = $state(0);
  let folderCtxTargetId = $state('');
  let folderCtxTargetName = $state('');
  let folderCtxCollectionId = $state('');

  // ── Collection context menu ──
  let collectionCtxVisible = $state(false);
  let collectionCtxX = $state(0);
  let collectionCtxY = $state(0);
  let collectionCtxTargetId = $state('');
  let collectionCtxTargetName = $state('');

  // ── Rename modal ──
  let renameTargetId = $state<string | null>(null);
  let renameTargetName = $state('');
  let renameMode: 'request' | 'folder' | 'collection' = $state('request');

  function toggleCollection(id: string) {
    requestNav.expandedCollections[id] = !requestNav.expandedCollections[id];
  }

  // ── Handlers ──

  function handleRequestContextMenu(e: MouseEvent, item: SidebarItem) {
    if (item.type !== 'request') return;
    e.preventDefault();
    e.stopPropagation();
    requestCtxX = e.clientX;
    requestCtxY = e.clientY;
    requestCtxTargetId = item.request.id;
    requestCtxTargetName = item.request.name;
    requestCtxVisible = true;
  }

  function handleFolderContextMenu(e: MouseEvent, _folder: FolderItem, colId: string) {
    e.preventDefault();
    e.stopPropagation();
    folderCtxX = e.clientX;
    folderCtxY = e.clientY;
    folderCtxTargetId = _folder.id;
    folderCtxTargetName = _folder.name;
    folderCtxCollectionId = colId;
    folderCtxVisible = true;
  }

  function handleCollectionContextMenu(e: MouseEvent, colId: string, colName: string) {
    e.preventDefault();
    e.stopPropagation();
    collectionCtxX = e.clientX;
    collectionCtxY = e.clientY;
    collectionCtxTargetId = colId;
    collectionCtxTargetName = colName;
    collectionCtxVisible = true;
  }

  function openRename(mode: 'request' | 'folder' | 'collection', id: string, name: string) {
    renameMode = mode;
    renameTargetId = id;
    renameTargetName = name;
  }

  function executeRename(newName: string) {
    if (!renameTargetId) return;
    if (renameMode === 'request') {
      store.renameRequest(renameTargetId, newName);
    } else if (renameMode === 'folder') {
      store.renameFolder(renameTargetId, newName);
    } else if (renameMode === 'collection') {
      store.renameCollection(renameTargetId, newName);
    }
  }
</script>

<aside class="sidebar panel {store.sidebarCollapsed ? 'collapsed' : ''}">
  <div class="sidebar-header">
    <div class="env-row-header">
      <div class="env-section">
        <Select
          label="environment"
          options={store.environments.map(e => ({ value: e.id, label: e.name }))}
          bind:value={store.activeEnvironmentId}
        />
      </div>
      <button
        type="button"
        class="env-edit-btn"
        onclick={() => store.showEnvironmentsModal = true}
      >[edit]</button>
    </div>
  </div>

  <div class="sidebar-body">
    <div class="section-wrapper {collectionsExpanded ? 'expanded' : 'collapsed'}">
      <div class="collections-header-row">
        <button
          type="button"
          class="collapsible-header collections-header"
          onclick={() => collectionsExpanded = !collectionsExpanded}
        >
          <span>collections</span>
          <span>{collectionsExpanded ? '▼' : '▶'}</span>
        </button>
        <button
          type="button"
          class="add-collection-btn"
          title="new collection"
          onclick={() => {
            const name = prompt('collection name:');
            if (name) store.addCollection(name);
          }}
        >+</button>
      </div>

      <div class="section-content">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="collections-list" oncontextmenu={(e) => e.preventDefault()}>
          {#each store.collections as col}
            <div class="collection-folder">
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="collection-header-row"
                oncontextmenu={(e) => handleCollectionContextMenu(e, col.id, col.name)}
              >
                <button
                  type="button"
                  class="folder-header"
                  onclick={() => toggleCollection(col.id)}
                >
                  <span class="folder-icon">{requestNav.expandedCollections[col.id] ? '▼' : '▶'}</span>
                  <span class="folder-name">{col.name}</span>
                </button>
                <button
                  type="button"
                  class="collection-action-btn"
                  title="add request"
                  onclick={() => store.addRequest(col.id)}
                >+req</button>
                <button
                  type="button"
                  class="collection-action-btn"
                  title="add folder"
                  onclick={() => store.addFolder(col.id)}
                >+fld</button>
              </div>

              {#if requestNav.expandedCollections[col.id]}
                <div class="folder-contents">
                  <CollectionFolder
                    items={col.items}
                    collectionId={col.id}
                    isCollection={true}
                    collection={col}
                    onrequestcontextmenu={handleRequestContextMenu}
                    onfoldercontextmenu={handleFolderContextMenu}
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <HistorySection />
  </div>

  <AuthSidebarFooter />
</aside>

<!-- Request Context Menu -->
{#if requestCtxVisible}
  <RequestContextMenu
    x={requestCtxX}
    y={requestCtxY}
    onduplicate={() => store.duplicateRequest(requestCtxTargetId)}
    onrename={() => openRename('request', requestCtxTargetId, requestCtxTargetName)}
    ondelete={() => {
      if (confirm(`delete request "${requestCtxTargetName}"?`)) {
        store.deleteRequest(requestCtxTargetId);
      }
    }}
    onclose={() => requestCtxVisible = false}
  />
{/if}

<!-- Folder Context Menu -->
{#if folderCtxVisible}
  <FolderContextMenu
    x={folderCtxX}
    y={folderCtxY}
    onaddrequest={() => store.addRequest(folderCtxCollectionId, folderCtxTargetId)}
    onrename={() => openRename('folder', folderCtxTargetId, folderCtxTargetName)}
    ondelete={() => {
      if (confirm(`delete folder "${folderCtxTargetName}"?`)) {
        store.deleteFolder(folderCtxTargetId);
      }
    }}
    onclose={() => folderCtxVisible = false}
  />
{/if}

<!-- Collection Context Menu -->
{#if collectionCtxVisible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="context-menu"
    style="top: {collectionCtxY}px; left: {collectionCtxX}px;"
    onclick={(e) => e.stopPropagation()}
    oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    role="menu"
  >
    <button
      type="button" class="menu-item"
      onclick={() => { store.addRequest(collectionCtxTargetId); collectionCtxVisible = false; }}
    ><span class="label">add request</span></button>
    <button
      type="button" class="menu-item"
      onclick={() => { store.addFolder(collectionCtxTargetId); collectionCtxVisible = false; }}
    ><span class="label">add folder</span></button>
    <button
      type="button" class="menu-item"
      onclick={() => { openRename('collection', collectionCtxTargetId, collectionCtxTargetName); collectionCtxVisible = false; }}
    ><span class="label">rename collection</span></button>
    <button
      type="button" class="menu-item item-delete"
      onclick={() => {
        collectionCtxVisible = false;
        if (confirm(`delete collection "${collectionCtxTargetName}"?`)) {
          store.deleteCollection(collectionCtxTargetId);
        }
      }}
    ><span class="label text-delete">delete collection</span></button>
  </div>
{/if}

<!-- Rename Modal -->
{#if renameTargetId}
  <RenameRequestModal
    title={renameMode === 'folder' ? 'rename folder' : renameMode === 'collection' ? 'rename collection' : 'rename request'}
    initialName={renameTargetName}
    onsave={executeRename}
    onclose={() => { renameTargetId = null; }}
  />
{/if}

<style>
  .sidebar {
    background-color: var(--bauhaus-white);
    border-right: 2px solid var(--bauhaus-black);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    transition: border-right-color 0.2s ease;
  }

  .sidebar.collapsed {
    border-right-color: transparent;
  }

  .sidebar-header {
    padding: 16px;
    background-color: var(--bauhaus-white);
  }

  .env-row-header {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  .env-section { flex: 1; }

  .env-edit-btn {
    background: none;
    border: none;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--bauhaus-black);
    cursor: pointer;
    padding: 8px 0;
    text-transform: lowercase;
    text-decoration: underline;
    white-space: nowrap;
  }

  .env-edit-btn:hover { color: var(--bauhaus-blue); }

  .sidebar-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .section-wrapper {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .section-wrapper.expanded { flex: 1; }
  .section-wrapper.collapsed { flex: 0 0 auto; }

  .collections-header-row {
    display: flex;
    align-items: stretch;
  }

  .collapsible-header {
    border: none;
    border-top: 2px solid var(--bauhaus-black);
    border-bottom: 2px solid var(--bauhaus-black);
    padding: 10px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: lowercase;
    cursor: pointer;
    text-align: left;
    flex: 1;
  }

  .collections-header {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .collections-header:hover { background-color: #E0A500; }

  .add-collection-btn {
    border: none;
    border-top: 2px solid var(--bauhaus-black);
    border-bottom: 2px solid var(--bauhaus-black);
    border-left: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease;
  }

  .add-collection-btn:hover { background-color: var(--bauhaus-blue); color: var(--bauhaus-white); }

  .section-content {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    background-color: var(--bauhaus-white);
  }

  .section-wrapper.collapsed .section-content { display: none; }

  .collection-folder { margin-bottom: 8px; }

  .collection-header-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .folder-header {
    background: none;
    border: none;
    flex: 1;
    text-align: left;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: lowercase;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    cursor: pointer;
    color: var(--bauhaus-black);
  }

  .folder-header:hover { color: var(--bauhaus-blue); }

  .folder-icon { font-size: 0.75rem; }

  .collection-action-btn {
    background: none;
    border: 1px solid var(--bauhaus-black);
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 700;
    padding: 1px 4px;
    cursor: pointer;
    text-transform: lowercase;
    color: var(--bauhaus-black);
    transition: background-color 0.1s ease;
    flex-shrink: 0;
  }

  .collection-action-btn:hover {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
    border-color: var(--bauhaus-blue);
  }

  .folder-contents {
    padding-left: 12px;
    border-left: 2px dashed var(--bauhaus-black);
    margin-left: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 2px;
  }

  .context-menu {
    position: fixed;
    z-index: 1000;
    background-color: var(--bauhaus-white);
    border: 2px solid var(--bauhaus-black);
    width: 180px;
    display: flex;
    flex-direction: column;
  }

  .menu-item {
    background: none;
    border: none;
    border-bottom: 1px solid var(--bauhaus-black);
    padding: 8px 12px;
    text-align: left;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-transform: lowercase;
    transition: background-color 0.1s ease;
  }

  .menu-item:last-child { border-bottom: none; }
  .menu-item:hover { background-color: var(--bauhaus-yellow); color: var(--bauhaus-black); }
  .menu-item.item-delete:hover { background-color: var(--bauhaus-red); color: var(--bauhaus-white); }

  .label { flex: 1; }
  .menu-item.item-delete:hover .text-delete { color: var(--bauhaus-white); }
</style>
