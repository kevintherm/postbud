<script lang="ts">
  import Sidebar from "./lib/Sidebar.svelte";
  import RequestPane from "./lib/RequestPane.svelte";
  import ResponsePane from "./lib/ResponsePane.svelte";
  import LoadingOverlay from "./lib/components/LoadingOverlay.svelte";
  import EnvironmentsModal from "./lib/components/EnvironmentsModal.svelte";
  import AuthModal from "./lib/components/AuthModal.svelte";
  import ProfileModal from "./lib/components/ProfileModal.svelte";
  import { store } from "./lib/store.svelte";

  let showSplash = $state(true);

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = "";
  }

  $effect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pb_routing_mode", store.routingMode);
    }
  });
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<!-- Animated Splash Screen on Load -->
{#if showSplash && false}
  <LoadingOverlay oncomplete={() => (showSplash = false)} />
{/if}

<main
  class="app-grid"
  style="grid-template-columns: {store.sidebarCollapsed ? '0px' : '280px'} 1fr;"
>
  <!-- Left Column: Sidebar -->
  <Sidebar />

  <!-- Right Column: Main Content (Request & Response Split) -->
  <div class="main-content">
    <!-- Collapsible Sidebar Toggle Tab -->
    <button
      type="button"
      class="sidebar-toggle"
      onclick={() => store.toggleSidebar()}
      title={store.sidebarCollapsed ? "expand sidebar" : "collapse sidebar"}
    >
      {store.sidebarCollapsed ? "▶" : "◀"}
    </button>

    <div class="top-section">
      <RequestPane />
    </div>

    <div class="bottom-section">
      <ResponsePane />
    </div>
  </div>
</main>

<!-- Environments Management Modal -->
{#if store.showEnvironmentsModal}
  <EnvironmentsModal />
{/if}

<!-- Authentication Modal -->
{#if store.showAuthModal}
  <AuthModal />
{/if}

<!-- Profile Management Modal -->
{#if store.showProfileModal}
  <ProfileModal />
{/if}

<style>
  .app-grid {
    transition: grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .main-content {
    display: grid;
    grid-template-rows: 1.1fr 0.9fr; /* Asymmetrical visual balance */
    height: 100vh;
    overflow: hidden;
    position: relative;
  }

  .sidebar-toggle {
    position: absolute;
    left: -2px;
    top: 16px;
    z-index: 99;
    width: 24px;
    height: 36px;
    border: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    transition:
      background-color 0.1s ease,
      color 0.1s ease;
  }

  .sidebar-toggle:hover {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }

  .top-section {
    overflow: hidden;
    height: 100%;
  }

  .bottom-section {
    border-top: 2px solid var(--bauhaus-black);
    overflow: hidden;
    height: 100%;
  }
</style>
