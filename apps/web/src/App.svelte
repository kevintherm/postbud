<script lang="ts">
  import Sidebar from "./lib/Sidebar.svelte";
  import RequestPane from "./lib/RequestPane.svelte";
  import ResponsePane from "./lib/ResponsePane.svelte";
  import LoadingOverlay from "./lib/components/LoadingOverlay.svelte";
  import EnvironmentsModal from "./lib/components/EnvironmentsModal.svelte";
  import AuthModal from "./lib/components/AuthModal.svelte";
  import ProfileModal from "./lib/components/ProfileModal.svelte";
  import RenameRequestModal from "./lib/components/RenameRequestModal.svelte";
  import { store } from "./lib/store.svelte";
  import { requestNav } from "./lib/navigation.svelte";
  import { findRequestName } from "./lib/itemUtils";
  import { untrack } from "svelte";

  let showSplash = $state(true);
  let renameTargetId = $state<string | null>(null);
  let renameTargetInitialName = $state("");
  let renameIsCollection = $state(false);

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    // event.preventDefault();
    // event.returnValue = "";
  }

  function isTyping(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    if (!target) return false;
    const name = target.tagName.toUpperCase();
    return (
      name === "INPUT" ||
      name === "TEXTAREA" ||
      name === "SELECT" ||
      target.isContentEditable
    );
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (isTyping(event)) return;

    const isModalOpen =
      store.showEnvironmentsModal ||
      store.showAuthModal ||
      store.showProfileModal ||
      renameTargetId !== null;
    if (isModalOpen) return;

    const activeEl = document.activeElement;
    let targetId: string | null = null;
    let isCollection = false;

    if (activeEl) {
      const reqId = activeEl.getAttribute("data-request-id");
      if (reqId) {
        targetId = reqId;
      } else {
        const collectionId = activeEl.getAttribute("data-collection-id");
        if (collectionId) {
          targetId = collectionId;
          isCollection = true;
        }
      }
    }

    if (!targetId && store.activeRequest) {
      targetId = store.activeRequest.id;
    }

    if (!targetId) return;

    // Duplicate: Ctrl+D (requests only)
    if (event.ctrlKey && event.key.toLowerCase() === "d" && !isCollection) {
      if (requestNav.existsInCollections(targetId)) {
        event.preventDefault();
        store.duplicateRequest(targetId);
      }
    }
    // Rename: F2 or Alt+R
    else if (
      event.key === "F2" ||
      (event.altKey && event.key.toLowerCase() === "r")
    ) {
      event.preventDefault();
      if (isCollection) {
        renameIsCollection = true;
        renameTargetId = targetId;
        renameTargetInitialName =
          activeEl?.getAttribute("data-collection-name") || "collection";
      } else if (requestNav.existsInCollections(targetId)) {
        renameIsCollection = false;
        renameTargetId = targetId;
        renameTargetInitialName = findRequestName(
          store.topLevelRequests,
          store.collections,
          targetId,
        );
      }
    }
    // Delete: Delete or Alt+Backspace
    else if (
      event.key === "Delete" ||
      (event.altKey && event.key === "Backspace")
    ) {
      if (isCollection) {
        event.preventDefault();
        const name =
          activeEl?.getAttribute("data-collection-name") || "collection";
        if (confirm(`delete collection "${name}"?`)) {
          store.deleteCollection(targetId!);
        }
      } else if (requestNav.existsInCollections(targetId)) {
        event.preventDefault();
        const name = findRequestName(
          store.topLevelRequests,
          store.collections,
          targetId,
        );
        if (name && confirm(`delete request "${name}"?`)) {
          store.deleteRequest(targetId!);
        }
      }
    }
    // Navigate items: ArrowUp / ArrowDown
    else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const items = Array.from(
        document.querySelectorAll(".request-item, .collection-header"),
      ) as HTMLButtonElement[];
      if (items.length > 0) {
        event.preventDefault();
        const currentIndex = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        let nextIndex = 0;
        if (event.key === "ArrowUp") {
          nextIndex =
            currentIndex === -1
              ? items.length - 1
              : (currentIndex - 1 + items.length) % items.length;
        } else {
          nextIndex =
            currentIndex === -1 ? 0 : (currentIndex + 1) % items.length;
        }
        items[nextIndex]?.focus();
      }
    }
  }

  $effect(() => {
    const req = store.activeRequest;
    if (!req) return;
    const _track = {
      name: req.name,
      method: req.method,
      url: req.url,
      headers: req.headers
        ? req.headers.map((h) => `${h.key}:${h.value}:${h.enabled}`)
        : [],
      queryParams: req.queryParams
        ? req.queryParams.map((q) => `${q.key}:${q.value}:${q.enabled}`)
        : [],
      body: req.body,
      bodyType: req.bodyType,
    };
    untrack(() => {
      store.saveActiveRequest();
    });
  });

  $effect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pb_routing_mode", store.routingMode);
    }
  });
</script>

<svelte:window
  onbeforeunload={handleBeforeUnload}
  onkeydown={handleGlobalKeydown}
/>

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

<!-- Rename Request / Collection Modal -->
{#if renameTargetId}
  <RenameRequestModal
    title={renameIsCollection ? "rename collection" : "rename request"}
    initialName={renameTargetInitialName}
    onsave={(name) => {
      if (renameIsCollection) {
        store.renameCollection(renameTargetId!, name);
      } else {
        store.renameRequest(renameTargetId!, name);
      }
    }}
    onclose={() => {
      renameTargetId = null;
    }}
  />
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
