import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AdminUser {
  email: string;
  phone: string;
}

interface AuthContextValue {
  token: string | null;
  user: AdminUser | null;
  setAuth: (token: string, user: AdminUser) => void;
  clearAuth: () => void;
}

const TOKEN_KEY = 'kasieats_admin_token';
const USER_KEY = 'kasieats_admin_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      setAuth: (nextToken: string, nextUser: AdminUser) => {
        setToken(nextToken);
        setUser(nextUser);
      },
      clearAuth: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
