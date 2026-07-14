export function uuid() {
  return Math.random().toString(36).substring(2, 9);
}

export const defaultRequest = () => ({
  id: '',
  name: 'new request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  params: [{ key: '', value: '', enabled: true }],
  body: ''
});

export function parseParamsFromUrl(url) {
  const parts = url.split('?');
  if (parts.length < 2) {
    return [{ key: '', value: '', enabled: true }];
  }
  const searchParams = new URLSearchParams(parts[1]);
  const newParams = [];
  searchParams.forEach((value, key) => {
    newParams.push({ key, value, enabled: true });
  });
  newParams.push({ key: '', value: '', enabled: true });
  return newParams;
}

export function buildUrlWithParams(url, params) {
  const urlWithoutQuery = url.split('?')[0];
  const enabledParams = params.filter(p => p.enabled && p.key);
  if (enabledParams.length === 0) {
    return urlWithoutQuery;
  }
  const searchParams = new URLSearchParams();
  for (const p of enabledParams) {
    searchParams.append(p.key, p.value);
  }
  return urlWithoutQuery + '?' + searchParams.toString();
}
