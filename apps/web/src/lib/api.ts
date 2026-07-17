/**
 * api.ts — Typed HTTP client for the Postbud backend.
 *
 * These functions always communicate with the real Postbud API server
 * regardless of the sandbox routingMode setting. Auth is a system concern,
 * not a client-sandbox concern.
 */

import type { User } from './types';

export const API_BASE = 'http://localhost:8001';

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function post<T>(path: string, body: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...extraHeaders },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Request failed');
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Request failed');
  return data as T;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Request failed');
  return data as T;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Request failed');
  return data as T;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Request failed');
  return data as T;
}

// --------------------------------------------------------------------------
// Error type
// --------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --------------------------------------------------------------------------
// Auth endpoints
// --------------------------------------------------------------------------

export interface LoginResponse {
  status: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  status: string;
  token: string;
  user: User;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/login', { email, password });
}

export function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  return post<RegisterResponse>('/api/register', { name, email, password });
}

// --------------------------------------------------------------------------
// User endpoints (protected — require pb_token in localStorage)
// --------------------------------------------------------------------------

export function getMe(): Promise<User> {
  return get<User>('/api/me');
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  sync_enabled?: boolean;
}

export interface UpdateUserResponse {
  status: string;
  user: User;
}

export function updateUser(id: number, payload: UpdateUserPayload): Promise<UpdateUserResponse> {
  return put<UpdateUserResponse>(`/api/users/${id}`, payload);
}

// --------------------------------------------------------------------------
// Collections endpoints
// --------------------------------------------------------------------------

export interface CollectionResponse {
  status: string;
  collection: any;
}

export function getCollections(): Promise<{ collections: any[] }> {
  return get<{ collections: any[] }>('/api/collections');
}

export function createCollection(name: string, parentId?: string | null): Promise<CollectionResponse> {
  return post<CollectionResponse>('/api/collections', { name, parent_id: parentId });
}

export function updateCollection(id: string, name?: string, parentId?: string | null, sortOrder?: number): Promise<CollectionResponse> {
  return patch<CollectionResponse>(`/api/collections/${id}`, { name, parent_id: parentId, sort_order: sortOrder });
}

export function deleteCollection(id: string): Promise<{ status: string }> {
  return del<{ status: string }>(`/api/collections/${id}`);
}

// --------------------------------------------------------------------------
// Requests endpoints
// --------------------------------------------------------------------------

export interface RequestResponse {
  status: string;
  request: any;
}

export function getTopLevelRequests(): Promise<{ requests: any[] }> {
  return get<{ requests: any[] }>('/api/requests');
}

export function createRequest(
  name: string,
  collectionId: string | null,
  method: string = 'GET',
  url: string = '',
  headers: any[] = [],
  params: any[] = [],
  body: any = null
): Promise<RequestResponse> {
  return post<RequestResponse>('/api/requests', {
    name,
    collection_id: collectionId,
    method,
    url,
    headers,
    params,
    body,
  });
}

export function updateRequest(
  id: string,
  payload: {
    name?: string;
    method?: string;
    url?: string;
    headers?: any[];
    params?: any[];
    body?: any;
    sort_order?: number;
    collection_id?: string | null;
  }
): Promise<RequestResponse> {
  return patch<RequestResponse>(`/api/requests/${id}`, payload);
}

export function deleteRequest(id: string): Promise<{ status: string }> {
  return del<{ status: string }>(`/api/requests/${id}`);
}

// --------------------------------------------------------------------------
// Request History endpoints
// --------------------------------------------------------------------------

export interface GetHistoryResponse {
  history: any[];
  total: number;
  limit: number;
  offset: number;
}

export function getHistory(limit?: number, offset?: number): Promise<GetHistoryResponse> {
  const queryParams = new URLSearchParams();
  if (limit !== undefined) queryParams.append('limit', String(limit));
  if (offset !== undefined) queryParams.append('offset', String(offset));
  const queryStr = queryParams.toString();
  return get<GetHistoryResponse>(`/api/history${queryStr ? '?' + queryStr : ''}`);
}

export function createHistory(payload: {
  url: string;
  method: string;
  request_headers?: any[];
  request_params?: any[];
  request_body?: any;
  status_code?: number;
  response_headers?: any[];
  response_body?: any;
  timing_ms?: number;
  response_size?: number;
  request_id?: string | null;
}): Promise<{ status: string; history: any }> {
  return post<{ status: string; history: any }>('/api/history', payload);
}

export function clearHistory(): Promise<{ status: string; deleted: number }> {
  return del<{ status: string; deleted: number }>('/api/history');
}
