import React, { createContext, useContext, useMemo, useState } from 'react';

interface AuthState {
  token: string | null;
  user: { firstName: string; lastName: string; phone: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthState['user']>(null);

  const value = useMemo(
    () => ({
      token,
      user,
      setAuth: (nextToken: string, nextUser: AuthState['user']) => {
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
