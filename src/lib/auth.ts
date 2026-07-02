import { ApiError } from './apiError';

const ACCESS_TOKEN_KEY = 'aff_access_token';
const REFRESH_TOKEN_KEY = 'aff_refresh_token';

const AUTH_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

// ─── Token storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Also persist in cookie for server-side middleware auth checks
  document.cookie = `aff_access_token=${accessToken};path=/;max-age=86400;SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = 'aff_access_token=;path=/;max-age=0;SameSite=Lax';
}

// ─── Auth API calls ───────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  status: string;
  role: {
    id: number;
    code: string;
    name: string;
  } | null;
  permissions: string[];
  lastLoginAt: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

async function authRequest<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    headers: { 
      'Content-Type': 'application/json',
      ...(process.env.NEXT_PUBLIC_NGROK_ENABLE === 'true' ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      ...options.headers 
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.message || body.error || `HTTP ${res.status}`, body.type || 'UNKNOWN', res.status);
  return body as T;
}

export const authApi = {
  login: (data: LoginRequest) =>
    authRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    authRequest<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    authRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  me: (accessToken: string) =>
    authRequest<AuthUser>('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  refreshToken: (refreshToken: string) =>
    authRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
