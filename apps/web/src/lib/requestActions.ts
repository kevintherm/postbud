import type { ApiClientStore } from './store.svelte';
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
    this.store.responseState.loading = true;
    this.store.syncStatus = 'syncing';

    const resolvedUrl = this.store.resolveVars(this.store.activeRequest.url);
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
      this.store.history = [h, ...this.store.history];
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
            } catch {}
          }
          const respHeadersObj: Record<string, string> = {};
          this.store.responseState.headers.forEach((hdr) => {
            respHeadersObj[hdr.key] = hdr.value;
          });

          let respParsedBody = null;
          if (this.store.responseState.body) {
            try {
              respParsedBody = JSON.parse(this.store.responseState.body);
            } catch {
              respParsedBody = this.store.responseState.body;
            }
          }

          const sizeBytes = this.store.responseState.body ? new Blob([this.store.responseState.body]).size : 0;

          await createHistory({
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
