<script lang="ts">
  import { store } from "./store.svelte";
  import Button from "./components/Button.svelte";

  // Choose a color for the avatar based on user id or name
  function getAvatarColorClass(userId: number): string {
    const colors = ["bg-yellow", "bg-blue", "bg-red"];
    return colors[userId % colors.length] || "bg-black";
  }
</script>

<div class="auth-sidebar-footer">
  {#if store.currentUser}
    <div class="profile-card">
      <div class="avatar {getAvatarColorClass(store.currentUser.id)}">
        {store.currentUser.name.substring(0, 1).toLowerCase()}
      </div>
      <div class="user-info">
        <span class="name">{store.currentUser.name.toLowerCase()}</span>
        <button
          type="button"
          class="profile-btn"
          onclick={() => (store.showProfileModal = true)}
        >
          [profile]
        </button>
      </div>
    </div>
  {:else}
    <div class="w-full">
      <Button
        variant="yellow"
        class="w-full-btn"
        onclick={() => (store.showAuthModal = "login")}
      >
        login / register
      </Button>
    </div>
  {/if}
</div>

<style>
  .auth-sidebar-footer {
    padding: 16px;
    border-top: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-white);
  }

  :global(.w-full-btn) {
    width: 100% !important;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border: 2px solid var(--bauhaus-black);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--bauhaus-black);
  }

  .bg-yellow {
    background-color: var(--bauhaus-yellow);
  }

  .bg-blue {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white) !important;
  }

  .bg-red {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white) !important;
  }

  .bg-black {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white) !important;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }

  .name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--bauhaus-black);
  }

  .profile-btn {
    background: none;
    border: none;
    font-family: var(--font-body);
    font-size: 0.8rem;
    color: var(--bauhaus-blue);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    text-transform: lowercase;
  }

  .profile-btn:hover {
    color: var(--bauhaus-red);
  }
</style>
