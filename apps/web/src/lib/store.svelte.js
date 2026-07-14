import { tick } from 'svelte';
import { getRepository } from './repository/DataRepository.js';
import { getMeta, setMeta, clearMeta, getCollections, getEnvironments, getHistory, clearHistory, deleteCollection, deleteEnvironment, deleteHistoryEntry } from './db.js';
import { uuid, defaultRequest, parseParamsFromUrl, buildUrlWithParams } from './utils.js';

class PostbudStore {
  history = $state([]);
  collections = $state([]);
  environments = $state([]);
  activeEnvId = $state('');
  activeCollectionId = $state('');
  activeRequest = $state(defaultRequest());
  activeResponse = $state(null);
  isSending = $state(false);
  executionMode = $state('proxy');
  
  // Auth state
  token = $state(null);
  activeUser = $state(null);
  showAuth = $state(false);
  isAppLoading = $state(true);

  batchRunner = $state({
    isOpen: false,
    isRunning: false,
    results: [],
    total: 0,
    current: 0,
    collectionName: ''
  });

  repository = null;
  activeAbortController = null;

  constructor() {
    this.init();
    
    $effect.root(() => {
      $effect(() => {
        const id = this.activeEnvId;
        if (id) setMeta('activeEnvId', id).catch(console.error);
      });
      $effect(() => {
        const id = this.activeCollectionId;
        if (id) setMeta('activeCollectionId', id).catch(console.error);
      });
      $effect(() => {
        const mode = this.executionMode;
        if (mode) setMeta('executionMode', mode).catch(console.error);
      });
      $effect(() => {
        const envs = $state.snapshot(this.environments);
        if (this.repository && envs.length > 0) {
          for (const env of envs) {
            this.repository.saveEnvironment(env).catch(console.error);
          }
        }
      });
      $effect(() => {
        const cols = $state.snapshot(this.collections);
        if (this.repository && cols.length > 0) {
          for (const col of cols) {
            this.repository.saveCollection(col).catch(console.error);
          }
        }
      });
    });
  }

  async init() {
    try {
      this.token = await getMeta('token') || null;
      this.activeUser = await getMeta('activeUser') || null;
      this.activeEnvId = await getMeta('activeEnvId') || '';
      this.activeCollectionId = await getMeta('activeCollectionId') || '';
      this.executionMode = await getMeta('executionMode') || 'proxy';

      if (this.token) {
        // Validate token with profile fetch
        const res = await fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (!res.ok) {
          // Token expired or invalid
          await this.logout();
        }
      }
    } catch (e) {
      console.error('Failed restoring auth session', e);
    }

    this.repository = getRepository(this.token);
    await this.syncFromRepository();

    setTimeout(() => {
      this.isAppLoading = false;
    }, 800);
  }

  async syncFromRepository() {
    try {
      this.collections = await this.repository.getCollections();
      this.environments = await this.repository.getEnvironments();
      this.history = await this.repository.getHistory();
    } catch (e) {
      console.error('Failed fetching data from repository', e);
    }

    // Load defaults if empty
    if (this.environments.length === 0) {
      const defaultEnvId = 'env-' + uuid();
      this.environments = [{
        id: defaultEnvId,
        name: 'development',
        variables: [
          { key: 'host', value: 'http://localhost:8000', enabled: true },
          { key: 'api_path', value: 'api', enabled: true }
        ]
      }];
      this.activeEnvId = defaultEnvId;
    }

    if (this.collections.length === 0) {
      const defaultColId = 'col-' + uuid();
      this.collections = [{
        id: defaultColId,
        name: 'backend demo',
        requests: [
          {
            id: 'req-' + uuid(),
            name: 'hello world',
            method: 'GET',
            url: '{{host}}/',
            headers: [],
            params: [],
            body: ''
          },
          {
            id: 'req-' + uuid(),
            name: 'get openapi json',
            method: 'GET',
            url: '{{host}}/{{api_path}}/openapi.json',
            headers: [],
            params: [],
            body: ''
          }
        ]
      }];
    }

    const hasActiveCol = this.collections.some(c => c.id === this.activeCollectionId);
    if (!hasActiveCol && this.collections.length > 0) {
      this.activeCollectionId = this.collections[0].id;
    }
  }

  async login(token, user) {
    this.token = token;
    this.activeUser = user;
    await setMeta('token', token);
    await setMeta('activeUser', user);

    // Get current guest data before switching repository
    const guestCollections = await getCollections();
    const guestEnvironments = await getEnvironments();
    const guestHistory = await getHistory();

    // Switch to cloud repository
    this.repository = getRepository(this.token);

    // Upload guest data to cloud
    for (const col of guestCollections) {
      await this.repository.saveCollection(col);
    }
    for (const env of guestEnvironments) {
      await this.repository.saveEnvironment(env);
    }
    for (const entry of guestHistory) {
      await this.repository.saveHistoryEntry(entry);
    }

    // Clear local IndexedDB to avoid showing guest data again on logout
    const guestDbCollections = await getCollections();
    for (const c of guestDbCollections) {
      await deleteCollection(c.id);
    }
    const guestDbEnvironments = await getEnvironments();
    for (const e of guestDbEnvironments) {
      await deleteEnvironment(e.id);
    }
    await clearHistory();

    // Fetch cloud data
    await this.syncFromRepository();
    this.showAuth = false;
  }

  async logout() {
    this.token = null;
    this.activeUser = null;
    await clearMeta('token');
    await clearMeta('activeUser');

    this.repository = getRepository(null);
    this.collections = [];
    this.environments = [];
    this.history = [];

    await this.syncFromRepository();
  }

  get activeEnvVars() {
    const env = this.environments.find(e => e.id === this.activeEnvId);
    if (!env) return {};
    const dict = {};
    for (const v of env.variables) {
      if (v.enabled && v.key) {
        dict[v.key] = v.value;
      }
    }
    return dict;
  }

  replaceVars(str) {
    if (!str) return '';
    const vars = this.activeEnvVars;
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmed = key.trim();
      return vars[trimmed] !== undefined ? vars[trimmed] : match;
    });
  }

  syncUrlFromParams() {
    this.activeRequest.url = buildUrlWithParams(this.activeRequest.url, this.activeRequest.params);
  }

  syncParamsFromUrl() {
    this.activeRequest.params = parseParamsFromUrl(this.activeRequest.url);
  }

  async sendRequest(requestTemplate = this.activeRequest) {
    const isEditingCurrent = requestTemplate === this.activeRequest;
    
    if (isEditingCurrent) {
      if (this.activeAbortController) {
        this.activeAbortController.abort();
      }
      this.activeAbortController = new AbortController();
      this.isSending = true;
      this.activeResponse = null;

      // Automatically save to the active collection
      if (this.activeCollectionId) {
        await this.saveToCollection(this.activeCollectionId);
      }
    }

    const resolvedUrl = this.replaceVars(requestTemplate.url);
    const resolvedMethod = requestTemplate.method;
    
    const reqHeaders = {};
    for (const h of requestTemplate.headers) {
      if (h.enabled && h.key) {
        reqHeaders[this.replaceVars(h.key)] = this.replaceVars(h.value);
      }
    }

    const resolvedBody = this.replaceVars(requestTemplate.body);
    let responseResult = null;

    try {
      if (this.executionMode === 'proxy') {
        const fetchOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: resolvedUrl,
            method: resolvedMethod,
            headers: reqHeaders,
            body: resolvedBody
          }),
        };
        if (isEditingCurrent) {
          fetchOptions.signal = this.activeAbortController.signal;
        }

        const res = await fetch('/api/proxy', fetchOptions);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `server returned code ${res.status}`);
        }

        responseResult = await res.json();
      } else {
        const startTime = performance.now();
        const fetchOptions = {
          method: resolvedMethod,
          headers: reqHeaders,
        };
        if (resolvedBody && resolvedMethod !== 'GET' && resolvedMethod !== 'HEAD') {
          fetchOptions.body = resolvedBody;
        }
        if (isEditingCurrent) {
          fetchOptions.signal = this.activeAbortController.signal;
        }

        const res = await fetch(resolvedUrl, fetchOptions);
        const endTime = performance.now();
        
        const bodyText = await res.text();
        const headers = {};
        res.headers.forEach((val, name) => {
          headers[name] = val;
        });

        responseResult = {
          status: res.status,
          headers,
          body: bodyText,
          time: Math.round(endTime - startTime),
          size: bodyText.length
        };
      }

      const historyItem = {
        id: uuid(),
        url: requestTemplate.url || resolvedUrl,
        method: resolvedMethod,
        status: responseResult.status,
        time: responseResult.time,
        size: responseResult.size || 0,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      this.history = [historyItem, ...this.history].slice(0, 50);
      if (this.repository) {
        await this.repository.saveHistoryEntry(historyItem);
      }
      
      if (isEditingCurrent) {
        this.activeResponse = responseResult;
      }

      return responseResult;

    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      const errorResponse = {
        status: 0,
        headers: {},
        body: `error: ${err.message}`,
        time: 0,
        size: 0,
        error: true
      };
      if (isEditingCurrent) {
        this.activeResponse = errorResponse;
      }
      return errorResponse;
    } finally {
      if (isEditingCurrent) {
        this.isSending = false;
      }
    }
  }

  loadRequest(req) {
    this.activeRequest = {
      id: req.id || uuid(),
      name: req.name || 'new request',
      method: req.method || 'GET',
      url: req.url || '',
      headers: req.headers?.length ? JSON.parse(JSON.stringify(req.headers)) : [{ key: '', value: '', enabled: true }],
      params: req.params?.length ? JSON.parse(JSON.stringify(req.params)) : [{ key: '', value: '', enabled: true }],
      body: req.body || ''
    };
    if (this.activeRequest.params.length === 0 || this.activeRequest.params[this.activeRequest.params.length - 1].key !== '') {
      this.activeRequest.params.push({ key: '', value: '', enabled: true });
    }
    if (this.activeRequest.headers.length === 0 || this.activeRequest.headers[this.activeRequest.headers.length - 1].key !== '') {
      this.activeRequest.headers.push({ key: '', value: '', enabled: true });
    }
    this.activeResponse = null;
  }

  async saveToCollection(collectionId) {
    const colIndex = this.collections.findIndex(c => c.id === collectionId);
    if (colIndex === -1) return;

    const requestCopy = JSON.parse(JSON.stringify(this.activeRequest));
    requestCopy.headers = requestCopy.headers.filter(h => h.key || h.value);
    requestCopy.params = requestCopy.params.filter(p => p.key || p.value);

    if (!requestCopy.id) {
      requestCopy.id = uuid();
      this.activeRequest.id = requestCopy.id;
    }

    const col = this.collections[colIndex];
    const reqs = col.requests ? [...col.requests] : [];
    const reqIndex = reqs.findIndex(r => r.id === requestCopy.id);
    
    if (reqIndex !== -1) {
      reqs[reqIndex] = requestCopy;
    } else {
      reqs.push(requestCopy);
    }
    
    this.collections[colIndex] = {
      ...col,
      requests: reqs
    };
    this.collections = [...this.collections];

    if (this.repository) {
      await this.repository.saveRequestTemplate(collectionId, requestCopy);
    }
  }

  async deleteFromCollection(collectionId, requestId) {
    const colIndex = this.collections.findIndex(c => c.id === collectionId);
    if (colIndex === -1) return;
    
    const col = this.collections[colIndex];
    const reqs = (col.requests || []).filter(r => r.id !== requestId);
    
    this.collections[colIndex] = {
      ...col,
      requests: reqs
    };
    this.collections = [...this.collections];

    if (this.repository) {
      await this.repository.deleteRequestTemplate(collectionId, requestId);
    }
  }

  async addCollection(name) {
    if (!name) return;
    const col = { id: uuid(), name, requests: [] };
    this.collections = [...this.collections, col];
    if (this.repository) await this.repository.saveCollection(col);
  }

  async deleteCollection(collectionId) {
    if (this.collections.length <= 1) return;
    this.collections = this.collections.filter(c => c.id !== collectionId);
    if (this.repository) await this.repository.deleteCollection(collectionId);
    if (this.activeCollectionId === collectionId && this.collections.length > 0) {
      this.activeCollectionId = this.collections[0].id;
    }
  }

  async deleteEnvironment(id) {
    this.environments = this.environments.filter(e => e.id !== id);
    if (this.repository) await this.repository.deleteEnvironment(id);
  }

  async deleteHistoryEntry(id) {
    this.history = this.history.filter(h => h.id !== id);
    if (this.repository) await this.repository.deleteHistoryEntry(id);
  }

  async clearHistory() {
    this.history = [];
    if (this.repository) await this.repository.clearHistory();
  }

  async runBatch(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection || collection.requests.length === 0) return;

    this.batchRunner = {
      isOpen: true,
      isRunning: true,
      results: [],
      total: collection.requests.length,
      current: 0,
      collectionName: collection.name
    };

    for (let i = 0; i < collection.requests.length; i++) {
      const req = collection.requests[i];
      this.batchRunner.current = i + 1;
      
      const result = await this.sendRequest(req);
      
      this.batchRunner.results = [...this.batchRunner.results, {
        name: req.name,
        method: req.method,
        url: req.url,
        status: result.status,
        time: result.time,
        error: result.error || result.status >= 400 || result.status === 0
      }];
    }

    this.batchRunner.isRunning = false;
  }
}

export const store = new PostbudStore();
