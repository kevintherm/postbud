import { simulateRequest } from './mockEngine';
import { generateId } from './utils';
import { defaultCollections, defaultEnvironments } from './mockData';
import type { HeaderOrParam, EnvironmentVariable, Environment, RequestItem, CollectionItem, HistoryItem, ResponseState, User } from './types';
export type { HeaderOrParam, EnvironmentVariable, Environment, RequestItem, CollectionItem, HistoryItem, ResponseState, User };

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
      if (env) {
        env.name = newName.trim();
      }
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
        {
          id: 'var-' + generateId(),
          key: '',
          value: '',
          enabled: true
        }
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
        const placeholder = `{{${v.key.trim()}}}`;
        resolved = resolved.replaceAll(placeholder, v.value);
      }
    }
    return resolved;
  }

  history = $state<HistoryItem[]>([
    {
      id: 'hist-1',
      method: 'GET',
      url: '/api/v1/users',
      status: 200,
      time: 15,
      timestamp: '12:04:15'
    },
    {
      id: 'hist-2',
      method: 'POST',
      url: '/api/v1/login',
      status: 200,
      time: 48,
      timestamp: '12:02:10'
    },
    {
      id: 'hist-3',
      method: 'GET',
      url: '/api/v1/error/500',
      status: 500,
      time: 8,
      timestamp: '11:59:30'
    }
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
    loading: false,
    status: null,
    statusText: null,
    time: null,
    size: null,
    headers: [],
    body: null
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


  // Load a request from a collection or history into the editor
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
    // Clear response panel when loading a new request
    this.responseState = {
      loading: false,
      status: null,
      statusText: null,
      time: null,
      size: null,
      headers: [],
      body: null
    };
  }

  // Add header or query parameter
  addField(type: 'headers' | 'queryParams') {
    this.activeRequest[type] = [
      ...this.activeRequest[type],
      { id: generateId(), key: '', value: '', enabled: true }
    ];
  }

  // Remove header or query parameter
  removeField(type: 'headers' | 'queryParams', id: string) {
    this.activeRequest[type] = this.activeRequest[type].filter((item: HeaderOrParam) => item.id !== id);
  }

  duplicateRequest(requestId: string) {
    for (const col of this.collections) {
      const idx = col.requests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        const orig = col.requests[idx];
        const clone: RequestItem = {
          id: 'req-' + generateId(),
          name: `${orig.name} copy`,
          method: orig.method,
          url: orig.url,
          headers: orig.headers.map(h => ({ ...h, id: generateId() })),
          queryParams: orig.queryParams.map(q => ({ ...q, id: generateId() })),
          body: orig.body,
          bodyType: orig.bodyType
        };
        col.requests = [
          ...col.requests.slice(0, idx + 1),
          clone,
          ...col.requests.slice(idx + 1)
        ];
        this.loadRequest(clone);
        return;
      }
    }
  }

  renameRequest(requestId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    for (const col of this.collections) {
      const req = col.requests.find(r => r.id === requestId);
      if (req) {
        req.name = trimmed;
        if (this.activeRequest.id === requestId) {
          this.activeRequest.name = trimmed;
        }
        break;
      }
    }
  }

  deleteRequest(requestId: string) {
    for (const col of this.collections) {
      const idx = col.requests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        col.requests = col.requests.filter(r => r.id !== requestId);
        if (this.activeRequest.id === requestId) {
          let fallback = false;
          for (const c of this.collections) {
            if (c.requests.length > 0) {
              this.loadRequest(c.requests[0]);
              fallback = true;
              break;
            }
          }
          if (!fallback) {
            this.activeRequest = {
              id: 'req-default',
              name: 'custom request',
              method: 'GET',
              url: '/api/v1/users',
              headers: [],
              queryParams: [],
              body: '',
              bodyType: 'none'
            };
          }
        }
        break;
      }
    }
  }

  saveActiveRequest() {
    for (const col of this.collections) {
      const idx = col.requests.findIndex(r => r.id === this.activeRequest.id);
      if (idx !== -1) {
        col.requests[idx] = {
          id: this.activeRequest.id,
          name: this.activeRequest.name,
          method: this.activeRequest.method,
          url: this.activeRequest.url,
          headers: this.activeRequest.headers.map(h => ({ ...h })),
          queryParams: this.activeRequest.queryParams.map(q => ({ ...q })),
          body: this.activeRequest.body,
          bodyType: this.activeRequest.bodyType
        };
        break;
      }
    }
  }

  // Executes the active request (mocked or live fetch)
  sendRequest() {
    if (this.responseState.loading) return;

    this.responseState.loading = true;
    const startTime = Date.now();

    // Trigger syncing state in background
    this.syncStatus = 'syncing';

    // Resolve placeholders
    const resolvedUrl = this.resolveVariables(this.activeRequest.url);
    const resolvedBody = this.resolveVariables(this.activeRequest.body);
    const resolvedHeaders = this.activeRequest.headers.map((h: HeaderOrParam) => ({
      ...h,
      key: this.resolveVariables(h.key),
      value: this.resolveVariables(h.value)
    }));
    const resolvedQueryParams = this.activeRequest.queryParams.map((q: HeaderOrParam) => ({
      ...q,
      key: this.resolveVariables(q.key),
      value: this.resolveVariables(q.value)
    }));

    if (this.routingMode === 'proxy') {
      // Build Headers object
      const headersInit: Record<string, string> = {};
      resolvedHeaders.forEach((h: HeaderOrParam) => {
        if (h.enabled && h.key) {
          headersInit[h.key] = h.value;
        }
      });

      // Build Query params
      let finalUrl = resolvedUrl;
      const enabledParams = resolvedQueryParams.filter((q: HeaderOrParam) => q.enabled && q.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach((p: HeaderOrParam) => {
          searchParams.append(p.key, p.value);
        });
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl += separator + searchParams.toString();
      }

      // Build request init options
      const options: RequestInit = {
        method: this.activeRequest.method,
        headers: headersInit
      };

      if (this.activeRequest.method !== 'GET' && resolvedBody) {
        options.body = resolvedBody;
      }

      fetch(finalUrl, options)
        .then(async (res) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const text = await res.text();
          
          const sizeBytes = new Blob([text]).size;
          const sizeFormatted = sizeBytes > 1024 
            ? (sizeBytes / 1024).toFixed(2) + ' KB' 
            : sizeBytes + ' B';

          // Format response headers as array of key/value pairs
          const respHeadersArr: { key: string; value: string }[] = [];
          res.headers.forEach((val, key) => {
            respHeadersArr.push({ key, value: val });
          });

          this.responseState = {
            loading: false,
            status: res.status,
            statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
            time: duration,
            size: sizeFormatted,
            headers: respHeadersArr,
            body: text
          };

          // Add to history
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          this.history = [
            {
              id: generateId(),
              method: this.activeRequest.method,
              url: this.activeRequest.url,
              status: res.status,
              time: duration,
              timestamp: timeStr
            },
            ...this.history
          ];
          
          setTimeout(() => {
            this.syncStatus = 'synced';
          }, 800);
        })
        .catch(err => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.responseState = {
            loading: false,
            status: 0,
            statusText: 'Network Error',
            time: duration,
            size: '0 B',
            headers: [],
            body: err instanceof Error ? err.message : String(err)
          };
          this.syncStatus = 'synced';
        });
    } else {
      // Simulate server latency
      setTimeout(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const activeEnvName = this.activeEnvironment?.name || 'none';
        const simResponse = simulateRequest(
          this.activeRequest.method,
          resolvedUrl,
          resolvedBody,
          resolvedHeaders,
          resolvedQueryParams,
          activeEnvName
        );

        const sizeBytes = new Blob([simResponse.body]).size;
        const sizeFormatted = sizeBytes > 1024 
          ? (sizeBytes / 1024).toFixed(2) + ' KB' 
          : sizeBytes + ' B';

        // Update response state
        this.responseState = {
          loading: false,
          status: simResponse.status,
          statusText: simResponse.statusText,
          time: duration,
          size: sizeFormatted,
          headers: simResponse.headers,
          body: simResponse.body
        };

        // Add to history
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        
        this.history = [
          {
            id: generateId(),
            method: this.activeRequest.method,
            url: this.activeRequest.url,
            status: simResponse.status,
            time: duration,
            timestamp: timeStr
          },
          ...this.history
        ];

        // Reset sync simulation
        setTimeout(() => {
          this.syncStatus = 'synced';
        }, 800);

      }, 600);
    }
  }

  // Clear all request logs in history
  clearHistory() {
    this.history = [];
  }

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

  updateProfile(username: string, email: string, syncEnabled: boolean) {
    if (this.currentUser) {
      this.currentUser.username = username;
      this.currentUser.email = email;
      this.currentUser.sync_enabled = syncEnabled;
      localStorage.setItem('pb_user', JSON.stringify(this.currentUser));
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('pb_sidebar_collapsed', String(this.sidebarCollapsed));
  }
}

// Export single instance of the store to share across components
export const store = new ApiClientStore();
