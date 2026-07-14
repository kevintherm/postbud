<script lang="ts">
  import Sidebar from './lib/Sidebar.svelte';
  import RequestPane from './lib/RequestPane.svelte';
  import ResponsePane from './lib/ResponsePane.svelte';
  import LoadingOverlay from './lib/components/LoadingOverlay.svelte';
  import EnvironmentsModal from './lib/components/EnvironmentsModal.svelte';
  import { store } from './lib/store.svelte';

  let showSplash = $state(true);
</script>

<!-- Animated Splash Screen on Load -->
{#if showSplash}
  <LoadingOverlay oncomplete={() => showSplash = false} />
{/if}

<main class="app-grid">
  <!-- Left Column: Sidebar -->
  <Sidebar />

  <!-- Right Column: Main Content (Request & Response Split) -->
  <div class="main-content">
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

<style>
  .main-content {
    display: grid;
    grid-template-rows: 1.1fr 0.9fr; /* Asymmetrical visual balance */
    height: 100vh;
    overflow: hidden;
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
