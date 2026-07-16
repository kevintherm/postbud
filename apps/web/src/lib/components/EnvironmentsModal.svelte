<script lang="ts">
  import { store } from '../store.svelte';
  import Input from './Input.svelte';
  import Button from './Button.svelte';

  let selectedEnvId = $state<string>(store.activeEnvironmentId);

  // Resolve current environment to edit
  let selectedEnv = $derived(
    store.environments.find(e => e.id === selectedEnvId) || store.environments[0]
  );

  function handleAdd() {
    store.addEnv('new env');
    // Select the newly added environment
    const newEnv = store.environments[store.environments.length - 1];
    if (newEnv) {
      selectedEnvId = newEnv.id;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      store.showEnvironmentsModal = false;
    }
  }

  function handleDeleteEnv(id: string, event: Event) {
    event.stopPropagation();
    store.delEnv(id);
    if (selectedEnvId === id) {
      selectedEnvId = store.environments[0]?.id || '';
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop">
  <div class="modal-card bauhaus-card">
    <div class="modal-header-accent"></div>
    
    <div class="modal-content-split">
      <!-- Left Column: Environment list -->
      <div class="env-sidebar">
        <div class="sidebar-header">
          <span class="label-text">environments</span>
        </div>
        <div class="env-tabs">
          {#each store.environments as env}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="env-tab-btn {env.id === selectedEnv.id ? 'active' : ''}"
              onclick={() => selectedEnvId = env.id}
            >
              <span class="env-name-text">{env.name.toLowerCase()}</span>
              {#if store.environments.length > 1}
                <button
                  type="button"
                  class="delete-tab-btn"
                  onclick={(e) => handleDeleteEnv(env.id, e)}
                  title="delete environment"
                >
                  ✕
                </button>
              {/if}
            </div>
          {/each}
        </div>
        <div class="sidebar-footer">
          <Button variant="yellow" size="sm" onclick={handleAdd} class="w-full">
            + new environment
          </Button>
        </div>
      </div>

      <!-- Right Column: Variables editor -->
      <div class="env-variables-editor">
        {#if selectedEnv}
          <div class="editor-header">
            <Input
              label="environment name"
              bind:value={selectedEnv.name}
              placeholder="e.g. production"
            />
          </div>
          
          <div class="variables-section">
            <span class="label-text">variables</span>
            
            <div class="variables-grid">
              <div class="grid-header font-display">
                <div class="col-active">active</div>
                <div class="col-key">key</div>
                <div class="col-value">value</div>
                <div class="col-actions"></div>
              </div>
              
              <div class="grid-rows">
                {#each selectedEnv.variables as variable}
                  <div class="grid-row">
                    <div class="col-active">
                      <input 
                        type="checkbox" 
                        bind:checked={variable.enabled} 
                        class="bauhaus-checkbox" 
                      />
                    </div>
                    <div class="col-key">
                      <input
                        type="text"
                        bind:value={variable.key}
                        placeholder="key (e.g. base_url)"
                        class="grid-input"
                      />
                    </div>
                    <div class="col-value">
                      <input
                        type="text"
                        bind:value={variable.value}
                        placeholder="value"
                        class="grid-input"
                      />
                    </div>
                    <div class="col-actions">
                      <button
                        type="button"
                        class="var-delete-btn"
                        onclick={() => store.delVar(selectedEnv.id, variable.id)}
                        title="delete variable"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="empty-variables font-body">
                    no variables defined. use the button below to add one.
                  </div>
                {/each}
              </div>
            </div>
            
            <div class="editor-footer">
              <Button variant="yellow" size="sm" onclick={() => store.addVar(selectedEnv.id)}>
                + add variable
              </Button>
            </div>
          </div>
        {:else}
          <div class="no-selected-env font-body">
            select or create an environment to configure variables.
          </div>
        {/if}
      </div>
    </div>

    <!-- Modal actions footer -->
    <div class="modal-footer">
      <Button variant="primary" onclick={() => store.showEnvironmentsModal = false}>
        close
      </Button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(17, 17, 17, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .modal-card {
    width: 100%;
    max-width: 800px;
    height: 600px;
    background-color: var(--bauhaus-white);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header-accent {
    height: 8px;
    background-color: var(--bauhaus-red);
    border-bottom: 2px solid var(--bauhaus-black);
  }

  .modal-content-split {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Left Sidebar Styling */
  .env-sidebar {
    width: 220px;
    border-right: 2px solid var(--bauhaus-black);
    display: flex;
    flex-direction: column;
    background-color: var(--bauhaus-grid-bg);
  }

  .sidebar-header {
    padding: 12px 16px;
    border-bottom: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-white);
  }

  .label-text {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: lowercase;
    color: var(--bauhaus-black);
  }

  .env-tabs {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .env-tab-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-bottom: 2px solid var(--bauhaus-black);
    background-color: transparent;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.1s ease;
  }

  .env-tab-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .env-tab-btn.active {
    background-color: var(--bauhaus-white);
    border-right: none;
    font-weight: 700;
    position: relative;
  }

  .env-tab-btn.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    background-color: var(--bauhaus-blue);
  }

  .env-name-text {
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: var(--bauhaus-black);
  }

  .delete-tab-btn {
    border: none;
    background: transparent;
    color: var(--bauhaus-red);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 2px 6px;
  }

  .delete-tab-btn:hover {
    background-color: rgba(219, 58, 52, 0.1);
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-white);
  }


  /* Right Variables Editor Styling */
  .env-variables-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow-y: auto;
    background-color: var(--bauhaus-white);
  }

  .editor-header {
    margin-bottom: 20px;
  }

  .variables-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 8px;
  }

  .variables-grid {
    border: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-grid-bg);
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 200px;
  }

  .grid-header {
    display: grid;
    grid-template-columns: 70px 1.2fr 1.8fr 50px;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-white);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: lowercase;
  }

  .grid-rows {
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .grid-row {
    display: grid;
    grid-template-columns: 70px 1.2fr 1.8fr 50px;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 2px solid var(--bauhaus-black);
    align-items: center;
    background-color: var(--bauhaus-white);
  }

  .grid-row:last-child {
    border-bottom: none;
  }

  .col-active {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bauhaus-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--bauhaus-black);
    cursor: pointer;
    accent-color: var(--bauhaus-blue);
    appearance: auto;
  }

  .grid-input {
    width: 100%;
    border: 2px solid var(--bauhaus-black);
    padding: 6px 10px;
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
    font-family: var(--font-body);
    font-size: 0.9rem;
    outline: none;
  }

  .grid-input:focus {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-blue);
  }

  .col-actions {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .var-delete-btn {
    border: none;
    background: transparent;
    color: var(--bauhaus-red);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: bold;
    padding: 4px 8px;
  }

  .var-delete-btn:hover {
    background-color: rgba(219, 58, 52, 0.1);
  }

  .empty-variables {
    padding: 24px;
    text-align: center;
    color: #8A8A85;
    font-size: 0.95rem;
  }

  .editor-footer {
    margin-top: 12px;
  }

  .no-selected-env {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #8A8A85;
  }

  /* Modal Footer */
  .modal-footer {
    padding: 12px 24px;
    border-top: 2px solid var(--bauhaus-black);
    display: flex;
    justify-content: flex-end;
    background-color: var(--bauhaus-grid-bg);
  }
</style>
