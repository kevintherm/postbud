<script lang="ts">
  import { store } from './store.svelte';
  import { requestNav } from './navigation.svelte';
  import Select from './components/Select.svelte';
  import HistorySection from './components/HistorySection.svelte';
  import AuthSidebarFooter from './AuthSidebarFooter.svelte';
  import RequestContextMenu from './components/RequestContextMenu.svelte';
  import CollectionContextMenu from './components/CollectionContextMenu.svelte';
  import RenameRequestModal from './components/RenameRequestModal.svelte';
  import CollectionNode from './components/CollectionNode.svelte';
  import TopLevelRequests from './components/TopLevelRequests.svelte';
  import type { SidebarItem, CollectionItem, RequestItem } from './types';

  let workspaceExpanded = $state(true);

  type ActiveMenu =
    | { type: 'request'; x: number; y: number; id: string; name: string }
    | { type: 'collection'; x: number; y: number; id: string; name: string };

  let activeMenu = $state<ActiveMenu | null>(null);

  // ── Rename modal ──
  let renameTargetId = $state<string | null>(null);
  let renameTargetName = $state('');
  let renameMode: 'request' | 'collection' = $state('request');

  function toggleCollection(id: string) {
    requestNav.toggleCollection(id);
  }

  // ── Handlers ──

  function handleRequestContextMenu(e: MouseEvent, item: SidebarItem) {
    if (item.type !== 'request') return;
    e.preventDefault();
    e.stopPropagation();
    activeMenu = null;
    setTimeout(() => {
      activeMenu = {
        type: 'request',
        x: e.clientX,
        y: e.clientY,
        id: item.request.id,
        name: item.request.name
      };
    }, 0);
  }

  function handleCollectionContextMenu(e: MouseEvent, colId: string, colName: string) {
    e.preventDefault();
    e.stopPropagation();
    activeMenu = null;
    setTimeout(() => {
      activeMenu = {
        type: 'collection',
        x: e.clientX,
        y: e.clientY,
        id: colId,
        name: colName
      };
    }, 0);
  }

  function openRename(mode: 'request' | 'collection', id: string, name: string) {
    renameMode = mode;
    renameTargetId = id;
    renameTargetName = name;
  }

  function executeRename(newName: string) {
    if (!renameTargetId) return;
    if (renameMode === 'request') {
      store.renameRequest(renameTargetId, newName);
    } else if (renameMode === 'collection') {
      store.renameCollection(renameTargetId, newName);
    }
  }
</script>

<svelte:window onclick={() => activeMenu = null} onkeydown={(e) => { if (e.key === 'Escape') activeMenu = null; }} />

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
    <div class="section-wrapper {workspaceExpanded ? 'expanded' : 'collapsed'}">
      <div class="collections-header-row">
        <button
          type="button"
          class="collapsible-header workspace-header"
          onclick={() => workspaceExpanded = !workspaceExpanded}
        >
          <span>workspace</span>
          <span>{workspaceExpanded ? '▼' : '▶'}</span>
        </button>
        <button
          type="button"
          class="add-collection-btn"
          title="new request"
          onclick={() => store.addTopLevelReq()}
        >+req</button>
        <button
          type="button"
          class="add-collection-btn"
          title="new collection"
          onclick={() => {
            const name = prompt('collection name:');
            if (name) store.addCollection(name);
          }}
        >+col</button>
      </div>

      <div class="section-content">
        <!-- Top-level requests (not in any collection) -->
        <TopLevelRequests onrequestcontextmenu={handleRequestContextMenu} />

        <!-- Collections -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="collections-list" class:has-top-level={store.topLevelRequests.length > 0} oncontextmenu={(e) => e.preventDefault()}>
          {#each store.collections as col}
            <div class="collection-item-wrapper">
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="collection-header-row"
                oncontextmenu={(e) => handleCollectionContextMenu(e, col.id, col.name)}
              >
                <button
                  type="button"
                  class="collection-header"
                  data-collection-id={col.id}
                  data-collection-name={col.name}
                  onclick={() => toggleCollection(col.id)}
                >
                  <span class="collection-icon">{requestNav.isCollectionExpanded(col.id) ? '▼' : '▶'}</span>
                  <span class="collection-name">{col.name}</span>
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
                  title="add collection"
                  onclick={() => store.addSubCollection(col.id)}
                >+col</button>
              </div>

              {#if requestNav.isCollectionExpanded(col.id)}
                <div class="collection-contents">
                  <CollectionNode
                    items={col.items}
                    parentId={col.id}
                    onrequestcontextmenu={handleRequestContextMenu}
                    oncollectioncontextmenu={(e, nestedCol) => handleCollectionContextMenu(e, nestedCol.id, nestedCol.name)}
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
{#if activeMenu && activeMenu.type === 'request'}
  <RequestContextMenu
    x={activeMenu.x}
    y={activeMenu.y}
    onduplicate={() => store.duplicateRequest(activeMenu!.id)}
    onrename={() => openRename('request', activeMenu!.id, activeMenu!.name)}
    ondelete={() => {
      if (confirm(`delete request "${activeMenu!.name}"?`)) {
        store.deleteRequest(activeMenu!.id);
      }
    }}
    onclose={() => activeMenu = null}
  />
{/if}

<!-- Collection Context Menu -->
{#if activeMenu && activeMenu.type === 'collection'}
  <CollectionContextMenu
    x={activeMenu.x}
    y={activeMenu.y}
    onaddrequest={() => store.addRequest(activeMenu!.id)}
    onaddsubcollection={() => store.addSubCollection(activeMenu!.id)}
    onrename={() => openRename('collection', activeMenu!.id, activeMenu!.name)}
    ondelete={() => {
      if (confirm(`delete collection "${activeMenu!.name}"?`)) {
        store.deleteCollection(activeMenu!.id);
      }
    }}
    onclose={() => activeMenu = null}
  />
{/if}

<!-- Rename Modal -->
{#if renameTargetId}
  <RenameRequestModal
    title={renameMode === 'collection' ? 'rename collection' : 'rename request'}
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
  .workspace-header {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }
  .workspace-header:hover { background-color: #E0A500; }
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
  .collections-list.has-top-level { margin-top: 12px; }
  .collection-item-wrapper { margin-bottom: 8px; }
  .collection-header-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .collection-header {
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
  .collection-header:hover { color: var(--bauhaus-blue); }
  .collection-icon { font-size: 0.75rem; }
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
  .collection-contents {
    padding-left: 12px;
    border-left: 2px dashed var(--bauhaus-black);
    margin-left: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 2px;
  }


</style>
