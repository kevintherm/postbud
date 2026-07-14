<script>
  import Button from './Button.svelte';
  import Input from './Input.svelte';

  let { activeUser = $bindable(null), onAuthSuccess, onLogout } = $props();

  let activeTab = $state('login'); // 'login' | 'register'
  let email = $state('');
  let password = $state('');
  let errorMsg = $state('');
  let successMsg = $state('');
  let isLoading = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    errorMsg = '';
    successMsg = '';
    isLoading = true;

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (activeTab === 'register') {
        successMsg = 'registration successful! please log in.';
        activeTab = 'login';
        password = '';
      } else {
        // Logged in successfully
        onAuthSuccess(data.token, { email: data.email || email });
      }
    } catch (err) {
      errorMsg = err.message.toLowerCase();
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-container">
  {#if activeUser}
    <div class="profile-card">
      <div class="card-header">
        <div class="geometric-badge"></div>
        <h2>profile</h2>
      </div>
      <div class="card-body">
        <p class="email-label">logged in as:</p>
        <p class="email-value">{activeUser.email}</p>
        
        <div style="margin-top: 1.5rem;">
          <Button onclick={onLogout} variant="danger">
            log out
          </Button>
        </div>
      </div>
    </div>
  {:else}
    <div class="auth-card">
      <div class="tabs">
        <button 
          class="tab-btn {activeTab === 'login' ? 'active' : ''}" 
          onclick={() => { activeTab = 'login'; errorMsg = ''; successMsg = ''; }}
        >
          login
        </button>
        <button 
          class="tab-btn {activeTab === 'register' ? 'active' : ''}" 
          onclick={() => { activeTab = 'register'; errorMsg = ''; successMsg = ''; }}
        >
          register
        </button>
      </div>

      <form onsubmit={handleSubmit} class="auth-form">
        {#if errorMsg}
          <div class="alert alert-error">
            {errorMsg}
          </div>
        {/if}
        {#if successMsg}
          <div class="alert alert-success">
            {successMsg}
          </div>
        {/if}

        <div class="form-group">
          <label for="email">email address</label>
          <Input 
            type="email" 
            id="email" 
            placeholder="enter your email" 
            bind:value={email} 
            required 
          />
        </div>

        <div class="form-group">
          <label for="password">password</label>
          <Input 
            type="password" 
            id="password" 
            placeholder="enter your password" 
            bind:value={password} 
            required 
          />
        </div>

        <div class="form-actions">
          <Button type="submit" disabled={isLoading} variant="primary">
            {isLoading ? 'loading...' : activeTab}
          </Button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .auth-container {
    width: 100%;
    max-width: 420px;
    margin: 2rem auto;
  }

  .auth-card, .profile-card {
    background-color: var(--bauhaus-white);
    border: 2px solid var(--bauhaus-black);
    padding: 0;
    position: relative;
  }

  .tabs {
    display: flex;
    border-bottom: 2px solid var(--bauhaus-black);
  }

  .tab-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 1rem;
    font-family: var(--font-bauhaus);
    font-size: var(--fs-label);
    font-weight: var(--fw-label);
    letter-spacing: var(--ls-label);
    cursor: pointer;
    text-transform: lowercase;
    transition: background-color 0.1s ease;
  }

  .tab-btn:not(:last-child) {
    border-right: 2px solid var(--bauhaus-black);
  }

  .tab-btn.active {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .tab-btn:hover:not(.active) {
    background-color: var(--bauhaus-grid-bg);
  }

  .auth-form, .card-body {
    padding: 2rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    border-bottom: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
    padding: 1rem 2rem;
  }

  .card-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: var(--fw-h1);
    text-transform: lowercase;
  }

  .geometric-badge {
    width: 16px;
    height: 16px;
    background-color: var(--bauhaus-red);
    margin-right: 10px;
    border: 2px solid var(--bauhaus-black);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .form-group label {
    font-size: var(--fs-label);
    font-weight: var(--fw-label);
    text-transform: lowercase;
  }

  .form-actions {
    margin-top: 2rem;
  }

  .alert {
    padding: 0.75rem 1rem;
    border: 2px solid var(--bauhaus-black);
    font-size: var(--fs-label);
    text-transform: lowercase;
    margin-bottom: 1.5rem;
    font-weight: var(--fw-label);
  }

  .alert-error {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }

  .alert-success {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .email-label {
    font-size: var(--fs-label);
    font-weight: var(--fw-label);
    text-transform: lowercase;
    color: #666;
    margin: 0 0 0.25rem 0;
  }

  .email-value {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    word-break: break-all;
  }
</style>
