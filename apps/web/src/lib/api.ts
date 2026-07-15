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
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
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
