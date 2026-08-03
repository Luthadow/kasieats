import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';
import type { AuthUser } from '@kasieats/shared';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrating: boolean;
  setAuth: (token: string, user: AuthUser | null) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const TOKEN_KEY = 'kasieats.driver.token';
const USER_KEY = 'kasieats.driver.user';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (t) {
          setToken(t);
          setAuthToken(t);
        }
        if (u) setUser(JSON.parse(u));
      } catch {
        // ignore
      } finally {
        setHydrating(false);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      hydrating,
      setAuth: async (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
        setAuthToken(nextToken);
        await AsyncStorage.setItem(TOKEN_KEY, nextToken);
        if (nextUser) await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      },
      clearAuth: async () => {
        setToken(null);
        setUser(null);
        setAuthToken(null);
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      },
    }),
    [token, user, hydrating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
