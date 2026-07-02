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
    } catch {
      // Token expired — try refresh
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { accessToken, refreshToken } = await authApi.refreshToken(refresh);
          setTokens(accessToken, refreshToken);
          const me = await authApi.me(accessToken);
          setUser(me);
        } catch {
          clearTokens();
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
