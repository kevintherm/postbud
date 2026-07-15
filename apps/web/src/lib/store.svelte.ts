import { generateId } from './utils';
import { defaultCollections, defaultEnvironments } from './mockData';
import { getMe } from './api';
import { sendViaProxy, sendMock } from './requestSender';
import {
  findRequestInItems,
  findFolderInItems,
  removeItemInPlace,
  flattenRequests,
  requestExistsInCollections,
} from './itemUtils';
import type {
  HeaderOrParam, EnvironmentVariable, Environment,
  RequestItem, CollectionItem, FolderItem, SidebarItem,
  HistoryItem, ResponseState, User
} from './types';
export type {
  HeaderOrParam, EnvironmentVariable, Environment,
  RequestItem, CollectionItem, FolderItem, SidebarItem,
  HistoryItem, ResponseState, User
};

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
  collections = $state<CollectionItem[]>(defaultCollections);
  environments = $state<Environment[]>(defaultEnvironments);
  activeEnvironmentId = $state<string>('env-local');

  get activeEnvironment(): Environment | undefined {
    return this.environments.find(e => e.id === this.activeEnvironmentId);
  }

  addEnvironment(name: string) {
    if (name.trim()) {
      this.environments = [
        ...this.environments,
        {
          id: 'env-' + generateId(),
          name: name.trim(),
          variables: []
        }
      ];
    }
  }

  updateEnvironment(id: string, newName: string) {
    if (newName.trim()) {
      const env = this.environments.find(e => e.id === id);
      if (env) env.name = newName.trim();
    }
  }

  deleteEnvironment(id: string) {
    if (this.environments.length > 1) {
      this.environments = this.environments.filter(e => e.id !== id);
      if (this.activeEnvironmentId === id) {
        this.activeEnvironmentId = this.environments[0].id;
      }
    }
  }

  addVariable(envId: string) {
    const env = this.environments.find(e => e.id === envId);
    if (env) {
      env.variables = [
        ...env.variables,
        { id: 'var-' + generateId(), key: '', value: '', enabled: true }
      ];
    }
  }

  deleteVariable(envId: string, varId: string) {
    const env = this.environments.find(e => e.id === envId);
    if (env) {
      env.variables = env.variables.filter(v => v.id !== varId);
    }
  }

  resolveVariables(text: string): string {
    if (!text) return text;
    const active = this.activeEnvironment;
    if (!active) return text;
    let resolved = text;
    for (const v of active.variables) {
      if (v.enabled && v.key.trim()) {
        resolved = resolved.replaceAll(`{{${v.key.trim()}}}`, v.value);
      }
    }
    return resolved;
  }

  history = $state<HistoryItem[]>([
    { id: 'hist-1', method: 'GET', url: '/api/v1/users', status: 200, time: 15, timestamp: '12:04:15' },
    { id: 'hist-2', method: 'POST', url: '/api/v1/login', status: 200, time: 48, timestamp: '12:02:10' },
    { id: 'hist-3', method: 'GET', url: '/api/v1/error/500', status: 500, time: 8, timestamp: '11:59:30' }
  ]);

  activeRequest = $state<RequestItem>({
    id: 'req-default',
    name: 'custom request',
    method: 'GET',
    url: '/api/v1/users',
    headers: [
      { id: generateId(), key: 'Accept', value: 'application/json', enabled: true }
    ],
    queryParams: [
      { id: generateId(), key: 'limit', value: '10', enabled: true }
    ],
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
    if (!requestExistsInCollections(this.collections, this.activeRequest.id)) {
      const all = flattenRequests(this.collections.map(c => ({ items: c.items })) as any);
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

  duplicateRequest(requestId: string) {
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
    for (const col of this.collections) {
      const found = findRequestInItems(col.items, requestId);
      if (found) {
        found.container.splice(found.index, 1);
        if (this.activeRequest.id === requestId) {
          const all = flattenRequests(this.collections.map(c => ({ items: c.items })) as any);
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
    for (const col of this.collections) {
      const found = findRequestInItems(col.items, this.activeRequest.id);
      if (found) {
        const item = found.container[found.index];
        if (item.type === 'request') {
          found.container[found.index] = {
            type: 'request',
            request: {
              id: this.activeRequest.id,
              name: this.activeRequest.name,
              method: this.activeRequest.method,
              url: this.activeRequest.url,
              headers: this.activeRequest.headers.map(h => ({ ...h })),
              queryParams: this.activeRequest.queryParams.map(q => ({ ...q })),
              body: this.activeRequest.body,
              bodyType: this.activeRequest.bodyType
            }
          };
        }
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

    // Remove from current location
    for (const col of this.collections) {
      removed = removeItemInPlace(col.items, itemId);
      if (removed) break;
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

    const resolvedUrl = this.resolveVariables(this.activeRequest.url);
    const resolvedBody = this.resolveVariables(this.activeRequest.body);
    const resolvedHeaders = this.activeRequest.headers.map((h: HeaderOrParam) => ({
      ...h, key: this.resolveVariables(h.key), value: this.resolveVariables(h.value)
    }));
    const resolvedQueryParams = this.activeRequest.queryParams.map((q: HeaderOrParam) => ({
      ...q, key: this.resolveVariables(q.key), value: this.resolveVariables(q.value)
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
      sendMock(
        resolvedUrl, resolvedBody, resolvedHeaders, resolvedQueryParams,
        this.activeRequest.method, this.activeRequest.url,
        this.activeEnvironment?.name || 'none',
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
}

export const store = new ApiClientStore();
store.init();
