// src/types/index.ts
// ─────────────────────────────────────────────────────────────────
// All shared TypeScript types for the backend.
// Define the shape of your data ONCE here — import anywhere.
// TypeScript will catch mismatches at compile time, not at runtime.
// ─────────────────────────────────────────────────────────────────

import { Request } from 'express';

// ── Database Row Types ────────────────────────────────────────────
// These match your PostgreSQL table columns exactly.

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  last_login: Date | null;
}

export interface SearchCacheRow {
  id: string;
  query_text: string;
  engine: string;
  result_data: SerpApiResult;   // Typed JSON — not just "any"
  cached_at: Date;
  expires_at: Date;
}

export interface SearchHistoryRow {
  id: string;
  user_id: string;
  cache_id: string | null;
  bulk_job_id: string | null;
  query_text: string;
  mode: SearchMode;
  searched_at: Date;
  served_from_cache: boolean;
}

export interface BulkJobRow {
  id: string;
  user_id: string;
  queries: string[];
  status: BulkJobStatus;
  total_count: number;
  completed_count: number;
  created_at: Date;
  completed_at: Date | null;
}

// ── Enum-style Union Types ────────────────────────────────────────
// TypeScript union types act like enums — only these values are allowed.

export type SearchMode = 'single' | 'bulk';
export type BulkJobStatus = 'running' | 'completed' | 'failed';

// ── SerpAPI Response Types ────────────────────────────────────────
// Describes the shape of what SerpAPI sends back.

export interface SerpApiShoppingResult {
  title: string;
  price?: string;
  source?: string;
  link?: string;
  thumbnail?: string;
}

export interface SerpApiOrganicResult {
  title: string;
  link: string;
  snippet?: string;
  position: number;
}

export interface SerpApiKnowledgeGraph {
  title?: string;
  price?: string;
  description?: string;
}

export interface SerpApiResult {
  search_metadata?: { status: string };
  search_parameters?: { q: string; engine: string };
  shopping_results?: SerpApiShoppingResult[];
  inline_shopping_results?: SerpApiShoppingResult[];
  organic_results?: SerpApiOrganicResult[];
  knowledge_graph?: SerpApiKnowledgeGraph;
  error?: string;
}

// ── Extracted Pricing Type ────────────────────────────────────────
// The clean, structured output your API returns to the frontend.

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

// ── Request / Auth Types ──────────────────────────────────────────
// Extends Express's Request so TypeScript knows about req.user

export interface JwtPayload {
  userId: string;
  username: string;
}

// After JWT middleware runs, req.user will be available on all protected routes
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ── API Request Body Types ────────────────────────────────────────

export interface RegisterBody {
  username: string;
  password: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface SingleSearchBody {
  query: string;
  engine?: string;
}

export interface BulkSearchBody {
  queries: string[];
  engine?: string;
}

// ── API Response Types ────────────────────────────────────────────
// Standard response wrapper — all API responses follow this shape.

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}