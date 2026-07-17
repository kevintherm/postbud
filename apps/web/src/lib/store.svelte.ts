import { generateId } from './utils';
import {
  getMe,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getTopLevelRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  getHistory,
  createHistory,
  clearHistory,
  updateUser,
} from './api';
import { sendViaProxy, sendStatic } from './requestSender';
import {
  findRequestInItems,
  findFolderInItems,
  removeItemInPlace,
  flattenRequests,
  requestExistsInCollections,
} from './itemUtils';
import { environmentStore } from './environmentStore.svelte';
import { authStore } from './authStore.svelte';
import type {
  HeaderOrParam,
  RequestItem,
  CollectionItem,
  FolderItem,
  SidebarItem,
  HistoryItem,
  ResponseState,
  User,
  Environment,
} from './types';

function makeRequest(name: string): RequestItem {
  return {
    id: 'req-' + generateId(),
    name,
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    body: '',
    bodyType: 'none',
  };
}

function mapBackendCollection(c: any): CollectionItem | FolderItem {
  const items: SidebarItem[] = [];

  if (c.children) {
    for (const child of c.children) {
      items.push({
        type: 'folder',
        folder: mapBackendCollection(child) as FolderItem,
      });
    }
  }

  if (c.requests) {
    for (const req of c.requests) {
      items.push({
        type: 'request',
        request: mapBackendRequest(req),
      });
    }
  }

  return {
    id: c.id,
    name: c.name,
    items,
  };
}

function mapBackendRequest(r: any): RequestItem {
  let bodyStr = '';
  if (r.body !== null && r.body !== undefined) {
    bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2);
  }
  return {
    id: r.id,
    name: r.name,
    method: r.method,
    url: r.url ?? '',
    headers: Array.isArray(r.headers) ? r.headers.map((h: any) => ({ ...h, id: h.id || generateId() })) : [],
    queryParams: Array.isArray(r.params) ? r.params.map((p: any) => ({ ...p, id: p.id || generateId() })) : [],
    body: bodyStr,
    bodyType: r.body ? 'json' : 'none',
  };
}

function mapBackendHistory(h: any): HistoryItem {
  return {
    id: h.id,
    url: h.url,
    method: h.method,
    status: h.status_code,
    time: h.timing_ms,
    timestamp: new Date(h.created_at).toLocaleTimeString(),
  };
}

export class ApiClientStore {
  collections = $state<CollectionItem[]>([]);
  topLevelRequests = $state<RequestItem[]>([]);
  history = $state<HistoryItem[]>([]);

  activeRequest = $state<RequestItem>({
    id: 'req-' + generateId(),
    name: 'new request',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    body: '',
    bodyType: 'none',
  });

  responseState = $state<ResponseState>({
    loading: false,
    status: null,
    statusText: null,
    time: null,
    size: null,
    headers: [],
    body: null,
  });

  syncStatus = $state<'synced' | 'syncing' | 'offline'>('synced');
  showEnvironmentsModal = $state<boolean>(false);
  routingMode = $state<'static' | 'proxy'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('pb_routing_mode') as 'static' | 'proxy') || 'static'
  );

  // Delegate AuthStore properties and methods for backward compatibility with explicit type annotations
  get currentUser(): User | null { return authStore.currentUser; }
  set currentUser(val: User | null) { authStore.currentUser = val; }
  get showAuthModal(): 'login' | 'register' | null { return authStore.showAuthModal; }
  set showAuthModal(val: 'login' | 'register' | null) { authStore.showAuthModal = val; }
  get showProfileModal(): boolean { return authStore.showProfileModal; }
  set showProfileModal(val: boolean) { authStore.showProfileModal = val; }

  // Delegate EnvironmentStore properties and methods with explicit type annotations
  get environments(): Environment[] { return environmentStore.environments; }
  set environments(val: Environment[]) { environmentStore.environments = val; }
  get activeEnvironmentId(): string { return environmentStore.activeEnvironmentId; }
  set activeEnvironmentId(val: string) { environmentStore.activeEnvironmentId = val; }
  get activeEnvironment(): Environment | undefined { return environmentStore.activeEnvironment; }
  addEnv(n: string) { environmentStore.addEnv(n); }
  updEnv(id: string, n: string) { environmentStore.updEnv(id, n); }
  delEnv(id: string) { environmentStore.delEnv(id); }
  addVar(eid: string) { environmentStore.addVar(eid); }
  delVar(eid: string, vid: string) { environmentStore.delVar(eid, vid); }
  resolveVars(t: string) { return environmentStore.resolveVars(t); }

  sidebarCollapsed = $state<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('pb_sidebar_collapsed') === 'true'
  );

  // ── Sync Logic ──

  async loadData() {
    if (!this.currentUser) {
      this.collections = [];
      this.topLevelRequests = [];
      this.history = [];
      return;
    }
    try {
      this.syncStatus = 'syncing';
      const colRes = await getCollections();
      this.collections = colRes.collections.map(mapBackendCollection);

      const reqRes = await getTopLevelRequests();
      this.topLevelRequests = reqRes.requests.map(mapBackendRequest);

      const histRes = await getHistory();
      this.history = histRes.history.map(mapBackendHistory);

      this.syncStatus = 'synced';
    } catch (e) {
      console.error('Failed to load backend data:', e);
      this.syncStatus = 'offline';
    }
  }

  // ── Collection CRUD ──

  async addCollection(name: string) {
    if (!name.trim()) return;
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        const res = await createCollection(name.trim());
        this.collections = [
          ...this.collections,
          mapBackendCollection(res.collection) as CollectionItem,
        ];
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    } else {
      this.collections = [
        ...this.collections,
        { id: 'col-' + generateId(), name: name.trim(), items: [] },
      ];
    }
  }

  async renameCollection(id: string, newName: string) {
    if (!newName.trim()) return;
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        await updateCollection(id, newName.trim());
        const col = this.collections.find((c) => c.id === id);
        if (col) col.name = newName.trim();
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    } else {
      const col = this.collections.find((c) => c.id === id);
      if (col) col.name = newName.trim();
    }
  }

  async deleteCollection(id: string) {
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        await deleteCollection(id);
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
        return;
      }
    }
    const idx = this.collections.findIndex((c) => c.id === id);
    if (idx === -1) return;
    this.collections.splice(idx, 1);
    if (
      !(
        this.topLevelRequests.some((r) => r.id === this.activeRequest.id) ||
        requestExistsInCollections(this.collections, this.activeRequest.id)
      )
    ) {
      const all = flattenRequests(this.collections.flatMap((c) => c.items));
      if (all.length > 0) {
        this.loadRequest(all[0]);
      }
    }
  }

  // ── Request CRUD ──

  loadRequest(request: RequestItem | Omit<RequestItem, 'name'>) {
    this.activeRequest = {
      id: request.id || generateId(),
      name: 'name' in request ? request.name : 'restored request',
      method: request.method,
      url: request.url,
      headers: request.headers.map((h: HeaderOrParam) => ({ ...h })),
      queryParams: request.queryParams.map((q: HeaderOrParam) => ({ ...q })),
      body: request.body,
      bodyType: request.bodyType,
    };
    this.responseState = {
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
    this.activeRequest[type] = [
      ...this.activeRequest[type],
      { id: generateId(), key: '', value: '', enabled: true },
    ];
  }

  removeField(type: 'headers' | 'queryParams', id: string) {
    this.activeRequest[type] = this.activeRequest[type].filter((item: HeaderOrParam) => item.id !== id);
  }

  async addRequest(collectionId: string, folderId?: string) {
    const reqName = 'new request';
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        const res = await createRequest(reqName, folderId || collectionId);
        const req = mapBackendRequest(res.request);
        const items = this._getTargetItems(collectionId, folderId);
        if (items) {
          items.push({ type: 'request', request: req });
          this.loadRequest(req);
        }
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    } else {
      const req = makeRequest(reqName);
      const items = this._getTargetItems(collectionId, folderId);
      if (items) {
        items.push({ type: 'request', request: req });
        this.loadRequest(req);
      }
    }
  }

  async addTopLevelReq() {
    const reqName = 'new request';
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        const res = await createRequest(reqName, null);
        const req = mapBackendRequest(res.request);
        this.topLevelRequests.push(req);
        this.loadRequest(req);
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    } else {
      const r = makeRequest(reqName);
      this.topLevelRequests.push(r);
      this.loadRequest(r);
    }
  }

  saveToCollection(collectionId: string, folderId?: string): boolean {
    if (
      this.topLevelRequests.some((r) => r.id === this.activeRequest.id) ||
      requestExistsInCollections(this.collections, this.activeRequest.id)
    ) {
      return false;
    }
    const items = this._getTargetItems(collectionId, folderId);
    if (!items) return false;
    items.push({ type: 'request', request: this._snapshotRequest(this.activeRequest) });
    return true;
  }

  saveAsTopLevel(): boolean {
    if (
      this.topLevelRequests.some((r) => r.id === this.activeRequest.id) ||
      requestExistsInCollections(this.collections, this.activeRequest.id)
    ) {
      return false;
    }
    this.topLevelRequests.push(this._snapshotRequest(this.activeRequest));
    return true;
  }

  duplicateRequest(requestId: string) {
    const topReq = this.topLevelRequests.find((r) => r.id === requestId);
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
      this.topLevelRequests.push(clone);
      this.loadRequest(clone);
      return;
    }
    for (const col of this.collections) {
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
        return;
      }
    }
  }

  async renameRequest(requestId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (this.currentUser && !requestId.startsWith('req-')) {
      try {
        this.syncStatus = 'syncing';
        await updateRequest(requestId, { name: trimmed });
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    }
    const topReq = this.topLevelRequests.find((r) => r.id === requestId);
    if (topReq) {
      topReq.name = trimmed;
      if (this.activeRequest.id === requestId) {
        this.activeRequest.name = trimmed;
      }
      return;
    }
    for (const col of this.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        const item = found.container[found.index];
        if (item.type === 'request') {
          item.request.name = trimmed;
          if (this.activeRequest.id === requestId) {
            this.activeRequest.name = trimmed;
          }
        }
        break;
      }
    }
  }

  async deleteRequest(requestId: string) {
    if (this.currentUser && !requestId.startsWith('req-')) {
      try {
        this.syncStatus = 'syncing';
        await deleteRequest(requestId);
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
        return;
      }
    }
    const topIdx = this.topLevelRequests.findIndex((r) => r.id === requestId);
    if (topIdx !== -1) {
      this.topLevelRequests.splice(topIdx, 1);
      if (this.activeRequest.id === requestId) {
        const all = [
          ...this.topLevelRequests,
          ...flattenRequests(this.collections.flatMap((c) => c.items)),
        ];
        if (all.length > 0) {
          this.loadRequest(all[0]);
        } else {
          this.activeRequest = {
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
      return;
    }
    for (const col of this.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        found.container.splice(found.index, 1);
        if (this.activeRequest.id === requestId) {
          const all = flattenRequests(this.collections.flatMap((c) => c.items));
          if (all.length > 0) {
            this.loadRequest(all[0]);
          } else {
            this.activeRequest = {
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
  }

  async saveActiveRequest() {
    const snapshot = this._snapshotRequest(this.activeRequest);
    if (this.currentUser && !snapshot.id.startsWith('req-')) {
      try {
        this.syncStatus = 'syncing';
        let parsedBody = null;
        if (snapshot.bodyType === 'json' && snapshot.body) {
          try {
            parsedBody = JSON.parse(snapshot.body);
          } catch {}
        }
        await updateRequest(snapshot.id, {
          name: snapshot.name,
          method: snapshot.method,
          url: snapshot.url,
          headers: snapshot.headers,
          params: snapshot.queryParams,
          body: parsedBody,
        });
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    }
    const topIdx = this.topLevelRequests.findIndex((r) => r.id === this.activeRequest.id);
    if (topIdx !== -1) {
      this.topLevelRequests[topIdx] = snapshot;
      return;
    }
    for (const col of this.collections) {
      const found = findRequestInItems(col.items, this.activeRequest.id);
      if (found && found.container[found.index].type === 'request') {
        found.container[found.index] = {
          type: 'request',
          request: snapshot,
        };
        break;
      }
    }
  }

  // ── Folder CRUD ──

  async addFolder(collectionId: string, parentFolderId?: string) {
    const folderName = 'new folder';
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        const parentId = parentFolderId || collectionId;
        const res = await createCollection(folderName, parentId);
        const folder = mapBackendCollection(res.collection) as FolderItem;
        const items = this._getTargetItems(collectionId, parentFolderId);
        if (items) {
          items.push({ type: 'folder', folder });
        }
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
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
    }
  }

  async renameFolder(folderId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (this.currentUser && !folderId.startsWith('folder-') && !folderId.startsWith('col-')) {
      try {
        this.syncStatus = 'syncing';
        await updateCollection(folderId, trimmed);
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    }
    for (const col of this.collections) {
      const found = findFolderInItems(col.items, folderId);
      if (found) {
        const item = found.container[found.index];
        if (item.type === 'folder') {
          item.folder.name = trimmed;
        }
        break;
      }
    }
  }

  async deleteFolder(folderId: string) {
    if (this.currentUser && !folderId.startsWith('folder-') && !folderId.startsWith('col-')) {
      try {
        this.syncStatus = 'syncing';
        await deleteCollection(folderId);
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
        return;
      }
    }
    for (const col of this.collections) {
      const found = findFolderInItems(col.items, folderId);
      if (found) {
        found.container.splice(found.index, 1);
        break;
      }
    }
  }

  // ── Drag & Drop ──

  async moveItem(itemId: string, targetCollectionId: string, targetFolderId?: string, insertIndex?: number) {
    let removed: SidebarItem | null = null;
    let isRequest = false;

    const topReqIdx = this.topLevelRequests.findIndex((r) => r.id === itemId);
    if (topReqIdx !== -1) {
      const req = this.topLevelRequests.splice(topReqIdx, 1)[0];
      removed = { type: 'request', request: req };
      isRequest = true;
    } else {
      for (const col of this.collections) {
        removed = removeItemInPlace(col.items, itemId);
        if (removed) {
          isRequest = removed.type === 'request';
          break;
        }
      }
    }
    if (!removed) return;

    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
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
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
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
      this.topLevelRequests.push(removed.request);
    }
  }

  // ── Sending Requests ──

  sendRequest() {
    if (this.responseState.loading) return;
    this.responseState.loading = true;
    this.syncStatus = 'syncing';

    const resolvedUrl = this.resolveVars(this.activeRequest.url);
    const resolvedBody = this.resolveVars(this.activeRequest.body);
    const resolvedHeaders = this.activeRequest.headers.map((h: HeaderOrParam) => ({
      ...h,
      key: this.resolveVars(h.key),
      value: this.resolveVars(h.value),
    }));
    const resolvedQueryParams = this.activeRequest.queryParams.map((q: HeaderOrParam) => ({
      ...q,
      key: this.resolveVars(q.key),
      value: this.resolveVars(q.value),
    }));

    const setResponse = (r: ResponseState) => {
      this.responseState = r;
    };

    const addHistoryCallback = async (h: HistoryItem) => {
      this.history = [h, ...this.history];
      if (this.currentUser) {
        try {
          const headersPayload = this.activeRequest.headers
            .filter((hdr) => hdr.enabled && hdr.key)
            .map((hdr) => ({ key: hdr.key, value: hdr.value, enabled: true }));
          const paramsPayload = this.activeRequest.queryParams
            .filter((p) => p.enabled && p.key)
            .map((p) => ({ key: p.key, value: p.value, enabled: true }));
          let parsedBody = null;
          if (this.activeRequest.bodyType === 'json' && this.activeRequest.body) {
            try {
              parsedBody = JSON.parse(this.activeRequest.body);
            } catch {}
          }
          const respHeadersObj: Record<string, string> = {};
          this.responseState.headers.forEach((hdr) => {
            respHeadersObj[hdr.key] = hdr.value;
          });

          let respParsedBody = null;
          if (this.responseState.body) {
            try {
              respParsedBody = JSON.parse(this.responseState.body);
            } catch {
              respParsedBody = this.responseState.body;
            }
          }

          const sizeBytes = this.responseState.body ? new Blob([this.responseState.body]).size : 0;

          await createHistory({
            url: this.activeRequest.url,
            method: this.activeRequest.method,
            request_headers: headersPayload,
            request_params: paramsPayload,
            request_body: parsedBody,
            status_code: this.responseState.status ?? 0,
            response_headers: Object.entries(respHeadersObj).map(([k, v]) => ({ key: k, value: v })),
            response_body: respParsedBody,
            timing_ms: this.responseState.time ?? 0,
            response_size: sizeBytes,
            request_id: this.activeRequest.id.startsWith('req-') ? null : this.activeRequest.id,
          });
        } catch (e) {
          console.error('Failed to create history on backend:', e);
        }
      }
    };

    const setSyncStatus = (s: 'synced' | 'syncing') => {
      this.syncStatus = s;
    };

    if (this.routingMode === 'proxy') {
      sendViaProxy(
        resolvedUrl,
        resolvedBody,
        resolvedHeaders,
        resolvedQueryParams,
        this.activeRequest.method,
        this.activeRequest.url,
        setResponse,
        addHistoryCallback,
        setSyncStatus
      );
    } else {
      sendStatic(
        resolvedUrl,
        resolvedBody,
        resolvedHeaders,
        resolvedQueryParams,
        this.activeRequest.method,
        this.activeRequest.bodyType,
        this.activeRequest.url,
        setResponse,
        addHistoryCallback,
        setSyncStatus
      );
    }
  }

  async clearHistory() {
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        await clearHistory();
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
        return;
      }
    }
    this.history = [];
  }

  // ── Auth ──

  login(user: User, token: string) {
    authStore.login(user, token);
    this.loadData();
  }

  register(user: User, token: string) {
    authStore.register(user, token);
    this.loadData();
  }

  logout() {
    authStore.logout();
    this.loadData();
  }

  async updateProfile(name: string, email: string, syncEnabled: boolean) {
    authStore.updateProfile(name, email, syncEnabled);
    if (this.currentUser) {
      try {
        this.syncStatus = 'syncing';
        await updateUser(this.currentUser.id, { name, email, sync_enabled: syncEnabled });
        this.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.syncStatus = 'offline';
      }
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('pb_sidebar_collapsed', String(this.sidebarCollapsed));
  }

  async init(): Promise<void> {
    await authStore.init();
    if (authStore.currentUser) {
      await this.loadData();
    }
  }

  // ── Internal Helpers ──

  private _getTargetItems(collectionId: string, folderId?: string): SidebarItem[] | null {
    if (collectionId === 'top-level') {
      return null;
    }
    const col = this.collections.find((c) => c.id === collectionId);
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

export const store = new ApiClientStore();
store.init();
