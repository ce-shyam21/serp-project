// src/context/useAuth.ts
// Separate file for the hook — satisfies react-refresh/only-export-components rule

import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './AuthContext';

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}