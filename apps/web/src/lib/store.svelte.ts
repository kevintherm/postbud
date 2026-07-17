import { generateId } from './utils';
import { updateUser } from './api';
import { authStore } from './authStore.svelte';
import { environmentStore } from './environmentStore.svelte';
import { CollectionActions } from './collectionActions';
import { RequestActions } from './requestActions';
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

export function mapBackendCollection(c: any): CollectionItem | FolderItem {
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
    timestamp: new Date(h.created_at).toLocaleTimeString(),
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

  private collectionActions = new CollectionActions(this);
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
  loadRequest(request: RequestItem | Omit<RequestItem, 'name'>) { this.collectionActions.loadRequest(request); }
  addField(type: 'headers' | 'queryParams') { this.collectionActions.addField(type); }
  removeField(type: 'headers' | 'queryParams', id: string) { this.collectionActions.removeField(type, id); }
  async addRequest(collectionId: string, folderId?: string) { await this.collectionActions.addRequest(collectionId, folderId); }
  async addTopLevelReq() { await this.collectionActions.addTopLevelReq(); }
  saveToCollection(collectionId: string, folderId?: string): boolean { return this.collectionActions.saveToCollection(collectionId, folderId); }
  saveAsTopLevel(): boolean { return this.collectionActions.saveAsTopLevel(); }
  duplicateRequest(requestId: string) { this.collectionActions.duplicateRequest(requestId); }
  async renameRequest(requestId: string, newName: string) { await this.collectionActions.renameRequest(requestId, newName); }
  async deleteRequest(requestId: string) { await this.collectionActions.deleteRequest(requestId); }
  async saveActiveRequest() { await this.collectionActions.saveActiveRequest(); }
  async addFolder(collectionId: string, parentFolderId?: string) { await this.collectionActions.addFolder(collectionId, parentFolderId); }
  async renameFolder(folderId: string, newName: string) { await this.collectionActions.renameFolder(folderId, newName); }
  async deleteFolder(folderId: string) { await this.collectionActions.deleteFolder(folderId); }
  async moveItem(itemId: string, targetCollectionId: string, targetFolderId?: string, insertIndex?: number) {
    await this.collectionActions.moveItem(itemId, targetCollectionId, targetFolderId, insertIndex);
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
