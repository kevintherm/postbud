import { simulateRequest } from './mockEngine';
import { generateId } from './utils';
import { API_BASE } from './api';
import type { HeaderOrParam, HistoryItem, ResponseState } from './types';

export function sendViaProxy(
  url: string, body: string,
  headers: HeaderOrParam[], queryParams: HeaderOrParam[],
  method: string,
  requestUrl: string,
  setResponse: (r: ResponseState) => void,
  addHistory: (h: HistoryItem) => void,
  setSyncStatus: (s: 'synced' | 'syncing') => void
) {
  const headersPayload = headers
    .filter(h => h.enabled && h.key)
    .map(h => ({ key: h.key, value: h.value, enabled: true }));
  let finalUrl = url;
  const enabledParams = queryParams.filter(q => q.enabled && q.key);
  if (enabledParams.length > 0) {
    const searchParams = new URLSearchParams();
    enabledParams.forEach(p => searchParams.append(p.key, p.value));
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const startTime = Date.now();
  fetch(`${API_BASE}/api/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: finalUrl, method,
      headers: headersPayload,
      body: method !== 'GET' ? body : '',
    }),
  })
    .then(async (res) => {
      const duration = Date.now() - startTime;
      const envelope = await res.json() as {
        status: number; statusText: string;
        headers: { key: string; value: string }[];
        body: string;
      };
      const text = envelope.body ?? '';
      const sizeBytes = new Blob([text]).size;
      const sizeFormatted = sizeBytes > 1024 ? (sizeBytes / 1024).toFixed(2) + ' KB' : sizeBytes + ' B';
      setResponse({
        loading: false, status: envelope.status, statusText: envelope.statusText,
        time: duration, size: sizeFormatted, headers: envelope.headers ?? [], body: text
      });
      addHistory({
        id: generateId(), method, url: requestUrl,
        status: envelope.status, time: duration, timestamp: new Date().toTimeString().split(' ')[0]
      });
      setTimeout(() => setSyncStatus('synced'), 800);
    })
    .catch(err => {
      const duration = Date.now() - startTime;
      setResponse({
        loading: false, status: 0, statusText: 'Network Error',
        time: duration, size: '0 B', headers: [],
        body: err instanceof Error ? err.message : String(err)
      });
      setSyncStatus('synced');
    });
}

export function sendMock(
  url: string, body: string,
  headers: HeaderOrParam[], queryParams: HeaderOrParam[],
  method: string,
  requestUrl: string,
  envName: string,
  setResponse: (r: ResponseState) => void,
  addHistory: (h: HistoryItem) => void,
  setSyncStatus: (s: 'synced' | 'syncing') => void
) {
  const startTime = Date.now();
  setTimeout(() => {
    const duration = Date.now() - startTime;
    const simResponse = simulateRequest(method, url, body, headers, queryParams, envName);
    const sizeBytes = new Blob([simResponse.body]).size;
    const sizeFormatted = sizeBytes > 1024 ? (sizeBytes / 1024).toFixed(2) + ' KB' : sizeBytes + ' B';
    setResponse({
      loading: false, status: simResponse.status, statusText: simResponse.statusText,
      time: duration, size: sizeFormatted, headers: simResponse.headers, body: simResponse.body
    });
    addHistory({
      id: generateId(), method, url: requestUrl,
      status: simResponse.status, time: duration, timestamp: new Date().toTimeString().split(' ')[0]
    });
    setTimeout(() => setSyncStatus('synced'), 800);
  }, 600);
}
