import { generateId } from './utils';
import { getMe } from './api';
import { sendViaProxy, sendStatic } from './requestSender';
import {
  findRequestInItems,
  findFolderInItems,
  removeItemInPlace,
  flattenRequests,
  requestExistsInCollections,
} from './itemUtils';
import type {
  HeaderOrParam, Environment,
  RequestItem, CollectionItem, FolderItem, SidebarItem,
  HistoryItem, ResponseState, User
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
    bodyType: 'none'
  };
}

export class ApiClientStore {
  collections = $state<CollectionItem[]>([]);
  topLevelRequests = $state<RequestItem[]>([]);
  environments = $state<Environment[]>([
    { id: 'env-local', name: 'local', variables: [
      { id: 'v1', key: 'base_url', value: 'http://localhost', enabled: true },
    ]}
  ]);
  activeEnvironmentId = $state<string>('env-local');

  history = $state<HistoryItem[]>([]);

  activeRequest = $state<RequestItem>({
    id: 'req-' + generateId(),
    name: 'new request',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    body: '',
    bodyType: 'none'
  });

  responseState = $state<ResponseState>({
    loading: false, status: null, statusText: null,
    time: null, size: null, headers: [], body: null
  });

  syncStatus = $state<'synced' | 'syncing' | 'offline'>('synced');
  showEnvironmentsModal = $state<boolean>(false);
  showAuthModal = $state<'login' | 'register' | null>(null);
  showProfileModal = $state<boolean>(false);
  sidebarCollapsed = $state<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('pb_sidebar_collapsed') === 'true'
  );
  currentUser = $state<User | null>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('pb_user'))
      ? JSON.parse(localStorage.getItem('pb_user')!)
      : null
  );
  routingMode = $state<'static' | 'proxy'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('pb_routing_mode') as 'static' | 'proxy') || 'static'
  );

  // ── Environments ──

  get activeEnvironment() { return this.environments.find(e => e.id === this.activeEnvironmentId); }

  addEnv(n: string) { if (n.trim()) this.environments.push({ id: 'env-' + generateId(), name: n.trim(), variables: [] }); }

  updEnv(id: string, n: string) {
    const e = this.environments.find(e => e.id === id);
    if (e && n.trim()) e.name = n.trim();
  }

  delEnv(id: string) {
    if (this.environments.length <= 1) return;
    const i = this.environments.findIndex(e => e.id === id);
    if (i !== -1) this.environments.splice(i, 1);
    if (this.activeEnvironmentId === id) this.activeEnvironmentId = this.environments[0].id;
  }

  addVar(eid: string) {
    const e = this.environments.find(e => e.id === eid);
    if (e) e.variables.push({ id: 'var-' + generateId(), key: '', value: '', enabled: true });
  }

  delVar(eid: string, vid: string) {
    const e = this.environments.find(e => e.id === eid);
    if (e) { const i = e.variables.findIndex(v => v.id === vid); if (i !== -1) e.variables.splice(i, 1); }
  }

  resolveVars(t: string): string {
    if (!t) return t;
    const a = this.activeEnvironment;
    if (!a) return t;
    let r = t;
    for (const v of a.variables) { if (v.enabled && v.key.trim()) r = r.replaceAll(`{{${v.key.trim()}}}`, v.value); }
    return r;
  }
  // ── Collection CRUD ──

  addCollection(name: string) {
    if (!name.trim()) return;
    this.collections = [
      ...this.collections,
      { id: 'col-' + generateId(), name: name.trim(), items: [] }
    ];
  }

  renameCollection(id: string, newName: string) {
    if (!newName.trim()) return;
    const col = this.collections.find(c => c.id === id);
    if (col) col.name = newName.trim();
  }

  deleteCollection(id: string) {
    const idx = this.collections.findIndex(c => c.id === id);
    if (idx === -1) return;
    this.collections.splice(idx, 1);
    // Fallback active request if it was in the deleted collection
    if (!(this.topLevelRequests.some(r => r.id === this.activeRequest.id) || requestExistsInCollections(this.collections, this.activeRequest.id))) {
      const all = flattenRequests(this.collections.flatMap(c => c.items));
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
      bodyType: request.bodyType
    };
    this.responseState = {
      loading: false, status: null, statusText: null,
      time: null, size: null, headers: [], body: null
    };
  }

  addField(type: 'headers' | 'queryParams') {
    this.activeRequest[type] = [
      ...this.activeRequest[type],
      { id: generateId(), key: '', value: '', enabled: true }
    ];
  }

  removeField(type: 'headers' | 'queryParams', id: string) {
    this.activeRequest[type] = this.activeRequest[type].filter((item: HeaderOrParam) => item.id !== id);
  }

  addRequest(collectionId: string, folderId?: string) {
    const req = makeRequest('new request');
    const items = this._getTargetItems(collectionId, folderId);
    if (items) {
      items.push({ type: 'request', request: req });
      this.loadRequest(req);
    }
  }

  addTopLevelReq() { const r = makeRequest('new request'); this.topLevelRequests.push(r); this.loadRequest(r); }

  saveToCollection(collectionId: string, folderId?: string): boolean {
    if (this.topLevelRequests.some(r => r.id === this.activeRequest.id) || requestExistsInCollections(this.collections, this.activeRequest.id)) {
      return false;
    }
    const items = this._getTargetItems(collectionId, folderId);
    if (!items) return false;
    items.push({ type: 'request', request: this._snapshotRequest(this.activeRequest) });
    return true;
  }

  saveAsTopLevel(): boolean {
    if (this.topLevelRequests.some(r => r.id === this.activeRequest.id) || requestExistsInCollections(this.collections, this.activeRequest.id)) return false;
    this.topLevelRequests.push(this._snapshotRequest(this.activeRequest));
    return true;
  }

  duplicateRequest(requestId: string) {
    // Check top-level first
    const topReq = this.topLevelRequests.find(r => r.id === requestId);
    if (topReq) {
      const clone: RequestItem = {
        id: 'req-' + generateId(),
        name: `${topReq.name} copy`,
        method: topReq.method,
        url: topReq.url,
        headers: topReq.headers.map(h => ({ ...h, id: generateId() })),
        queryParams: topReq.queryParams.map(q => ({ ...q, id: generateId() })),
        body: topReq.body,
        bodyType: topReq.bodyType
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
          headers: orig.request.headers.map(h => ({ ...h, id: generateId() })),
          queryParams: orig.request.queryParams.map(q => ({ ...q, id: generateId() })),
          body: orig.request.body,
          bodyType: orig.request.bodyType
        };
        found.container.splice(found.index + 1, 0, { type: 'request', request: clone });
        this.loadRequest(clone);
        return;
      }
    }
  }

  renameRequest(requestId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    // Check top-level first
    const topReq = this.topLevelRequests.find(r => r.id === requestId);
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

  deleteRequest(requestId: string) {
    // Check top-level first
    const topIdx = this.topLevelRequests.findIndex(r => r.id === requestId);
    if (topIdx !== -1) {
      this.topLevelRequests.splice(topIdx, 1);
      if (this.activeRequest.id === requestId) {
        const all = [
          ...this.topLevelRequests,
          ...flattenRequests(this.collections.flatMap(c => c.items))
        ];
        if (all.length > 0) {
          this.loadRequest(all[0]);
        } else {
          this.activeRequest = {
            id: 'req-default', name: 'custom request', method: 'GET', url: '',
            headers: [], queryParams: [], body: '', bodyType: 'none'
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
          const all = flattenRequests(this.collections.flatMap(c => c.items));
          if (all.length > 0) {
            this.loadRequest(all[0]);
          } else {
            this.activeRequest = {
              id: 'req-default', name: 'custom request', method: 'GET', url: '',
              headers: [], queryParams: [], body: '', bodyType: 'none'
            };
          }
        }
        break;
      }
    }
  }

  saveActiveRequest() {
    const topIdx = this.topLevelRequests.findIndex(r => r.id === this.activeRequest.id);
    if (topIdx !== -1) {
      this.topLevelRequests[topIdx] = this._snapshotRequest(this.activeRequest);
      return;
    }
    for (const col of this.collections) {
      const found = findRequestInItems(col.items, this.activeRequest.id);
      if (found && found.container[found.index].type === 'request') {
        found.container[found.index] = {
          type: 'request',
          request: this._snapshotRequest(this.activeRequest)
        };
        break;
      }
    }
  }
  // ── Folder CRUD ──

  addFolder(collectionId: string, parentFolderId?: string) {
    const folder: FolderItem = {
      id: 'folder-' + generateId(),
      name: 'new folder',
      items: []
    };
    const items = this._getTargetItems(collectionId, parentFolderId);
    if (items) {
      items.push({ type: 'folder', folder });
    }
  }

  renameFolder(folderId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
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

  deleteFolder(folderId: string) {
    for (const col of this.collections) {
      const found = findFolderInItems(col.items, folderId);
      if (found) {
        found.container.splice(found.index, 1);
        break;
      }
    }
  }
  // ── Drag & Drop ──

  moveItem(itemId: string, targetCollectionId: string, targetFolderId?: string, insertIndex?: number) {
    let removed: SidebarItem | null = null;

    // Remove from current location (includes top-level)
    const topReqIdx = this.topLevelRequests.findIndex(r => r.id === itemId);
    if (topReqIdx !== -1) {
      const req = this.topLevelRequests.splice(topReqIdx, 1)[0];
      removed = { type: 'request', request: req };
    } else {
      for (const col of this.collections) {
        removed = removeItemInPlace(col.items, itemId);
        if (removed) break;
      }
    }
    if (!removed) return;

    // Insert into target
    const targetItems = this._getTargetItems(targetCollectionId, targetFolderId);
    if (targetItems) {
      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= targetItems.length) {
        targetItems.splice(insertIndex, 0, removed);
      } else {
        targetItems.push(removed);
      }
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
      ...h, key: this.resolveVars(h.key), value: this.resolveVars(h.value)
    }));
    const resolvedQueryParams = this.activeRequest.queryParams.map((q: HeaderOrParam) => ({
      ...q, key: this.resolveVars(q.key), value: this.resolveVars(q.value)
    }));

    const setResponse = (r: ResponseState) => { this.responseState = r; };
    const addHistory = (h: HistoryItem) => { this.history = [h, ...this.history]; };
    const setSyncStatus = (s: 'synced' | 'syncing') => { this.syncStatus = s; };

    if (this.routingMode === 'proxy') {
      sendViaProxy(
        resolvedUrl, resolvedBody, resolvedHeaders, resolvedQueryParams,
        this.activeRequest.method, this.activeRequest.url,
        setResponse, addHistory, setSyncStatus
      );
    } else {
      sendStatic(
        resolvedUrl, resolvedBody, resolvedHeaders, resolvedQueryParams,
        this.activeRequest.method, this.activeRequest.bodyType,
        this.activeRequest.url,
        setResponse, addHistory, setSyncStatus
      );
    }
  }

  clearHistory() {
    this.history = [];
  }
  // ── Auth ──

  login(user: User, token: string) {
    this.currentUser = user;
    localStorage.setItem('pb_user', JSON.stringify(user));
    localStorage.setItem('pb_token', token);
    this.showAuthModal = null;
  }

  register(user: User, token: string) {
    this.currentUser = user;
    localStorage.setItem('pb_user', JSON.stringify(user));
    localStorage.setItem('pb_token', token);
    this.showAuthModal = null;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('pb_user');
    localStorage.removeItem('pb_token');
    this.showProfileModal = false;
  }

  updateProfile(name: string, email: string, syncEnabled: boolean) {
    if (this.currentUser) {
      this.currentUser.name = name;
      this.currentUser.email = email;
      this.currentUser.sync_enabled = syncEnabled;
      localStorage.setItem('pb_user', JSON.stringify(this.currentUser));
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('pb_sidebar_collapsed', String(this.sidebarCollapsed));
  }

  async init(): Promise<void> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_token') : null;
    if (!token) return;
    try {
      const user = await getMe();
      this.currentUser = user;
      localStorage.setItem('pb_user', JSON.stringify(user));
    } catch {
      this.currentUser = null;
      localStorage.removeItem('pb_user');
      localStorage.removeItem('pb_token');
    }
  }
  // ── Internal Helpers ──

  private _getTargetItems(collectionId: string, folderId?: string): SidebarItem[] | null {
    const col = this.collections.find(c => c.id === collectionId);
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
      id: req.id, name: req.name, method: req.method, url: req.url,
      headers: req.headers.map(h => ({ ...h })),
      queryParams: req.queryParams.map(q => ({ ...q })),
      body: req.body, bodyType: req.bodyType
    };
  }
}

export const store = new ApiClientStore();
store.init();
