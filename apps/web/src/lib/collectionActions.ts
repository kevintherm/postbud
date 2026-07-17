import type { ApiClientStore } from './store.svelte';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getTopLevelRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  getHistory,
} from './api';
import { generateId } from './utils';
import {
  findRequestInItems,
  findFolderInItems,
  removeItemInPlace,
  flattenRequests,
  requestExistsInCollections,
} from './itemUtils';
import type {
  HeaderOrParam,
  RequestItem,
  CollectionItem,
  FolderItem,
  SidebarItem,
} from './types';
import {
  makeRequest,
  mapBackendCollection,
  mapBackendRequest,
  filterDuplicatesById,
  mapBackendHistory,
} from './store.svelte';

export class CollectionActions {
  private saveTimeout: any = null;
  private pendingSnapshot: RequestItem | null = null;

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
        this.store.collections = [
          ...this.store.collections,
          mapBackendCollection(res.collection) as CollectionItem,
        ];
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

  async renameCollection(id: string, newName: string) {
    if (!newName.trim()) return;
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        await updateCollection(id, newName.trim());
        const col = this.store.collections.find((c) => c.id === id);
        if (col) col.name = newName.trim();
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      const col = this.store.collections.find((c) => c.id === id);
      if (col) col.name = newName.trim();
      this.saveGuestData();
    }
  }

  async deleteCollection(id: string) {
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        await deleteCollection(id);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
        return;
      }
    }
    const idx = this.store.collections.findIndex((c) => c.id === id);
    if (idx === -1) return;
    this.store.collections.splice(idx, 1);
    if (
      !(
        this.store.topLevelRequests.some((r) => r.id === this.store.activeRequest.id) ||
        requestExistsInCollections(this.store.collections, this.store.activeRequest.id)
      )
    ) {
      const all = flattenRequests(this.store.collections.flatMap((c) => c.items));
      if (all.length > 0) {
        this.loadRequest(all[0]);
      }
    }
    this.saveGuestData();
  }

  loadRequest(request: RequestItem | Omit<RequestItem, 'name'>) {
    this.store.activeRequest = {
      id: request.id || generateId(),
      name: 'name' in request ? request.name : 'restored request',
      method: request.method,
      url: request.url,
      headers: request.headers.map((h: HeaderOrParam) => ({ ...h })),
      queryParams: request.queryParams.map((q: HeaderOrParam) => ({ ...q })),
      body: request.body,
      bodyType: request.bodyType,
    };
    this.store.responseState = {
      loading: false,
      status: null,
      statusText: null,
      time: null,
      size: null,
      headers: [],
      body: null,
    };
  }

  addField(type: 'headers' | 'queryParams') {
    this.store.activeRequest[type] = [
      ...this.store.activeRequest[type],
      { id: generateId(), key: '', value: '', enabled: true },
    ];
  }

  removeField(type: 'headers' | 'queryParams', id: string) {
    this.store.activeRequest[type] = this.store.activeRequest[type].filter(
      (item: HeaderOrParam) => item.id !== id
    );
  }

  async addRequest(collectionId: string, folderId?: string) {
    const reqName = 'new request';
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        const res = await createRequest(reqName, folderId || collectionId);
        const req = mapBackendRequest(res.request);
        const items = this._getTargetItems(collectionId, folderId);
        if (items) {
          items.push({ type: 'request', request: req });
          this.loadRequest(req);
        }
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      const req = makeRequest(reqName);
      const items = this._getTargetItems(collectionId, folderId);
      if (items) {
        items.push({ type: 'request', request: req });
        this.loadRequest(req);
      }
      this.saveGuestData();
    }
  }

  async addTopLevelReq() {
    const reqName = 'new request';
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        const res = await createRequest(reqName, null);
        const req = mapBackendRequest(res.request);
        if (!this.store.topLevelRequests.some((r) => r.id === req.id)) {
          this.store.topLevelRequests.push(req);
        }
        this.loadRequest(req);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      const r = makeRequest(reqName);
      if (!this.store.topLevelRequests.some((req) => req.id === r.id)) {
        this.store.topLevelRequests.push(r);
      }
      this.loadRequest(r);
      this.saveGuestData();
    }
  }

  saveToCollection(collectionId: string, folderId?: string): boolean {
    if (
      this.store.topLevelRequests.some((r) => r.id === this.store.activeRequest.id) ||
      requestExistsInCollections(this.store.collections, this.store.activeRequest.id)
    ) {
      return false;
    }
    const items = this._getTargetItems(collectionId, folderId);
    if (!items) return false;
    items.push({ type: 'request', request: this._snapshotRequest(this.store.activeRequest) });
    this.saveGuestData();
    return true;
  }

  saveAsTopLevel(): boolean {
    if (
      this.store.topLevelRequests.some((r) => r.id === this.store.activeRequest.id) ||
      requestExistsInCollections(this.store.collections, this.store.activeRequest.id)
    ) {
      return false;
    }
    this.store.topLevelRequests.push(this._snapshotRequest(this.store.activeRequest));
    this.saveGuestData();
    return true;
  }

  duplicateRequest(requestId: string) {
    const topReq = this.store.topLevelRequests.find((r) => r.id === requestId);
    if (topReq) {
      const clone: RequestItem = {
        id: 'req-' + generateId(),
        name: `${topReq.name} copy`,
        method: topReq.method,
        url: topReq.url,
        headers: topReq.headers.map((h) => ({ ...h, id: generateId() })),
        queryParams: topReq.queryParams.map((q) => ({ ...q, id: generateId() })),
        body: topReq.body,
        bodyType: topReq.bodyType,
      };
      this.store.topLevelRequests.push(clone);
      this.loadRequest(clone);
      this.saveGuestData();
      return;
    }
    for (const col of this.store.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        const orig = found.container[found.index];
        if (orig.type !== 'request') return;
        const clone: RequestItem = {
          id: 'req-' + generateId(),
          name: `${orig.request.name} copy`,
          method: orig.request.method,
          url: orig.request.url,
          headers: orig.request.headers.map((h) => ({ ...h, id: generateId() })),
          queryParams: orig.request.queryParams.map((q) => ({ ...q, id: generateId() })),
          body: orig.request.body,
          bodyType: orig.request.bodyType,
        };
        found.container.splice(found.index + 1, 0, { type: 'request', request: clone });
        this.loadRequest(clone);
        this.saveGuestData();
        return;
      }
    }
  }

  async renameRequest(requestId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (this.store.currentUser && !requestId.startsWith('req-')) {
      try {
        this.store.syncStatus = 'syncing';
        await updateRequest(requestId, { name: trimmed });
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    }
    const topReq = this.store.topLevelRequests.find((r) => r.id === requestId);
    if (topReq) {
      topReq.name = trimmed;
      if (this.store.activeRequest.id === requestId) {
        this.store.activeRequest.name = trimmed;
      }
      this.saveGuestData();
      return;
    }
    for (const col of this.store.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        const item = found.container[found.index];
        if (item.type === 'request') {
          item.request.name = trimmed;
          if (this.store.activeRequest.id === requestId) {
            this.store.activeRequest.name = trimmed;
          }
        }
        break;
      }
    }
    this.saveGuestData();
  }

  async deleteRequest(requestId: string) {
    if (this.store.currentUser && !requestId.startsWith('req-')) {
      try {
        this.store.syncStatus = 'syncing';
        await deleteRequest(requestId);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
        return;
      }
    }
    const topIdx = this.store.topLevelRequests.findIndex((r) => r.id === requestId);
    if (topIdx !== -1) {
      this.store.topLevelRequests.splice(topIdx, 1);
      if (this.store.activeRequest.id === requestId) {
        const all = [
          ...this.store.topLevelRequests,
          ...flattenRequests(this.store.collections.flatMap((c) => c.items)),
        ];
        if (all.length > 0) {
          this.loadRequest(all[0]);
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
      return;
    }
    for (const col of this.store.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        found.container.splice(found.index, 1);
        if (this.store.activeRequest.id === requestId) {
          const all = flattenRequests(this.store.collections.flatMap((c) => c.items));
          if (all.length > 0) {
            this.loadRequest(all[0]);
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
        break;
      }
    }
    this.saveGuestData();
  }

  async saveActiveRequest() {
    const snapshot = this._snapshotRequest(this.store.activeRequest);

    const topIdx = this.store.topLevelRequests.findIndex((r) => r.id === this.store.activeRequest.id);
    if (topIdx !== -1) {
      this.store.topLevelRequests[topIdx] = snapshot;
    } else {
      for (const col of this.store.collections) {
        const found = findRequestInItems(col.items, this.store.activeRequest.id);
        if (found && found.container[found.index].type === 'request') {
          found.container[found.index] = {
            type: 'request',
            request: snapshot,
          };
          break;
        }
      }
    }

    if (this.saveTimeout) {
      if (this.pendingSnapshot && this.pendingSnapshot.id !== snapshot.id) {
        clearTimeout(this.saveTimeout);
        await this._persistActiveRequest(this.pendingSnapshot);
      } else {
        clearTimeout(this.saveTimeout);
      }
    }

    this.pendingSnapshot = snapshot;
    this.saveTimeout = setTimeout(async () => {
      this.saveTimeout = null;
      if (this.pendingSnapshot) {
        const snap = this.pendingSnapshot;
        this.pendingSnapshot = null;
        await this._persistActiveRequest(snap);
      }
    }, 500);
  }

  private async _persistActiveRequest(snapshot: RequestItem) {
    if (this.store.currentUser && !snapshot.id.startsWith('req-')) {
      try {
        this.store.syncStatus = 'syncing';
        let parsedBody = null;
        if (snapshot.bodyType === 'json' && snapshot.body) {
          try {
            parsedBody = JSON.parse(snapshot.body);
          } catch { }
        }
        await updateRequest(snapshot.id, {
          name: snapshot.name,
          method: snapshot.method,
          url: snapshot.url,
          headers: snapshot.headers,
          params: snapshot.queryParams,
          body: parsedBody,
        });
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      this.saveGuestData();
    }
  }

  async addFolder(collectionId: string, parentFolderId?: string) {
    const folderName = 'new folder';
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        const parentId = parentFolderId || collectionId;
        const res = await createCollection(folderName, parentId);
        const folder = mapBackendCollection(res.collection) as FolderItem;
        const items = this._getTargetItems(collectionId, parentFolderId);
        if (items) {
          items.push({ type: 'folder', folder });
        }
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    } else {
      const folder: FolderItem = {
        id: 'folder-' + generateId(),
        name: folderName,
        items: [],
      };
      const items = this._getTargetItems(collectionId, parentFolderId);
      if (items) {
        items.push({ type: 'folder', folder });
      }
      this.saveGuestData();
    }
  }

  async renameFolder(folderId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (this.store.currentUser && !folderId.startsWith('folder-') && !folderId.startsWith('col-')) {
      try {
        this.store.syncStatus = 'syncing';
        await updateCollection(folderId, trimmed);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    }
    for (const col of this.store.collections) {
      const found = findFolderInItems(col.items, folderId);
      if (found) {
        const item = found.container[found.index];
        if (item.type === 'folder') {
          item.folder.name = trimmed;
        }
        break;
      }
    }
    this.saveGuestData();
  }

  async deleteFolder(folderId: string) {
    if (this.store.currentUser && !folderId.startsWith('folder-') && !folderId.startsWith('col-')) {
      try {
        this.store.syncStatus = 'syncing';
        await deleteCollection(folderId);
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
        return;
      }
    }
    for (const col of this.store.collections) {
      const found = findFolderInItems(col.items, folderId);
      if (found) {
        found.container.splice(found.index, 1);
        break;
      }
    }
    this.saveGuestData();
  }

  async moveItem(itemId: string, targetCollectionId: string, targetFolderId?: string, insertIndex?: number) {
    let removed: SidebarItem | null = null;
    let isRequest = false;

    const topReqIdx = this.store.topLevelRequests.findIndex((r) => r.id === itemId);
    if (topReqIdx !== -1) {
      const req = this.store.topLevelRequests.splice(topReqIdx, 1)[0];
      removed = { type: 'request', request: req };
      isRequest = true;
    } else {
      for (const col of this.store.collections) {
        removed = removeItemInPlace(col.items, itemId);
        if (removed) {
          isRequest = removed.type === 'request';
          break;
        }
      }
    }
    if (!removed) return;

    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        if (isRequest) {
          if (!itemId.startsWith('req-')) {
            const colId = targetCollectionId === 'top-level' ? null : (targetFolderId || targetCollectionId);
            await updateRequest(itemId, { collection_id: colId });
          }
        } else {
          if (!itemId.startsWith('folder-') && !itemId.startsWith('col-')) {
            const parentId = targetFolderId || (targetCollectionId === 'top-level' ? null : targetCollectionId);
            await updateCollection(itemId, undefined, parentId);
          }
        }
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    }

    const targetItems = this._getTargetItems(targetCollectionId, targetFolderId);
    if (targetItems) {
      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= targetItems.length) {
        targetItems.splice(insertIndex, 0, removed);
      } else {
        targetItems.push(removed);
      }
    } else if (targetCollectionId === 'top-level' && removed.type === 'request') {
      if (!this.store.topLevelRequests.some((r) => r.id === removed!.request.id)) {
        this.store.topLevelRequests.push(removed.request);
      }
    }
    this.saveGuestData();
  }

  private _getTargetItems(collectionId: string, folderId?: string): SidebarItem[] | null {
    if (collectionId === 'top-level') {
      return null;
    }
    const col = this.store.collections.find((c) => c.id === collectionId);
    if (!col) return null;
    if (!folderId) return col.items;
    const found = findFolderInItems(col.items, folderId);
    if (found) {
      const item = found.container[found.index];
      if (item.type === 'folder') return item.folder.items;
    }
    return null;
  }

  private _snapshotRequest(req: RequestItem): RequestItem {
    return {
      id: req.id,
      name: req.name,
      method: req.method,
      url: req.url,
      headers: req.headers.map((h) => ({ ...h })),
      queryParams: req.queryParams.map((q) => ({ ...q })),
      body: req.body,
      bodyType: req.bodyType,
    };
  }
}
