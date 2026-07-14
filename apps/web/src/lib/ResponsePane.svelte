<script lang="ts">
  import { store } from './store.svelte';
  import Button from './components/Button.svelte';

  let activeTab = $state<'body' | 'headers'>('body');

  function getStatusColorClass(status: number): string {
    if (status >= 500) return 'status-500';
    if (status >= 400) return 'status-400';
    return 'status-200';
  }

  function copyToClipboard(text: string | null) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('response body copied to clipboard');
  }
</script>

<div class="response-pane panel">
  {#if store.responseState.loading}
    <!-- Loading State -->
    <div class="loading-state">
      <div class="spinner-container">
        <div class="bauhaus-spinner"></div>
      </div>
      <p class="label-text">executing request...</p>
    </div>
  {:else}
    {@const state = store.responseState}
    
    {#if state.status === null}
      <!-- Empty State with Bauhaus Abstract Art -->
      <div class="empty-state">
        <div class="abstract-composition">
          <div class="shape-circle-yellow"></div>
          <div class="shape-rect-blue"></div>
          <div class="shape-triangle-red"></div>
          <div class="shape-line-black"></div>
        </div>
        <div class="empty-text-container">
          <h3 class="empty-title">postbud api client</h3>
          <p class="label-text">send a request to view response details</p>
        </div>
      </div>
    {:else}
      <!-- Response Content -->
      <!-- Status & Stats Bar -->
      <div class="response-stats-bar">
        <div class="stat-box status-code {getStatusColorClass(state.status || 0)}">
          <span class="label">status:</span>
          <span class="val">{state.status} {state.statusText?.toLowerCase()}</span>
        </div>

        <div class="stat-box">
          <span class="label">time:</span>
          <span class="val">{state.time}ms</span>
        </div>

        <div class="stat-box">
          <span class="label">size:</span>
          <span class="val">{state.size}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button
          type="button"
          class="tab-btn {activeTab === 'body' ? 'active active-body' : ''}"
          onclick={() => activeTab = 'body'}
        >
          response body
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'headers' ? 'active active-headers' : ''}"
          onclick={() => activeTab = 'headers'}
        >
          headers ({state.headers.length})
        </button>
      </div>

      <div class="accent-line-yellow"></div>

      <!-- Tab Contents -->
      <div class="response-content-area">
        {#if activeTab === 'body'}
          <div class="body-viewer">
            <div class="body-header">
              <span class="label-text">json output</span>
              <Button variant="outline" size="sm" onclick={() => copyToClipboard(state.body)}>
                copy
              </Button>
            </div>
            <pre class="body-code"><code>{state.body}</code></pre>
          </div>
        {/if}

        {#if activeTab === 'headers'}
          <div class="headers-viewer">
            <table class="headers-table">
              <thead>
                <tr>
                  <th>header key</th>
                  <th>value</th>
                </tr>
              </thead>
              <tbody>
                {#each state.headers as header}
                  <tr>
                    <td class="header-key">{header.key.toLowerCase()}</td>
                    <td class="header-value">{header.value}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .response-pane {
    background-color: var(--bauhaus-white);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Empty state */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 32px;
  }

  .abstract-composition {
    position: relative;
    width: 220px;
    height: 220px;
    background-color: var(--bauhaus-grid-bg);
    border: 3px solid var(--bauhaus-black);
    overflow: hidden;
    cursor: pointer;
    background-image: 
      linear-gradient(rgba(17, 17, 17, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(17, 17, 17, 0.05) 1px, transparent 1px);
    background-size: 16px 16px;
  }

  .shape-circle-yellow {
    position: absolute;
    width: 90px;
    height: 90px;
    background-color: var(--bauhaus-yellow);
    border-radius: 50%;
    top: 25px;
    left: 25px;
    border: 2px solid var(--bauhaus-black);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .abstract-composition:hover .shape-circle-yellow {
    transform: scale(1.15) translate(4px, 4px);
  }

  .shape-rect-blue {
    position: absolute;
    width: 80px;
    height: 80px;
    background-color: var(--bauhaus-blue);
    bottom: 25px;
    right: 25px;
    border: 2px solid var(--bauhaus-black);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .abstract-composition:hover .shape-rect-blue {
    transform: rotate(15deg) translate(-4px, -4px);
  }

  .shape-triangle-red {
    position: absolute;
    width: 0;
    height: 0;
    border-left: 45px solid transparent;
    border-right: 45px solid transparent;
    border-bottom: 78px solid var(--bauhaus-red);
    border-top: none;
    background: none;
    top: 55px;
    left: 65px;
    transform: rotate(15deg);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .abstract-composition:hover .shape-triangle-red {
    transform: rotate(55deg) scale(1.15);
  }

  .shape-line-black {
    position: absolute;
    width: 320px;
    height: 8px;
    background-color: var(--bauhaus-black);
    top: 50px;
    left: -40px;
    transform: rotate(-30deg);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .abstract-composition:hover .shape-line-black {
    transform: rotate(-35deg) scaleX(1.05);
  }

  .empty-text-container {
    text-align: center;
  }

  .empty-title {
    font-size: 1.4rem;
    margin-bottom: 8px;
  }

  /* Loading State */
  .loading-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .spinner-container {
    padding: 20px;
  }

  .bauhaus-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--bauhaus-black);
    border-top: 4px solid var(--bauhaus-red);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Stats Bar */
  .response-stats-bar {
    display: flex;
    padding: 16px;
    gap: 12px;
    border-bottom: 2px solid var(--bauhaus-black);
    flex-wrap: wrap;
  }

  .stat-box {
    border: 2px solid var(--bauhaus-black);
    display: flex;
    align-items: center;
    padding: 6px 12px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.85rem;
    background-color: var(--bauhaus-grid-bg);
  }

  .stat-box .label {
    text-transform: lowercase;
    margin-right: 6px;
    color: #555;
  }

  .stat-box .val {
    text-transform: lowercase;
  }

  .status-code {
    color: var(--bauhaus-white);
  }

  .status-200 {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }
  .status-200 .label {
    color: rgba(255, 255, 255, 0.8);
  }

  .status-400 {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }
  .status-400 .label {
    color: rgba(17, 17, 17, 0.6);
  }

  .status-500 {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }
  .status-500 .label {
    color: rgba(255, 255, 255, 0.8);
  }

  /* Tabs styling */
  .tabs-container {
    display: flex;
    background-color: var(--bauhaus-grid-bg);
  }

  .tab-btn {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.85rem;
    text-transform: lowercase;
    background: none;
    border: none;
    border-right: 2px solid var(--bauhaus-black);
    padding: 10px 20px;
    cursor: pointer;
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  .tab-btn:hover {
    background-color: rgba(17, 17, 17, 0.05);
  }

  .tab-btn.active {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }

  .tab-btn.active-body {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }

  .tab-btn.active-headers {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  /* Content area */
  .response-content-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: var(--bauhaus-white);
  }

  .body-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .body-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .body-code {
    flex: 1;
    border: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-grid-bg);
    padding: 12px;
    font-family: monospace;
    font-size: 0.85rem;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Headers Table */
  .headers-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-body);
    font-size: 0.9rem;
    border: 2px solid var(--bauhaus-black);
  }

  .headers-table th, .headers-table td {
    border: 1px solid var(--bauhaus-black);
    padding: 8px 12px;
    text-align: left;
  }

  .headers-table th {
    background-color: var(--bauhaus-grid-bg);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: lowercase;
  }

  .header-key {
    font-weight: bold;
    color: var(--bauhaus-black);
  }

  .header-value {
    color: #444;
  }
</style>
