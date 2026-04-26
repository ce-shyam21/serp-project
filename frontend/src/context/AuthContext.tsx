// src/context/AuthContext.tsx
// Global auth state — wraps entire app, provides user/token/login/logout

import { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/authApi';
import type { LoginPayload, RegisterPayload } from '../types';

// ── Types ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

// ── Context ──────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restore user from localStorage on page refresh
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await apiLogin(payload);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
    // Registration does not auto-login — user must login after
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
