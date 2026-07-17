import { generateId } from './utils';
import { updateUser } from './api';
import { authStore } from './authStore.svelte';
import { environmentStore } from './environmentStore.svelte';
import { CollectionActions } from './collectionActions';
import { RequestCrudActions } from './requestCrudActions';
import { RequestActions } from './requestActions';
import type {
  HeaderOrParam,
  RequestItem,
  CollectionItem,
  SidebarItem,
  HistoryItem,
  ResponseState,
  User,
  Environment,
} from './types';

export function makeRequest(name: string): RequestItem {
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

export function mapBackendCollection(c: any): CollectionItem {
  const items: SidebarItem[] = [];

  if (c.children) {
    for (const child of c.children) {
      items.push({
        type: 'collection',
        collection: mapBackendCollection(child),
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

export function mapBackendRequest(r: any): RequestItem {
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

export function mapBackendHistory(h: any): HistoryItem {
  return {
    id: h.id,
    url: h.url,
    method: h.method,
    status: h.status_code,
    time: h.timing_ms,
    timestamp: new Date(h.executed_at || h.created_at).toLocaleTimeString(),
    requestId: h.request_id,
    requestHeaders: Array.isArray(h.request_headers)
      ? h.request_headers.map((hdr: any) => ({ ...hdr, id: hdr.id || generateId() }))
      : [],
    requestParams: Array.isArray(h.request_params)
      ? h.request_params.map((p: any) => ({ ...p, id: p.id || generateId() }))
      : [],
    requestBody: h.request_body ? (typeof h.request_body === 'string' ? h.request_body : JSON.stringify(h.request_body)) : '',
    responseHeaders: Array.isArray(h.response_headers) ? h.response_headers : [],
    responseBody: h.response_body,
    responseSize: h.response_size,
  };
}

export function filterDuplicatesById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
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
  sidebarCollapsed = $state<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('pb_sidebar_collapsed') === 'true'
  );

  public collectionActions = new CollectionActions(this);
  public requestCrudActions = new RequestCrudActions(this);
  private requestActions = new RequestActions(this);

  // Delegate AuthStore properties
  get currentUser(): User | null { return authStore.currentUser; }
  set currentUser(val: User | null) { authStore.currentUser = val; }
  get showAuthModal(): 'login' | 'register' | null { return authStore.showAuthModal; }
  set showAuthModal(val: 'login' | 'register' | null) { authStore.showAuthModal = val; }
  get showProfileModal(): boolean { return authStore.showProfileModal; }
  set showProfileModal(val: boolean) { authStore.showProfileModal = val; }

  // Delegate EnvironmentStore properties
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

  // Delegate Collection Actions
  async loadData() { await this.collectionActions.loadData(); }
  async addCollection(name: string) { await this.collectionActions.addCollection(name); }
  async renameCollection(id: string, newName: string) { await this.collectionActions.renameCollection(id, newName); }
  async deleteCollection(id: string) { await this.collectionActions.deleteCollection(id); }
  loadRequest(request: RequestItem | Omit<RequestItem, 'name'>) { this.requestCrudActions.loadRequest(request); }
  loadHistoryItem(log: HistoryItem) { this.requestCrudActions.loadHistoryItem(log); }
  addField(type: 'headers' | 'queryParams') { this.requestCrudActions.addField(type); }
  removeField(type: 'headers' | 'queryParams', id: string) { this.requestCrudActions.removeField(type, id); }
  async addRequest(parentId: string) { await this.requestCrudActions.addRequest(parentId); }
  async addTopLevelReq() { await this.requestCrudActions.addTopLevelReq(); }
  saveToCollection(parentId: string): boolean { return this.requestCrudActions.saveToCollection(parentId); }
  saveAsTopLevel(): boolean { return this.requestCrudActions.saveAsTopLevel(); }
  duplicateRequest(requestId: string) { this.requestCrudActions.duplicateRequest(requestId); }
  async renameRequest(requestId: string, newName: string) { await this.requestCrudActions.renameRequest(requestId, newName); }
  async deleteRequest(requestId: string) { await this.requestCrudActions.deleteRequest(requestId); }
  async saveActiveRequest() { await this.requestCrudActions.saveActiveRequest(); }
  async addSubCollection(parentId: string) { await this.collectionActions.addSubCollection(parentId); }
  async moveItem(itemId: string, targetParentId: string, insertIndex?: number) {
    await this.requestCrudActions.moveItem(itemId, targetParentId, insertIndex);
  }
  saveGuestData() { this.collectionActions.saveGuestData(); }

  // Delegate Request Actions
  sendRequest() { this.requestActions.sendRequest(); }
  async clearHistory() { await this.requestActions.clearHistory(); }

  // Auth Operations
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
    await this.loadData();
  }
}

export const store = new ApiClientStore();
store.init();
