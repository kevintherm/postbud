<script lang="ts">
  import { store } from '../store.svelte';

  let historyExpanded = $state(true);

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

<div class="section-wrapper {historyExpanded ? 'expanded' : 'collapsed'}">
  <div class="collapsible-header history-header-wrapper">
    <button 
      type="button" 
      class="history-toggle-btn" 
      onclick={() => historyExpanded = !historyExpanded}
    >
      <span>history {historyExpanded ? '▼' : '▶'}</span>
    </button>
    {#if historyExpanded && store.history.length > 0}
      <button 
        type="button" 
        class="history-clear-btn" 
        onclick={(e) => { e.stopPropagation(); store.clearHistory(); }}
      >
        clear
      </button>
    {/if}
  </div>

  <div class="section-content">
    <div class="history-list">
      {#if store.history.length === 0}
        <div class="empty-text">no history logs</div>
      {/if}
      {#each store.history as log}
        <button
          type="button"
          class="history-item"
          onclick={() => store.loadHistoryItem(log)}
        >
          <div class="history-row-top">
            <span class="method-badge {getMethodColorClass(log.method)}">{log.method}</span>
            <span class="history-url">{log.url}</span>
          </div>
          <div class="history-row-bottom">
            <span class="status-pill status-{log.status >= 500 ? 'red' : log.status >= 400 ? 'yellow' : 'blue'}">
              {log.status}
            </span>
            <span class="history-time">{log.time}ms</span>
            <span class="history-timestamp">{log.timestamp}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
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

  .history-header-wrapper {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .history-toggle-btn {
    background: none;
    border: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    color: inherit;
    text-transform: inherit;
    cursor: pointer;
    text-align: left;
  }

  .history-clear-btn {
    background-color: var(--bauhaus-white);
    border: 2px solid var(--bauhaus-black);
    color: var(--bauhaus-black);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.75rem;
    padding: 2px 8px;
    cursor: pointer;
    text-transform: lowercase;
    margin-left: 12px;
    white-space: nowrap;
  }

  .history-clear-btn:hover {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
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

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-item {
    background: var(--bauhaus-white);
    border: 2px solid var(--bauhaus-black);
    padding: 8px;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .history-item:hover {
    background-color: var(--bauhaus-grid-bg);
  }

  .history-row-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .history-url {
    font-family: var(--font-body);
    font-size: 0.8rem;
    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-transform: lowercase;
    flex: 1;
  }

  .history-row-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    font-family: var(--font-display);
    font-weight: 700;
  }

  .status-pill {
    padding: 1px 6px;
    border: 1px solid var(--bauhaus-black);
    font-weight: bold;
  }

  .status-blue {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }

  .status-yellow {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .status-red {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }

  .history-time {
    color: #555;
    font-family: var(--font-body);
  }

  .history-timestamp {
    color: #8A8A85;
    font-family: var(--font-body);
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
