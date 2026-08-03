import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';
import type { AuthUser } from '@kasieats/shared';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .raw<{ success?: boolean; data?: AuthUser } & AuthUser>('/auth/me')
      .then((res) => setUser((res as any).data ?? (res as AuthUser)))
      .catch(() => {
        setToken(null);
        setTokenState(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      login: async (phoneOrEmail, password) => {
        const res = await api.raw<{ token: string; user: AuthUser }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ phoneOrEmail, password }),
        });
        setToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
      },
      logout: () => {
        setToken(null);
        setTokenState(null);
        setUser(null);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
