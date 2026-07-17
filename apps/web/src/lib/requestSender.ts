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
      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {}

      if (!res.ok || (parsed && (parsed.error || parsed.message) && !('body' in parsed))) {
        const errorBody = parsed ? JSON.stringify(parsed, null, 2) : text;
        setResponse({
          loading: false,
          status: res.status || 400,
          statusText: (parsed && parsed.error) ? parsed.error : (res.statusText || 'Bad Request'),
          time: duration,
          size: new Blob([errorBody]).size + ' B',
          headers: [],
          body: errorBody
        });
        setSyncStatus('synced');
        return;
      }

      const envelope = parsed as {
        status: number; statusText: string;
        headers: { key: string; value: string }[];
        body: string;
      };
      const raw = envelope.body ?? '';

      // Pretty-print if the response body is valid JSON
      let prettyBody = raw;
      try {
        const parsedBody = JSON.parse(raw);
        prettyBody = JSON.stringify(parsedBody, null, 2);
      } catch {
        // Not JSON — keep as-is
      }

      const sizeBytes = new Blob([prettyBody]).size;
      const sizeFormatted = sizeBytes > 1024 ? (sizeBytes / 1024).toFixed(2) + ' KB' : sizeBytes + ' B';
      setResponse({
        loading: false, status: envelope.status, statusText: envelope.statusText,
        time: duration, size: sizeFormatted, headers: envelope.headers ?? [], body: prettyBody
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

/**
 * sendStatic — routes requests directly through the browser's fetch API.
 * This is the default "static" routing mode for sending requests to
 * localhost or any reachable URL without going through the proxy backend.
 */
export function sendStatic(
  url: string, body: string,
  headers: HeaderOrParam[], queryParams: HeaderOrParam[],
  method: string,
  bodyType: 'json' | 'raw' | 'none',
  requestUrl: string,
  setResponse: (r: ResponseState) => void,
  addHistory: (h: HistoryItem) => void,
  setSyncStatus: (s: 'synced' | 'syncing') => void
) {
  // Build headers object from enabled header entries
  const headersPayload: Record<string, string> = {};
  headers
    .filter(h => h.enabled && h.key)
    .forEach(h => { headersPayload[h.key] = h.value; });

  // Append query params
  let finalUrl = url;
  const enabledParams = queryParams.filter(q => q.enabled && q.key);
  if (enabledParams.length > 0) {
    const searchParams = new URLSearchParams();
    enabledParams.forEach(p => searchParams.append(p.key, p.value));
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const startTime = Date.now();

  const fetchOptions: RequestInit = {
    method,
    headers: headersPayload,
  };

  // Only attach body for methods that support it
  if (method !== 'GET' && method !== 'HEAD' && body && bodyType !== 'none') {
    if (bodyType === 'json') {
      // Auto-set Content-Type for JSON if not already provided
      if (!headersPayload['Content-Type'] && !headersPayload['content-type']) {
        headersPayload['Content-Type'] = 'application/json';
      }
      // Parse and re-stringify to ensure valid JSON encoding
      try {
        fetchOptions.body = JSON.stringify(JSON.parse(body));
      } catch {
        const duration = Date.now() - startTime;
        setResponse({
          loading: false,
          status: 0,
          statusText: 'Invalid JSON',
          time: duration,
          size: '0 B',
          headers: [],
          body: 'Request body contains invalid JSON. Please check your syntax.'
        });
        setSyncStatus('synced');
        return;
      }
    } else {
      fetchOptions.body = body;
    }
  }

  fetch(finalUrl, fetchOptions)
    .then(async (res) => {
      const duration = Date.now() - startTime;

      // Collect response headers
      const respHeaders: Array<{ key: string; value: string }> = [];
      res.headers.forEach((value, key) => {
        respHeaders.push({ key, value });
      });

      const text = await res.text();

      // Pretty-print if the response is valid JSON
      let body = text;
      try {
        const parsed = JSON.parse(text);
        body = JSON.stringify(parsed, null, 2);
      } catch {
        // Not JSON — keep the raw text as-is
      }

      const sizeBytes = new Blob([body]).size;
      const sizeFormatted = sizeBytes > 1024
        ? (sizeBytes / 1024).toFixed(2) + ' KB'
        : sizeBytes + ' B';

      setResponse({
        loading: false,
        status: res.status,
        statusText: res.statusText,
        time: duration,
        size: sizeFormatted,
        headers: respHeaders,
        body
      });

      addHistory({
        id: generateId(),
        method,
        url: requestUrl,
        status: res.status,
        time: duration,
        timestamp: new Date().toTimeString().split(' ')[0]
      });

      setTimeout(() => setSyncStatus('synced'), 800);
    })
    .catch(err => {
      const duration = Date.now() - startTime;
      setResponse({
        loading: false,
        status: 0,
        statusText: 'Network Error',
        time: duration,
        size: '0 B',
        headers: [],
        body: err instanceof Error ? err.message : String(err)
      });
      setSyncStatus('synced');
    });
}
