import React, { createContext, useContext, useMemo, useState } from 'react';

interface DriverUser {
  firstName: string;
  lastName: string;
  phone: string;
}

interface AuthContextValue {
  token: string | null;
  user: DriverUser | null;
  setAuth: (token: string, user: DriverUser) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DriverUser | null>(null);

  const value = useMemo(
    () => ({
      token,
      user,
      setAuth: (nextToken: string, nextUser: DriverUser) => {
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
