import { simulateRequest } from './mockEngine';

export interface HeaderOrParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface RequestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  url: string;
  headers: HeaderOrParam[];
  queryParams: HeaderOrParam[];
  body: string;
  bodyType: 'json' | 'raw' | 'none';
}

export interface CollectionItem {
  id: string;
  name: string;
  requests: RequestItem[];
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status: number;
  time: number;
  timestamp: string;
}

export interface ResponseState {
  loading: boolean;
  status: number | null;
  statusText: string | null;
  time: number | null;
  size: string | null;
  headers: Array<{ key: string; value: string }>;
  body: string | null;
}

// Simple unique ID helper
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export class ApiClientStore {
  collections = $state<CollectionItem[]>([
    {
      id: 'col-auth',
      name: 'auth api',
      requests: [
        {
          id: 'req-login',
          name: 'login user',
          method: 'POST',
          url: '/api/v1/login',
          headers: [
            { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
          ],
          queryParams: [],
          body: '{\n  "email": "user@example.com",\n  "password": "password123"\n}',
          bodyType: 'json'
        },
        {
          id: 'req-me',
          name: 'get current user',
          method: 'GET',
          url: '/api/v1/me',
          headers: [
            { id: 'h2', key: 'Authorization', value: 'Bearer jwt.token.here', enabled: true }
          ],
          queryParams: [],
          body: '',
          bodyType: 'none'
        }
      ]
    },
    {
      id: 'col-users',
      name: 'users api',
      requests: [
        {
          id: 'req-users-list',
          name: 'list users',
          method: 'GET',
          url: '/api/v1/users',
          headers: [],
          queryParams: [
            { id: 'p1', key: 'limit', value: '10', enabled: true },
            { id: 'p2', key: 'offset', value: '0', enabled: true }
          ],
          body: '',
          bodyType: 'none'
        },
        {
          id: 'req-user-update',
          name: 'update user profile',
          method: 'PUT',
          url: '/api/v1/users/42',
          headers: [
            { id: 'h3', key: 'Content-Type', value: 'application/json', enabled: true }
          ],
          queryParams: [],
          body: '{\n  "name": "walter gropius",\n  "role": "director"\n}',
          bodyType: 'json'
        }
      ]
    },
    {
      id: 'col-debug',
      name: 'debug api',
      requests: [
        {
          id: 'req-err-500',
          name: 'trigger 500 error',
          method: 'GET',
          url: '/api/v1/error/500',
          headers: [],
          queryParams: [],
          body: '',
          bodyType: 'none'
        },
        {
          id: 'req-err-400',
          name: 'trigger 400 error',
          method: 'GET',
          url: '/api/v1/error/400',
          headers: [],
          queryParams: [],
          body: '',
          bodyType: 'none'
        }
      ]
    }
  ]);

  environments = $state<Environment[]>([
    {
      id: 'env-local',
      name: 'local',
      variables: [
        { id: 'v1', key: 'base_url', value: 'http://localhost:8000', enabled: true },
        { id: 'v2', key: 'auth_token', value: 'jwt.eyJ1c2VySWQiOjQyLCJleHAiOjE3ODMzMDk2MDB9.postbud', enabled: true }
      ]
    },
    {
      id: 'env-staging',
      name: 'staging',
      variables: [
        { id: 'v3', key: 'base_url', value: 'https://api.staging.postbud.app', enabled: true },
        { id: 'v4', key: 'auth_token', value: 'Bearer jwt.staging.token', enabled: true }
      ]
    },
    {
      id: 'env-production',
      name: 'production',
      variables: [
        { id: 'v5', key: 'base_url', value: 'https://api.postbud.app', enabled: true },
        { id: 'v6', key: 'auth_token', value: 'Bearer jwt.production.token', enabled: true }
      ]
    }
  ]);

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

  // Load a request from a collection or history into the editor
  loadRequest(request: RequestItem | Omit<RequestItem, 'name'>) {
    this.activeRequest = {
      id: request.id || generateId(),
      name: 'name' in request ? request.name : 'restored request',
      method: request.method,
      url: request.url,
      headers: request.headers.map(h => ({ ...h })),
      queryParams: request.queryParams.map(q => ({ ...q })),
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
    this.activeRequest[type] = this.activeRequest[type].filter(item => item.id !== id);
  }

  // Simulates executing the active request
  sendRequest() {
    if (this.responseState.loading) return;

    this.responseState.loading = true;
    const startTime = Date.now();

    // Trigger syncing state in background
    this.syncStatus = 'syncing';

    // Resolve placeholders
    const resolvedUrl = this.resolveVariables(this.activeRequest.url);
    const resolvedBody = this.resolveVariables(this.activeRequest.body);
    const resolvedHeaders = this.activeRequest.headers.map(h => ({
      ...h,
      key: this.resolveVariables(h.key),
      value: this.resolveVariables(h.value)
    }));
    const resolvedQueryParams = this.activeRequest.queryParams.map(q => ({
      ...q,
      key: this.resolveVariables(q.key),
      value: this.resolveVariables(q.value)
    }));

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

  // Clear all request logs in history
  clearHistory() {
    this.history = [];
  }
}

// Export single instance of the store to share across components
export const store = new ApiClientStore();
