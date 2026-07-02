import { getAccessToken } from './auth';
import { ApiError } from './apiError';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.NEXT_PUBLIC_NGROK_ENABLE === 'true' ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.message || body.error || `HTTP ${res.status}`, body.type || 'UNKNOWN', res.status);
  return body as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserRole {
  id: number;
  name: string;
  code: string;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  roleId: number | null;
  role: UserRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  fullName?: string;
  roleId?: number | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const userApi = {
  list: () => request<User[]>('/users'),

  update: (id: number, data: UserUpdateRequest) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
};
