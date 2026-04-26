-- ============================================================
-- Migration 001 — Full Reset + Initial Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Select all → Paste → Run
-- ============================================================


-- ============================================================
-- STEP 1: DROP ALL TABLES (order matters — FK deps first)
-- ============================================================

DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS bulk_jobs      CASCADE;
DROP TABLE IF EXISTS search_cache   CASCADE;
DROP TABLE IF EXISTS users          CASCADE;


-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================


-- 1. USERS
CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  last_login    TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ  DEFAULT NULL
);


-- 2. SEARCH CACHE
-- Shared across all users. Unique on (query_text, engine) so
-- cacheService can use INSERT ... ON CONFLICT DO UPDATE.
CREATE TABLE search_cache (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text  VARCHAR(500) NOT NULL,
  engine      VARCHAR(50)  NOT NULL DEFAULT 'google',
  result_data JSONB        NOT NULL,
  cached_at   TIMESTAMPTZ  DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL,
  CONSTRAINT uq_cache_query_engine UNIQUE (query_text, engine)
);

CREATE INDEX idx_cache_lookup
  ON search_cache (query_text, engine, expires_at DESC);


-- 3. BULK JOBS
-- Must be created before search_history (FK dependency).
CREATE TABLE bulk_jobs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queries         JSONB        NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'completed', 'failed')),
  total_count     INTEGER      NOT NULL DEFAULT 0,
  completed_count INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_bulk_jobs_user
  ON bulk_jobs (user_id, created_at DESC);


-- 4. SEARCH HISTORY
-- Per-user record of every search. References both cache and bulk job.
CREATE TABLE search_history (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cache_id          UUID         REFERENCES search_cache(id) ON DELETE SET NULL,
  bulk_job_id       UUID         REFERENCES bulk_jobs(id)    ON DELETE SET NULL,
  query_text        VARCHAR(500) NOT NULL,
  mode              VARCHAR(10)  NOT NULL DEFAULT 'single'
                    CHECK (mode IN ('single', 'bulk')),
  searched_at       TIMESTAMPTZ  DEFAULT NOW(),
  served_from_cache BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_history_user_query
  ON search_history (user_id, query_text, searched_at DESC);


-- ============================================================
-- STEP 3: VERIFY (optional — run separately to confirm)
-- ============================================================

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;