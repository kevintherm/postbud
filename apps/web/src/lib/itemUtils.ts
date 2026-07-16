import type { SidebarItem, RequestItem, FolderItem, CollectionItem } from './types';

export function findRequestInItems(
  items: SidebarItem[],
  requestId: string
): { container: SidebarItem[]; index: number } | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'request' && item.request.id === requestId) {
      return { container: items, index: i };
    }
    if (item.type === 'folder') {
      const found = findRequestInItems(item.folder.items, requestId);
      if (found) return found;
    }
  }
  return null;
}

export function findFolderInItems(
  items: SidebarItem[],
  folderId: string
): { container: SidebarItem[]; index: number } | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'folder' && item.folder.id === folderId) {
      return { container: items, index: i };
    }
    if (item.type === 'folder') {
      const found = findFolderInItems(item.folder.items, folderId);
      if (found) return found;
    }
  }
  return null;
}

export function findItemInItems(
  items: SidebarItem[],
  itemId: string
): { container: SidebarItem[]; index: number; sidebarItem: SidebarItem } | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      (item.type === 'request' && item.request.id === itemId) ||
      (item.type === 'folder' && item.folder.id === itemId)
    ) {
      return { container: items, index: i, sidebarItem: item };
    }
    if (item.type === 'folder') {
      const found = findItemInItems(item.folder.items, itemId);
      if (found) return found;
    }
  }
  return null;
}

export function removeItemInPlace(items: SidebarItem[], itemId: string): SidebarItem | null {
  const found = findItemInItems(items, itemId);
  if (found) {
    found.container.splice(found.index, 1);
    return found.sidebarItem;
  }
  return null;
}

export function collectRequestIds(items: SidebarItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.type === 'request') {
      ids.push(item.request.id);
    } else {
      ids.push(...collectRequestIds(item.folder.items));
    }
  }
  return ids;
}

export function collectFolderIds(items: SidebarItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.type === 'folder') {
      ids.push(item.folder.id);
      ids.push(...collectFolderIds(item.folder.items));
    }
  }
  return ids;
}

export function flattenRequests(items: SidebarItem[]): RequestItem[] {
  const result: RequestItem[] = [];
  for (const item of items) {
    if (item.type === 'request') {
      result.push(item.request);
    } else {
      result.push(...flattenRequests(item.folder.items));
    }
  }
  return result;
}

export function requestExistsInCollections(collections: CollectionItem[], requestId: string): boolean {
  for (const col of collections) {
    if (findRequestInItems(col.items, requestId)) return true;
  }
  return false;
}

export function findRequestNameInCollections(collections: CollectionItem[], requestId: string): string {
  for (const col of collections) {
    const found = findRequestInItems(col.items, requestId);
    if (found) {
      const item = found.container[found.index];
      if (item.type === 'request') return item.request.name;
    }
  }
  return '';
}

export function findRequestName(topLevel: RequestItem[], collections: CollectionItem[], requestId: string): string {
  const tr = topLevel.find(r => r.id === requestId);
  if (tr) return tr.name;
  return findRequestNameInCollections(collections, requestId);
}

export function collectAllRequestIds(collections: CollectionItem[]): string[] {
  const ids: string[] = [];
  for (const col of collections) {
    ids.push(...collectRequestIds(col.items));
  }
  return ids;
}
