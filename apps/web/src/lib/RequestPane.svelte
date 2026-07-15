<script lang="ts">
  import { store } from './store.svelte';
  import Select from './components/Select.svelte';
  import Input from './components/Input.svelte';
  import Button from './components/Button.svelte';
  import JsonEditor from './components/JsonEditor.svelte';

  let activeTab = $state<'params' | 'headers' | 'body'>('params');

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  const bodyTypes = [
    { value: 'none', label: 'no body' },
    { value: 'json', label: 'json' },
    { value: 'raw', label: 'raw text' }
  ];
</script>

<div class="request-pane panel">
  <!-- URL and Send Bar -->
  <div class="action-bar">
    <div class="mode-select">
      <Select
        options={[
          { value: 'static', label: 'static' },
          { value: 'proxy', label: 'proxy' }
        ]}
        bind:value={store.routingMode}
      />
    </div>

    <div class="method-select">
      <Select
        options={methods}
        bind:value={store.activeRequest.method}
      />
    </div>

    <div class="url-input">
      <Input
        placeholder="/api/v1/resource"
        bind:value={store.activeRequest.url}
      />
    </div>

    <div class="send-btn">
      <Button
        variant="primary"
        disabled={store.responseState.loading}
        onclick={() => store.sendRequest()}
      >
        {#if store.responseState.loading}
          sending...
        {:else}
          send
        {/if}
      </Button>
    </div>
  </div>

  <!-- Tab selectors -->
  <div class="tabs-container">
    <button
      type="button"
      class="tab-btn {activeTab === 'params' ? 'active active-params' : ''}"
      onclick={() => activeTab = 'params'}
    >
      query params ({store.activeRequest.queryParams.length})
    </button>
    <button
      type="button"
      class="tab-btn {activeTab === 'headers' ? 'active active-headers' : ''}"
      onclick={() => activeTab = 'headers'}
    >
      headers ({store.activeRequest.headers.length})
    </button>
    <button
      type="button"
      class="tab-btn {activeTab === 'body' ? 'active active-body' : ''}"
      onclick={() => activeTab = 'body'}
    >
      body ({store.activeRequest.bodyType})
    </button>
  </div>

  <div class="accent-line-blue"></div>

  <!-- Tab Contents -->
  <div class="tab-content">
    {#if activeTab === 'params'}
      <div class="params-editor">
        <div class="editor-header">
          <span class="label-text">query parameters</span>
          <Button variant="outline" size="sm" onclick={() => store.addField('queryParams')}>
            + add param
          </Button>
        </div>

        <div class="fields-list">
          {#if store.activeRequest.queryParams.length === 0}
            <div class="empty-fields">no query parameters defined</div>
          {/if}

          {#each store.activeRequest.queryParams as param (param.id)}
            <div class="field-row">
              <input
                type="checkbox"
                bind:checked={param.enabled}
                class="field-checkbox"
              />
              <div class="field-key">
                <Input placeholder="key" bind:value={param.key} />
              </div>
              <div class="field-value">
                <Input placeholder="value" bind:value={param.value} />
              </div>
              <Button
                variant="outline"
                size="sm"
                class="remove-btn"
                onclick={() => store.removeField('queryParams', param.id)}
              >
                ✕
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if activeTab === 'headers'}
      <div class="headers-editor">
        <div class="editor-header">
          <span class="label-text">request headers</span>
          <Button variant="outline" size="sm" onclick={() => store.addField('headers')}>
            + add header
          </Button>
        </div>

        <div class="fields-list">
          {#if store.activeRequest.headers.length === 0}
            <div class="empty-fields">no request headers defined</div>
          {/if}

          {#each store.activeRequest.headers as header (header.id)}
            <div class="field-row">
              <input
                type="checkbox"
                bind:checked={header.enabled}
                class="field-checkbox"
              />
              <div class="field-key">
                <Input placeholder="key" bind:value={header.key} />
              </div>
              <div class="field-value">
                <Input placeholder="value" bind:value={header.value} />
              </div>
              <Button
                variant="outline"
                size="sm"
                class="remove-btn"
                onclick={() => store.removeField('headers', header.id)}
              >
                ✕
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if activeTab === 'body'}
      <div class="body-editor">
        <div class="body-type-selector">
          <Select
            label="body format"
            options={bodyTypes}
            bind:value={store.activeRequest.bodyType}
          />
        </div>

        {#if store.activeRequest.bodyType === 'json'}
          <div class="body-editor-container">
            <JsonEditor bind:value={store.activeRequest.body} />
          </div>
        {:else if store.activeRequest.bodyType === 'raw'}
          <div class="body-textarea-container">
            <Input
              type="textarea"
              placeholder="raw text content"
              rows={12}
              bind:value={store.activeRequest.body}
            />
          </div>
        {:else}
          <div class="empty-body-placeholder">
            <div class="graphic-circle"></div>
            <p class="label-text">this request has no body payload</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .request-pane {
    background-color: var(--bauhaus-white);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .action-bar {
    display: flex;
    padding: 16px 16px 16px 36px;
    gap: 12px;
    align-items: flex-end;
  }

  .mode-select {
    width: 100px;
  }

  .method-select {
    width: 110px;
  }

  .url-input {
    flex: 1;
  }

  .send-btn {
    width: 120px;
  }

  /* Tabs styling */
  .tabs-container {
    display: flex;
    border-top: 2px solid var(--bauhaus-black);
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

  .tab-btn.active-params {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }

  .tab-btn.active-headers {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .tab-btn.active-body {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }

  .tab-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .fields-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .field-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--bauhaus-black);
    border: 2px solid var(--bauhaus-black);
    cursor: pointer;
  }

  .field-key, .field-value {
    flex: 1;
  }

  :global(.remove-btn) {
    height: 38px;
    width: 38px;
    padding: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-fields {
    padding: 20px;
    text-align: center;
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: #8A8A85;
    border: 2px dashed var(--bauhaus-black);
    text-transform: lowercase;
  }

  .body-type-selector {
    max-width: 200px;
    margin-bottom: 16px;
  }

  .body-textarea-container {
    border: 2px solid var(--bauhaus-black);
    background: var(--bauhaus-white);
  }

  .empty-body-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 16px;
    border: 2px dashed var(--bauhaus-black);
  }

  .graphic-circle {
    width: 60px;
    height: 60px;
    background-color: var(--bauhaus-red);
    border: 2px solid var(--bauhaus-black);
    border-radius: 50%;
  }
</style>
