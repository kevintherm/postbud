import type { ApiClientStore } from './store.svelte';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getTopLevelRequests,
  getHistory,
} from './api';
import { generateId } from './utils';
import {
  findCollectionInItems,
  flattenRequests,
  requestExistsInCollections,
} from './itemUtils';
import type {
  CollectionItem,
  SidebarItem,
} from './types';
import {
  mapBackendCollection,
  mapBackendRequest,
  filterDuplicatesById,
  mapBackendHistory,
} from './store.svelte';

export class CollectionActions {
  constructor(private store: ApiClientStore) { }

  saveGuestData() {
    if (!this.store.currentUser && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pb_guest_collections', JSON.stringify(this.store.collections));
        localStorage.setItem('pb_guest_requests', JSON.stringify(this.store.topLevelRequests));
        localStorage.setItem('pb_guest_history', JSON.stringify(this.store.history));
      } catch (e) {
        console.error('Failed to save guest data', e);
      }
    }
  }

  async loadData() {
    if (!this.store.currentUser) {
      if (typeof localStorage !== 'undefined') {
        try {
          this.store.collections = JSON.parse(localStorage.getItem('pb_guest_collections') || '[]');
          this.store.topLevelRequests = filterDuplicatesById(
            JSON.parse(localStorage.getItem('pb_guest_requests') || '[]')
          );
          this.store.history = JSON.parse(localStorage.getItem('pb_guest_history') || '[]');
        } catch (e) {
          console.error('Failed to load guest data:', e);
          this.store.collections = [];
          this.store.topLevelRequests = [];
          this.store.history = [];
        }
      } else {
        this.store.collections = [];
        this.store.topLevelRequests = [];
        this.store.history = [];
      }
      return;
    }
    try {
      this.store.syncStatus = 'syncing';
      const colRes = await getCollections();
      this.store.collections = colRes.collections.map(mapBackendCollection);

      const reqRes = await getTopLevelRequests();
      this.store.topLevelRequests = filterDuplicatesById(
        reqRes.requests.map(mapBackendRequest)
      );

      const histRes = await getHistory();
      this.store.history = histRes.history.map(mapBackendHistory);

      this.store.syncStatus = 'synced';
    } catch (e) {
      console.error('Failed to load backend data:', e);
      this.store.syncStatus = 'offline';
    }
  }

  async addCollection(name: string) {
    if (!name.trim()) return;
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        const res = await createCollection(name.trim());
        const col = mapBackendCollection(res.collection);
        this.store.collections = [...this.store.collections, col];
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      this.store.collections = [
        ...this.store.collections,
        { id: 'col-' + generateId(), name: name.trim(), items: [] },
      ];
      this.saveGuestData();
    }
  }

  async renameCollection(collectionId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (this.store.currentUser && !collectionId.startsWith('col-')) {
      try {
        this.store.syncStatus = 'syncing';
        await updateCollection(collectionId, trimmed);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    }
    const rootCol = this.store.collections.find((c) => c.id === collectionId);
    if (rootCol) {
      rootCol.name = trimmed;
    } else {
      for (const col of this.store.collections) {
        const found = findCollectionInItems(col.items, collectionId);
        if (found) {
          const item = found.container[found.index];
          if (item.type === 'collection') {
            item.collection.name = trimmed;
          }
          break;
        }
      }
    }
    this.saveGuestData();
  }

  async deleteCollection(collectionId: string) {
    if (this.store.currentUser && !collectionId.startsWith('col-')) {
      try {
        this.store.syncStatus = 'syncing';
        await deleteCollection(collectionId);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    }
    const rootIdx = this.store.collections.findIndex((c) => c.id === collectionId);
    if (rootIdx !== -1) {
      this.store.collections.splice(rootIdx, 1);
    } else {
      for (const col of this.store.collections) {
        const found = findCollectionInItems(col.items, collectionId);
        if (found) {
          found.container.splice(found.index, 1);
          break;
        }
      }
    }

    if (
      !(
        this.store.topLevelRequests.some((r) => r.id === this.store.activeRequest.id) ||
        requestExistsInCollections(this.store.collections, this.store.activeRequest.id)
      )
    ) {
      const all = flattenRequests(this.store.collections.flatMap((c) => c.items));
      if (all.length > 0) {
        this.store.requestCrudActions.loadRequest(all[0]);
      } else {
        this.store.activeRequest = {
          id: 'req-default',
          name: 'custom request',
          method: 'GET',
          url: '',
          headers: [],
          queryParams: [],
          body: '',
          bodyType: 'none',
        };
      }
    }

    this.saveGuestData();
  }

  async addSubCollection(parentId: string) {
    const colName = 'new collection';
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        const res = await createCollection(colName, parentId);
        const collection = mapBackendCollection(res.collection);
        const items = this._getTargetItems(parentId);
        if (items) {
          items.push({ type: 'collection', collection });
        }
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      const collection: CollectionItem = {
        id: 'col-' + generateId(),
        name: colName,
        items: [],
      };
      const items = this._getTargetItems(parentId);
      if (items) {
        items.push({ type: 'collection', collection });
      }
      this.saveGuestData();
    }
  }

  _getTargetItems(collectionId: string): SidebarItem[] | null {
    if (collectionId === 'top-level') {
      return null;
    }
    const col = this.store.collections.find((c) => c.id === collectionId);
    if (col) return col.items;

    for (const rootCol of this.store.collections) {
      const found = findCollectionInItems(rootCol.items, collectionId);
      if (found) {
        const item = found.container[found.index];
        if (item.type === 'collection') return item.collection.items;
      }
    }
    return null;
  }
}
