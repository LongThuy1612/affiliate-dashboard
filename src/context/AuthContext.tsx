'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  authApi,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from '@/lib/auth';
import { ApiError } from '@/lib/apiError';

/**
 * True only when the server itself rejected the token (401/403 from a real
 * HTTP response) — false for network failures (tunnel down, DNS, CORS-blocked
 * non-JSON response, timeout). Confirmed live: a backend restart or a flaky
 * ngrok tunnel can make a single `/auth/me` call fail for reasons that have
 * nothing to do with the token being invalid; clearing tokens on any thrown
 * error logged every user out on a transient network hiccup, not just on an
 * actually-expired session.
 */
function isAuthRejection(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  showBulletin: boolean;
  dismissBulletin: () => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  showBulletin: false,
  dismissBulletin: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBulletin, setShowBulletin] = useState(false);

  const initAuth = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me(token);
      setUser(me);
    } catch (err) {
      if (!isAuthRejection(err)) {
        // Network/tunnel failure, not an actual "your session is invalid" —
        // one short retry, since this is typically a backend/tunnel that's
        // mid-restart and back within a couple seconds. Keep the token
        // either way so a later successful call can still use it instead of
        // forcing a re-login for something that wasn't the token's fault.
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const me = await authApi.me(token);
          setUser(me);
        } catch {
          setUser(null);
        }
        setLoading(false);
        return;
      }
      // Real 401/403 — token is genuinely invalid/expired, try refresh
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { accessToken, refreshToken } = await authApi.refreshToken(refresh);
          setTokens(accessToken, refreshToken);
          const me = await authApi.me(accessToken);
          setUser(me);
        } catch (refreshErr) {
          if (isAuthRejection(refreshErr)) {
            clearTokens();
          }
          setUser(null);
        }
      } else {
        clearTokens();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const dismissBulletin = () => setShowBulletin(false);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    setShowBulletin(true);
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // ignore
      }
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, showBulletin, dismissBulletin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
