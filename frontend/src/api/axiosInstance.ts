// src/api/axiosInstance.ts
// A pre-configured Axios client used for ALL API calls in the app.
// ─ Automatically sets the base URL to the backend
// ─ Automatically attaches the JWT token to every request
// ─ Handles 401 (token expired) by clearing auth and redirecting to login

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// ── Request Interceptor ───────────────────────────────────────────
// Runs before every outgoing request.
// Reads the JWT from localStorage and attaches it as a Bearer token.

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────
// Runs after every incoming response.
// If the server returns 401 (Unauthorized / token expired),
// clear the stored token and redirect to login page.

axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;