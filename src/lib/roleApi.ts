import { getAccessToken } from './auth';
import { ApiError } from './apiError';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
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

export interface RolePermission {
  resourceCode: string;
  action: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isConst: boolean;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleCreateRequest {
  code: string;
  name: string;
  description?: string;
  permissions: RolePermission[];
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  permissions?: RolePermission[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const roleApi = {
  list: () => request<Role[]>('/roles'),

  get: (id: number) => request<Role>(`/roles/${id}`),

  create: (data: RoleCreateRequest) =>
    request<Role>('/roles', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: RoleUpdateRequest) =>
    request<Role>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/roles/${id}`, { method: 'DELETE' }),
};
