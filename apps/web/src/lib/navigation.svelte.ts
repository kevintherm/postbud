import { store } from './store.svelte';
import { collectAllRequestIds } from './itemUtils';

class RequestNavigation {
  expandedCollections = $state<Record<string, boolean>>({
    'col-auth': true,
    'col-users': true,
    'col-debug': true
  });

  expandedFolders = $state<Record<string, boolean>>({
    'folder-auth-tokens': true,
    'folder-errors': true
  });

  toggleFolder(folderId: string) {
    this.expandedFolders[folderId] = !this.expandedFolders[folderId];
  }

  isFolderExpanded(folderId: string): boolean {
    return this.expandedFolders[folderId] !== false;
  }

  existsInCollections(requestId: string | null | undefined): boolean {
    if (!requestId) return false;
    return collectAllRequestIds(store.collections).includes(requestId);
  }
}

export const requestNav = new RequestNavigation();
