<script lang="ts">
  import { store } from '../store.svelte';
  import { simulateRequest } from '../mockEngine';
  import Input from './Input.svelte';
  import Button from './Button.svelte';

  let activeTab = $state<'login' | 'register'>(store.showAuthModal || 'login');
  let email = $state('');
  let username = $state('');
  let password = $state('');
  let errorMessage = $state('');
  let isLoading = $state(false);

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      store.showAuthModal = null;
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = '';

    if (!email || !password || (activeTab === 'register' && !username)) {
      errorMessage = 'please fill in all fields';
      return;
    }

    isLoading = true;

    // Simulate short network latency
    setTimeout(() => {
      try {
        if (activeTab === 'login') {
          const response = simulateRequest(
            'POST',
            '/api/v1/login',
            JSON.stringify({ email, password }),
            [],
            [],
            'local'
          );

          if (response.status === 200) {
            const data = JSON.parse(response.body);
            store.login(data.user, data.token);
          } else {
            const data = JSON.parse(response.body);
            errorMessage = data.message || 'invalid email or password';
          }
        } else {
          const response = simulateRequest(
            'POST',
            '/api/v1/register',
            JSON.stringify({ username, email, password }),
            [],
            [],
            'local'
          );

          if (response.status === 201) {
            const data = JSON.parse(response.body);
            store.register(data.user, data.token);
          } else {
            const data = JSON.parse(response.body);
            errorMessage = data.message || 'registration failed';
          }
        }
      } catch (err) {
        errorMessage = 'an unexpected error occurred';
      } finally {
        isLoading = false;
      }
    }, 600);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <form 
    class="modal-card bauhaus-card" 
    onsubmit={handleSubmit}
    onclick={(e) => e.stopPropagation()}
  >
    <div class="modal-header-accent"></div>
    
    <div class="modal-body">
      <!-- Tabs header -->
      <div class="tabs-header">
        <button
          type="button"
          class="tab-btn {activeTab === 'login' ? 'active' : ''}"
          onclick={() => { activeTab = 'login'; errorMessage = ''; }}
        >
          login
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'register' ? 'active' : ''}"
          onclick={() => { activeTab = 'register'; errorMessage = ''; }}
        >
          register
        </button>
      </div>

      <div class="form-content">
        {#if errorMessage}
          <div class="error-banner">
            <span class="error-dot"></span>
            <span class="error-text">{errorMessage.toLowerCase()}</span>
          </div>
        {/if}

        {#if activeTab === 'register'}
          <div class="field-wrapper">
            <Input
              label="username"
              type="text"
              bind:value={username}
              placeholder="e.g. bauhaus_dev"
              disabled={isLoading}
            />
          </div>
        {/if}

        <div class="field-wrapper">
          <Input
            label="email address"
            type="text"
            bind:value={email}
            placeholder="e.g. user@example.com"
            disabled={isLoading}
          />
        </div>

        <div class="field-wrapper">
          <Input
            label="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="modal-footer">
      <Button 
        variant="outline" 
        disabled={isLoading}
        onclick={() => store.showAuthModal = null}
      >
        cancel
      </Button>
      <Button 
        type="submit" 
        variant="primary" 
        disabled={isLoading}
      >
        {isLoading ? 'processing...' : activeTab}
      </Button>
    </div>
  </form>
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
    max-width: 420px;
    background-color: var(--bauhaus-white);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header-accent {
    height: 8px;
    background-color: var(--bauhaus-yellow);
    border-bottom: 2px solid var(--bauhaus-black);
  }

  .modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .tabs-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 2px solid var(--bauhaus-black);
  }

  .tab-btn {
    padding: 10px;
    border: none;
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    text-transform: lowercase;
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  .tab-btn:first-child {
    border-right: 2px solid var(--bauhaus-black);
  }

  .tab-btn.active {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field-wrapper {
    width: 100%;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: rgba(232, 67, 46, 0.1);
    border: 2px solid var(--bauhaus-red);
  }

  .error-dot {
    width: 8px;
    height: 8px;
    background-color: var(--bauhaus-red);
    flex-shrink: 0;
  }

  .error-text {
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--bauhaus-red);
    font-weight: bold;
  }

  /* Modal Footer */
  .modal-footer {
    padding: 16px 24px;
    border-top: 2px solid var(--bauhaus-black);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background-color: var(--bauhaus-grid-bg);
  }
</style>
