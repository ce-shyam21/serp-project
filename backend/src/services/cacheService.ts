// src/services/cacheService.ts
// Core cache logic — check DB first, call SerpAPI on miss, log history always.

import { query, queryOne } from '../db/pool';
import { fetchFromSerpApi, buildSearchResult } from './serpService';
import { SearchCacheRow, SearchResult } from '../types';

// ── Main entry point ─────────────────────────────────────────────
// Called by searchController and bulkController.
// Returns a SearchResult — either from DB cache or fresh from SerpAPI.

export async function checkAndFetch(
  userId: string,
  queryText: string,
  engine: string = 'google',
  bulkJobId?: string
): Promise<SearchResult> {
  const normalizedQuery = queryText.trim().toLowerCase();

  // ── Step 1: Check cache ────────────────────────────────────────
  const cached = await queryOne<SearchCacheRow>(
    `SELECT * FROM search_cache
     WHERE query_text = $1
       AND engine     = $2
       AND expires_at > NOW()
     LIMIT 1`,
    [normalizedQuery, engine]
  );

  // ── Step 2a: Cache HIT ─────────────────────────────────────────
  if (cached) {
    await logHistory({
      userId,
      cacheId: cached.id,
      bulkJobId,
      queryText: normalizedQuery,
      mode: bulkJobId ? 'bulk' : 'single',
      servedFromCache: true,
    });

    return buildSearchResult(
      queryText,
      engine,
      cached.result_data,
      true,
      cached.cached_at
    );
  }

  // ── Step 2b: Cache MISS — call SerpAPI ────────────────────────
  const rawResult = await fetchFromSerpApi(normalizedQuery, engine);

  // Save fresh result to cache
  const cacheHours = Number(process.env.CACHE_HOURS ?? 24);

  const newCache = await queryOne<SearchCacheRow>(
    `INSERT INTO search_cache (query_text, engine, result_data, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour' * $4)
     ON CONFLICT (query_text, engine)
     DO UPDATE SET
       result_data = EXCLUDED.result_data,
       cached_at   = NOW(),
       expires_at  = NOW() + INTERVAL '1 hour' * $4
     RETURNING *`,
    [normalizedQuery, engine, JSON.stringify(rawResult), cacheHours]
  );

  await logHistory({
    userId,
    cacheId: newCache?.id ?? null,
    bulkJobId,
    queryText: normalizedQuery,
    mode: bulkJobId ? 'bulk' : 'single',
    servedFromCache: false,
  });

  return buildSearchResult(queryText, engine, rawResult, false);
}

// ── Log every search to search_history ──────────────────────────
// Called on both cache hits and misses.

interface LogHistoryParams {
  userId: string;
  cacheId: string | null;
  bulkJobId?: string;
  queryText: string;
  mode: 'single' | 'bulk';
  servedFromCache: boolean;
}

async function logHistory(params: LogHistoryParams): Promise<void> {
  const { userId, cacheId, bulkJobId, queryText, mode, servedFromCache } = params;

  await query(
    `INSERT INTO search_history
       (user_id, cache_id, bulk_job_id, query_text, mode, served_from_cache)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, cacheId, bulkJobId ?? null, queryText, mode, servedFromCache]
  );
}