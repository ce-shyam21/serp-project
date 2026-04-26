-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Select all, paste, click Run
-- ============================================================


-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);


-- 2. SEARCH CACHE TABLE
-- Stores SerpAPI responses, shared across all users.
-- result_data is JSONB — PostgreSQL stores it as structured JSON (queryable + indexed).
CREATE TABLE IF NOT EXISTS search_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text  VARCHAR(500) NOT NULL,
  engine      VARCHAR(50) NOT NULL DEFAULT 'google',
  result_data JSONB NOT NULL,
  cached_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_lookup
  ON search_cache (query_text, engine, expires_at DESC);


-- 3. SEARCH HISTORY TABLE
-- One row per search performed by a user.
-- Tracks whether result came from cache or a fresh SerpAPI call.
CREATE TABLE IF NOT EXISTS search_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cache_id          UUID REFERENCES search_cache(id) ON DELETE SET NULL,
  bulk_job_id       UUID,
  query_text        VARCHAR(500) NOT NULL,
  mode              VARCHAR(10) NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'bulk')),
  searched_at       TIMESTAMPTZ DEFAULT NOW(),
  served_from_cache BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_history_user_query
  ON search_history (user_id, query_text, searched_at DESC);


-- 4. BULK JOBS TABLE
-- Tracks batches of bulk searches so the frontend can show job status.
CREATE TABLE IF NOT EXISTS bulk_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queries         JSONB NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  total_count     INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bulk_jobs_user
  ON bulk_jobs (user_id, created_at DESC);