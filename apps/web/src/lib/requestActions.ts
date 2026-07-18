import { mapBackendHistory, type ApiClientStore } from './store.svelte';
import { createHistory, clearHistory } from './api';
import { sendViaProxy, sendStatic } from './requestSender';
import type {
  HeaderOrParam,
  HistoryItem,
  ResponseState,
} from './types';

export class RequestActions {
  constructor(private store: ApiClientStore) {}

  sendRequest() {
    if (this.store.responseState.loading) return;

    const url = this.store.activeRequest.url || '';
    const resolvedUrl = this.store.resolveVars(url).trim();
    if (!resolvedUrl) {
      this.store.responseState = {
        loading: false,
        status: 0,
        statusText: 'Error',
        time: 0,
        size: '0 B',
        headers: [],
        body: 'URL cannot be empty.'
      };
      return;
    }

    this.store.responseState.loading = true;
    this.store.syncStatus = 'syncing';

    const resolvedBody = this.store.resolveVars(this.store.activeRequest.body);
    const resolvedHeaders = this.store.activeRequest.headers.map((h: HeaderOrParam) => ({
      ...h,
      key: this.store.resolveVars(h.key),
      value: this.store.resolveVars(h.value),
    }));
    const resolvedQueryParams = this.store.activeRequest.queryParams.map((q: HeaderOrParam) => ({
      ...q,
      key: this.store.resolveVars(q.key),
      value: this.store.resolveVars(q.value),
    }));

    const setResponse = (r: ResponseState) => {
      this.store.responseState = r;
    };

    const addHistoryCallback = async (h: HistoryItem) => {
      const respHeadersObj: Record<string, string> = {};
      this.store.responseState.headers.forEach((hdr) => {
        respHeadersObj[hdr.key] = hdr.value;
      });

      const sizeBytes = this.store.responseState.body ? new Blob([this.store.responseState.body]).size : 0;

      const completedHistoryItem: HistoryItem = {
        id: h.id,
        method: h.method,
        url: h.url,
        status: h.status,
        time: h.time,
        timestamp: h.timestamp,
        requestId: this.store.activeRequest.id,
        requestHeaders: this.store.activeRequest.headers.map((hdr) => ({ ...hdr })),
        requestParams: this.store.activeRequest.queryParams.map((p) => ({ ...p })),
        requestBody: this.store.activeRequest.body,
        responseHeaders: this.store.responseState.headers || [],
        responseBody: this.store.responseState.body,
        responseSize: sizeBytes,
      };

      this.store.history = [completedHistoryItem, ...this.store.history];
      if (this.store.currentUser) {
        try {
          const headersPayload = this.store.activeRequest.headers
            .filter((hdr) => hdr.enabled && hdr.key)
            .map((hdr) => ({ key: hdr.key, value: hdr.value, enabled: true }));
          const paramsPayload = this.store.activeRequest.queryParams
            .filter((p) => p.enabled && p.key)
            .map((p) => ({ key: p.key, value: p.value, enabled: true }));
          let parsedBody = null;
          if (this.store.activeRequest.bodyType === 'json' && this.store.activeRequest.body) {
            try {
              parsedBody = JSON.parse(this.store.activeRequest.body);
            } catch {
              parsedBody = this.store.activeRequest.body;
            }
          } else {
            parsedBody = this.store.activeRequest.body || null;
          }

          let respParsedBody = null;
          if (this.store.responseState.body) {
            try {
              respParsedBody = JSON.parse(this.store.responseState.body);
            } catch {
              respParsedBody = this.store.responseState.body;
            }
          }

          const res = await createHistory({
            url: this.store.activeRequest.url,
            method: this.store.activeRequest.method,
            request_headers: headersPayload,
            request_params: paramsPayload,
            request_body: parsedBody,
            status_code: this.store.responseState.status ?? 0,
            response_headers: Object.entries(respHeadersObj).map(([k, v]) => ({ key: k, value: v })),
            response_body: respParsedBody,
            timing_ms: this.store.responseState.time ?? 0,
            response_size: sizeBytes,
            request_id: this.store.activeRequest.id.startsWith('req-') ? null : this.store.activeRequest.id,
          });

          if (res && res.history) {
            const mapped = mapBackendHistory(res.history);
            const idx = this.store.history.findIndex(x => x.id === completedHistoryItem.id);
            if (idx !== -1) {
              this.store.history[idx] = mapped;
            }
          }
        } catch (e) {
          console.error('Failed to create history on backend:', e);
        }
      } else {
        this.store.saveGuestData();
      }
    };

    const setSyncStatus = (s: 'synced' | 'syncing') => {
      this.store.syncStatus = s;
    };

    if (this.store.routingMode === 'proxy') {
      sendViaProxy(
        resolvedUrl,
        resolvedBody,
        resolvedHeaders,
        resolvedQueryParams,
        this.store.activeRequest.method,
        this.store.activeRequest.url,
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
        this.store.activeRequest.method,
        this.store.activeRequest.bodyType,
        this.store.activeRequest.url,
        setResponse,
        addHistoryCallback,
        setSyncStatus
      );
    }
  }

  async clearHistory() {
    if (this.store.currentUser) {
      try {
        this.store.syncStatus = 'syncing';
        await clearHistory();
        this.store.syncStatus = 'synced';
      } catch (e) {
        console.error(e);
        this.store.syncStatus = 'offline';
        return;
      }
    }
    this.store.history = [];
    this.store.saveGuestData();
  }
}
