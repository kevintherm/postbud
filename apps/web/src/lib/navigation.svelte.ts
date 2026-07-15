import { store } from './store.svelte';

class RequestNavigation {
  expandedCollections = $state<Record<string, boolean>>({
    'col-auth': true,
    'col-users': true,
    'col-debug': true
  });

  // Check if a request ID exists in the collections
  existsInCollections(requestId: string | null | undefined): boolean {
    if (!requestId) return false;
    return store.collections.some((c) =>
      c.requests.some((r) => r.id === requestId)
    );
  }
}

export const requestNav = new RequestNavigation();
