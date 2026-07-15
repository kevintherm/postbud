<script lang="ts">
  import { store } from "../store.svelte";
  import { updateUser, ApiError } from "../api";
  import Input from "./Input.svelte";
  import Button from "./Button.svelte";

  // Local form state
  let name = $state(store.currentUser?.name || "");
  let email = $state(store.currentUser?.email || "");
  let syncEnabled = $state(store.currentUser?.sync_enabled ?? true);
  let errorMessage = $state("");
  let successMessage = $state("");
  let isLoading = $state(false);

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      store.showProfileModal = false;
    }
  }

  function handleLogout() {
    store.logout();
  }

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = "";
    successMessage = "";

    if (!name || !email) {
      errorMessage = "please fill in name and email";
      return;
    }

    if (!store.currentUser) {
      errorMessage = "no authenticated user found";
      return;
    }

    isLoading = true;

    try {
      await updateUser(store.currentUser.id, {
        name: name,
        email,
        sync_enabled: syncEnabled,
      });
      store.updateProfile(name, email, syncEnabled);
      successMessage = "profile updated successfully";
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessage = err.message.toLowerCase();
      } else {
        errorMessage = "failed to save changes";
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <form
    class="modal-card bauhaus-card"
    onsubmit={handleSave}
    onclick={(e) => e.stopPropagation()}
  >
    <div class="modal-header-accent"></div>

    <div class="modal-content-split">
      <!-- Left Column: User details summary (Bauhaus Asymmetrical element) -->
      <div class="info-sidebar">
        <div class="sidebar-header">
          <span class="label-text">account info</span>
        </div>

        <div class="info-details font-body">
          <div class="info-group">
            <span class="info-label font-display">user ID</span>
            <span class="info-val">#{store.currentUser?.id || 42}</span>
          </div>

          <div class="info-group">
            <span class="info-label font-display">role</span>
            <span class="info-val badge-role"
              >{store.currentUser?.role || "user"}</span
            >
          </div>

          <div class="info-group">
            <span class="info-label font-display">created</span>
            <span class="info-val">
              {store.currentUser?.created_at
                ? new Date(store.currentUser.created_at).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>

        <div class="sidebar-footer">
          <Button variant="red" size="sm" onclick={handleLogout} class="w-full">
            logout
          </Button>
        </div>
      </div>

      <!-- Right Column: Edit form -->
      <div class="form-editor">
        <div class="editor-header">
          <h2 class="form-title">edit profile</h2>
        </div>

        {#if errorMessage}
          <div class="banner error-banner">
            <span class="banner-dot error-dot"></span>
            <span class="banner-text">{errorMessage.toLowerCase()}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="banner success-banner">
            <span class="banner-dot success-dot"></span>
            <span class="banner-text">{successMessage.toLowerCase()}</span>
          </div>
        {/if}

        <div class="fields-section">
          <div class="field-wrapper">
            <Input
              label="name"
              type="text"
              bind:value={name}
              placeholder="name"
              disabled={isLoading}
            />
          </div>

          <div class="field-wrapper">
            <Input
              label="email address"
              type="text"
              bind:value={email}
              placeholder="email address"
              disabled={isLoading}
            />
          </div>

          <!-- Custom Bauhaus checkbox row -->
          <label class="checkbox-row">
            <input
              type="checkbox"
              bind:checked={syncEnabled}
              disabled={isLoading}
              class="bauhaus-checkbox"
            />
            <div class="checkbox-label font-body">
              <span class="checkbox-title font-display">enable cloud sync</span>
              <span class="checkbox-desc"
                >automatically backup and sync request collections in real time</span
              >
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Modal actions footer -->
    <div class="modal-footer">
      <Button
        variant="outline"
        disabled={isLoading}
        onclick={() => (store.showProfileModal = false)}
      >
        close
      </Button>
      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading ? "saving..." : "save changes"}
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
    max-width: 680px;
    height: 480px;
    background-color: var(--bauhaus-white);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header-accent {
    height: 8px;
    background-color: var(--bauhaus-blue);
    border-bottom: 2px solid var(--bauhaus-black);
  }

  .modal-content-split {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Left Sidebar Styling */
  .info-sidebar {
    width: 200px;
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

  .info-details {
    padding: 20px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: lowercase;
    color: #555;
  }

  .info-val {
    font-size: 0.9rem;
    color: var(--bauhaus-black);
  }

  .badge-role {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: lowercase;
    background-color: var(--bauhaus-yellow);
    padding: 2px 6px;
    border: 1px solid var(--bauhaus-black);
    width: fit-content;
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-white);
  }

  /* Right Editor Styling */
  .form-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    overflow-y: auto;
    background-color: var(--bauhaus-white);
    gap: 20px;
  }

  .form-title {
    font-size: 1.5rem;
    color: var(--bauhaus-black);
    margin: 0;
  }

  .fields-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field-wrapper {
    width: 100%;
  }

  .checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    margin-top: 4px;
    user-select: none;
  }

  .bauhaus-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--bauhaus-black);
    accent-color: var(--bauhaus-blue);
    margin-top: 2px;
    flex-shrink: 0;
    appearance: auto;
  }

  .checkbox-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .checkbox-title {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: lowercase;
    color: var(--bauhaus-black);
  }

  .checkbox-desc {
    font-size: 0.75rem;
    color: #666;
  }

  /* Banners */
  .banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
  }

  .banner-dot {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
  }

  .banner-text {
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: bold;
  }

  .error-banner {
    background-color: rgba(232, 67, 46, 0.1);
    border: 2px solid var(--bauhaus-red);
  }

  .error-dot {
    background-color: var(--bauhaus-red);
  }

  .success-banner {
    background-color: rgba(34, 85, 214, 0.1);
    border: 2px solid var(--bauhaus-blue);
  }

  .success-dot {
    background-color: var(--bauhaus-blue);
  }

  /* Modal Footer */
  .modal-footer {
    padding: 12px 24px;
    border-top: 2px solid var(--bauhaus-black);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background-color: var(--bauhaus-grid-bg);
  }

  :global(.w-full) {
    width: 100% !important;
  }
</style>
