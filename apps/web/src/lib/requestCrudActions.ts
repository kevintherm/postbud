import type { ApiClientStore } from './store.svelte';
import {
  createRequest,
  updateRequest,
  deleteRequest,
  updateCollection,
} from './api';
import { generateId } from './utils';
import {
  findRequestInItems,
  findCollectionInItems,
  removeItemInPlace,
  flattenRequests,
  requestExistsInCollections,
} from './itemUtils';
import type {
  HeaderOrParam,
  RequestItem,
  CollectionItem,
  SidebarItem,
  HistoryItem,
  ResponseState,
} from './types';
import {
  makeRequest,
  mapBackendRequest,
} from './store.svelte';

export class RequestCrudActions {
  private saveTimeout: any = null;
  private pendingSnapshot: RequestItem | null = null;

  constructor(private store: ApiClientStore) {}

  saveGuestData() {
    this.store.collectionActions.saveGuestData();
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

    const lastHistory = request.id ? this.store.history.find(h => h.requestId === request.id) : null;
    if (lastHistory) {
      const sizeStr = lastHistory.responseSize !== null && lastHistory.responseSize !== undefined
        ? (lastHistory.responseSize < 1024
          ? lastHistory.responseSize + ' B'
          : (lastHistory.responseSize / 1024).toFixed(1) + ' KB')
        : null;

      this.store.responseState = {
        loading: false,
        status: lastHistory.status,
        statusText: lastHistory.status >= 200 && lastHistory.status < 300 ? 'OK' : 'Error',
        time: lastHistory.time,
        size: sizeStr,
        headers: lastHistory.responseHeaders || [],
        body: lastHistory.responseBody || null,
      };
    } else {
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
  }

  loadHistoryItem(log: HistoryItem) {
    this.store.activeRequest = {
      id: log.requestId || generateId(),
      name: `${log.method.toLowerCase()} request`,
      method: log.method as any,
      url: log.url,
      headers: (log.requestHeaders || []).map((h: HeaderOrParam) => ({ ...h })),
      queryParams: (log.requestParams || []).map((q: HeaderOrParam) => ({ ...q })),
      body: log.requestBody || '',
      bodyType: log.requestBody ? 'json' : 'none',
    };

    const sizeStr = log.responseSize !== null && log.responseSize !== undefined
      ? (log.responseSize < 1024
        ? log.responseSize + ' B'
        : (log.responseSize / 1024).toFixed(1) + ' KB')
      : null;

    this.store.responseState = {
      loading: false,
      status: log.status,
      statusText: log.status >= 200 && log.status < 300 ? 'OK' : 'Error',
      time: log.time,
      size: sizeStr,
      headers: log.responseHeaders || [],
      body: log.responseBody || null,
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

  async addRequest(collectionId: string) {
    const reqName = 'new request';
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        const res = await createRequest(reqName, collectionId);
        const req = mapBackendRequest(res.request);
        const items = this._getTargetItems(collectionId);
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
      const items = this._getTargetItems(collectionId);
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

  saveToCollection(collectionId: string): boolean {
    if (
      this.store.topLevelRequests.some((r) => r.id === this.store.activeRequest.id) ||
      requestExistsInCollections(this.store.collections, this.store.activeRequest.id)
    ) {
      return false;
    }
    const items = this._getTargetItems(collectionId);
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
      }
    }
    const topIdx = this.store.topLevelRequests.findIndex((r) => r.id === requestId);
    if (topIdx !== -1) {
      this.store.topLevelRequests.splice(topIdx, 1);
      this._cleanupAfterDelete(requestId);
      this.saveGuestData();
      return;
    }
    for (const col of this.store.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        found.container.splice(found.index, 1);
        this._cleanupAfterDelete(requestId);
        break;
      }
    }
    this.saveGuestData();
  }

  private _cleanupAfterDelete(requestId: string) {
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

  async moveItem(itemId: string, targetCollectionId: string, insertIndex?: number) {
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
            const colId = targetCollectionId === 'top-level' ? null : targetCollectionId;
            await updateRequest(itemId, { collection_id: colId });
          }
        } else {
          if (!itemId.startsWith('col-')) {
            const parentId = targetCollectionId === 'top-level' ? null : targetCollectionId;
            await updateCollection(itemId, undefined, parentId);
          }
        }
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
      }
    }

    const targetItems = this._getTargetItems(targetCollectionId);
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

  private _getTargetItems(collectionId: string): SidebarItem[] | null {
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
