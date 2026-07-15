<script lang="ts">
  import { store } from './store.svelte';
  import Select from './components/Select.svelte';
  import HistorySection from './components/HistorySection.svelte';
  import AuthSidebarFooter from './AuthSidebarFooter.svelte';
  import RequestContextMenu from './components/RequestContextMenu.svelte';
  import RenameRequestModal from './components/RenameRequestModal.svelte';
  import type { RequestItem } from './types';

  // Section expansion states
  let collectionsExpanded = $state(true);

  // State to track which collections are collapsed/expanded
  let expandedCollections = $state<Record<string, boolean>>({
    'col-auth': true,
    'col-users': true,
    'col-debug': true
  });

  // Context Menu state
  let contextMenuVisible = $state(false);
  let contextMenuX = $state(0);
  let contextMenuY = $state(0);
  let contextMenuTargetId = $state('');
  let contextMenuTargetName = $state('');
  let showRenameModal = $state(false);

  function toggleCollection(id: string) {
    expandedCollections[id] = !expandedCollections[id];
  }

  function handleRequestContextMenu(e: MouseEvent, req: RequestItem) {
    e.preventDefault();
    e.stopPropagation();
    contextMenuX = e.clientX;
    contextMenuY = e.clientY;
    contextMenuTargetId = req.id;
    contextMenuTargetName = req.name;
    contextMenuVisible = true;
  }

  // Helper to color code HTTP methods in Bauhaus style
  function getMethodColorClass(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return 'badge-get';
      case 'POST': return 'badge-post';
      case 'PUT': return 'badge-put';
      case 'DELETE': return 'badge-delete';
      default: return 'badge-other';
    }
  }
</script>

<aside class="sidebar panel {store.sidebarCollapsed ? 'collapsed' : ''}">
  <!-- Top Environment selector (without Sync status bar) -->
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
      >
        [edit]
      </button>
    </div>
  </div>

  <!-- Collapsible Content Wrapper -->
  <div class="sidebar-body">
    <!-- Collections Section -->
    <div class="section-wrapper {collectionsExpanded ? 'expanded' : 'collapsed'}">
      <button 
        type="button" 
        class="collapsible-header collections-header" 
        onclick={() => collectionsExpanded = !collectionsExpanded}
      >
        <span>collections</span>
        <span>{collectionsExpanded ? '▼' : '▶'}</span>
      </button>
      
      <div class="section-content">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="collections-list" oncontextmenu={(e) => e.preventDefault()}>
          {#each store.collections as col}
            <div class="collection-folder">
              <button 
                type="button" 
                class="folder-header" 
                onclick={() => toggleCollection(col.id)}
              >
                <span class="folder-icon">{expandedCollections[col.id] ? '▼' : '▶'}</span>
                <span class="folder-name">{col.name}</span>
              </button>
              
              {#if expandedCollections[col.id]}
                <div class="folder-contents">
                  {#if col.requests.length === 0}
                    <div class="empty-text">no requests</div>
                  {/if}
                  {#each col.requests as req}
                    <button
                      type="button"
                      class="request-item {store.activeRequest.id === req.id ? 'active' : ''}"
                      onclick={() => store.loadRequest(req)}
                      oncontextmenu={(e) => handleRequestContextMenu(e, req)}
                    >
                      <span class="method-badge {getMethodColorClass(req.method)}">{req.method}</span>
                      <span class="request-name">{req.name}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- History Section -->
    <HistorySection />
  </div>

  <!-- Auth Footer -->
  <AuthSidebarFooter />
</aside>

{#if contextMenuVisible}
  <RequestContextMenu
    x={contextMenuX}
    y={contextMenuY}
    onduplicate={() => store.duplicateRequest(contextMenuTargetId)}
    onrename={() => showRenameModal = true}
    ondelete={() => {
      if (confirm(`delete request "${contextMenuTargetName}"?`)) {
        store.deleteRequest(contextMenuTargetId);
      }
    }}
    onclose={() => contextMenuVisible = false}
  />
{/if}

{#if showRenameModal}
  <RenameRequestModal
    requestId={contextMenuTargetId}
    initialName={contextMenuTargetName}
    onclose={() => showRenameModal = false}
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

  .env-section {
    flex: 1;
  }

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

  .env-edit-btn:hover {
    color: var(--bauhaus-blue);
  }

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

  .section-wrapper.expanded {
    flex: 1;
  }

  .section-wrapper.collapsed {
    flex: 0 0 auto;
  }

  /* Collapsible Header Styling */
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
  }

  .collections-header {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .collections-header:hover {
    background-color: #E0A500;
  }



  .section-content {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    background-color: var(--bauhaus-white);
  }

  .section-wrapper.collapsed .section-content {
    display: none;
  }

  .collection-folder {
    margin-bottom: 8px;
  }

  .folder-header {
    background: none;
    border: none;
    width: 100%;
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

  .folder-header:hover {
    color: var(--bauhaus-blue);
  }

  .folder-icon {
    font-size: 0.75rem;
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

  .request-item {
    background: none;
    border: 2px solid transparent;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.85rem;
  }

  .request-item:hover {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-black);
  }

  .request-item.active {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-black);
    font-weight: 700;
  }

  /* HTTP Badges */
  .method-badge {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.65rem;
    padding: 2px 4px;
    border: 1px solid var(--bauhaus-black);
    min-width: 48px;
    text-align: center;
  }

  .badge-get {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }

  .badge-post {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .badge-put {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }

  .badge-delete {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }

  .badge-other {
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
  }

  .empty-text {
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: #8A8A85;
    font-style: italic;
    padding: 4px;
    text-transform: lowercase;
  }


</style>
