<script>
  import Sidebar from './lib/Sidebar.svelte';
  import RequestPane from './lib/RequestPane.svelte';
  import ResponsePane from './lib/ResponsePane.svelte';
  import BatchRunner from './lib/BatchRunner.svelte';
  import AuthPage from './lib/components/AuthPage.svelte';
  import { store } from './lib/store.svelte.js';

  let isSidebarCollapsed = $state(false);
</script>

<!-- Bauhaus First Visit Loading Screen -->
{#if store.isAppLoading}
  <div class="fixed inset-0 bg-bauhaus-white flex flex-col items-center justify-center z-[100] select-none" id="app-loading-screen">
    <div class="relative w-48 h-48 mb-8 flex items-center justify-center">
      <!-- Rotating & Bouncing Bauhaus composition -->
      <div class="absolute w-36 h-36 rounded-full bg-bauhaus-yellow border-4 border-bauhaus-black animate-pulse"></div>
      <div class="absolute w-28 h-28 bg-bauhaus-blue border-4 border-bauhaus-black rotate-12 animate-spin [animation-duration:10s]"></div>
      <div class="absolute w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[60px] border-b-bauhaus-red -mt-6"></div>
    </div>
    <h1 class="text-4xl font-black font-bauhaus tracking-tighter text-bauhaus-black lowercase mb-2">
      postbud
    </h1>
    <p class="text-xs text-gray-400 font-bold lowercase tracking-wider animate-pulse">
      initializing local-first workspace...
    </p>
  </div>
{/if}

<main class="flex h-screen w-screen overflow-hidden bauhaus-grid text-bauhaus-black select-none">
  <!-- Left Side: Navigation Sidebar -->
  <Sidebar bind:isCollapsed={isSidebarCollapsed} />

  <!-- Right Side: Request/Response Console -->
  <section class="flex-1 flex flex-col h-full overflow-hidden">
    <RequestPane />
    <ResponsePane />
  </section>

  <!-- Global Modals -->
  <BatchRunner />

  <!-- Auth Panel Overlay -->
  {#if store.showAuth}
    <div class="fixed inset-0 bg-transparent flex items-center justify-center z-50" id="auth-modal">
      <div class="relative w-full max-w-md mx-4">
        <button 
          onclick={() => store.showAuth = false}
          class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center border-2 border-bauhaus-black bg-bauhaus-red text-bauhaus-white hover:bg-bauhaus-black cursor-pointer font-bold font-mono z-50"
          title="close auth panel"
        >
          x
        </button>
        <AuthPage 
          bind:activeUser={store.activeUser}
          onAuthSuccess={(token, user) => store.login(token, user)}
          onLogout={() => store.logout()}
        />
      </div>
    </div>
  {/if}
</main>
