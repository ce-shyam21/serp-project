// src/types/index.ts
// All shared types for the React frontend.
// These mirror the backend's ApiResponse shapes — keeping both in sync.

// ── Auth ─────────────────────────────────────────────────────────

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

// ── Search ───────────────────────────────────────────────────────

export type SearchMode = 'single' | 'bulk';

export interface PriceItem {
  title: string;
  price: string;
  source: string;
  link?: string;
  thumbnail?: string;
}

export interface SearchResult {
  query: string;
  engine: string;
  servedFromCache: boolean;
  cachedAt?: string;
  shoppingResults: PriceItem[];
  organicPrices: PriceItem[];
}

export interface BulkSearchResult {
  jobId: string;
  results: SearchResult[];
  totalCount: number;
  cachedCount: number;
}

export interface SingleSearchPayload {
  query: string;
  engine?: string;
}

export interface BulkSearchPayload {
  queries: string[];
  engine?: string;
}

// ── API Wrapper ──────────────────────────────────────────────────
// Standard envelope all API responses are wrapped in

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}