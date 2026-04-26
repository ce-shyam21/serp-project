// src/api/authApi.ts
// Typed login() and register() functions — used by AuthContext

import axiosInstance from './axiosInstance';
import type { LoginPayload, RegisterPayload, AuthResponse, ApiResponse } from '../types';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await axiosInstance.post<ApiResponse<AuthResponse>>(
    '/auth/login',
    payload
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error ?? 'Login failed');
  }

  return res.data.data;
}

export async function register(payload: RegisterPayload): Promise<void> {
  const res = await axiosInstance.post<ApiResponse>('/auth/register', payload);

  if (!res.data.success) {
    throw new Error(res.data.error ?? 'Registration failed');
  }
}