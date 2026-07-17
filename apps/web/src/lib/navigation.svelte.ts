import { store } from './store.svelte';
import { collectAllRequestIds } from './itemUtils';

class RequestNavigation {
  expandedCollections = $state<Record<string, boolean>>({});

  toggleCollection(collectionId: string) {
    this.expandedCollections[collectionId] = !this.expandedCollections[collectionId];
  }

  isCollectionExpanded(collectionId: string): boolean {
    return this.expandedCollections[collectionId] !== false;
  }

  existsInCollections(requestId: string | null | undefined): boolean {
    if (!requestId) return false;
    return store.topLevelRequests.some(r => r.id === requestId) || collectAllRequestIds(store.collections).includes(requestId);
  }
}

export const requestNav = new RequestNavigation();
