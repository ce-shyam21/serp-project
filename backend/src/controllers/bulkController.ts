// src/controllers/bulkController.ts
// Handles POST /api/search/bulk
// Creates a bulk_job, processes each query via cacheService,
// updates progress, returns all results in one response.

import { Response } from 'express';
import { query, queryOne } from '../db/pool';
import { checkAndFetch } from '../services/cacheService';
import {
  AuthRequest,
  BulkSearchBody,
  BulkJobRow,
  BulkSearchResult,
  SearchResult,
  ApiResponse,
} from '../types';

// ── POST /api/search/bulk ────────────────────────────────────────
export async function bulkSearch(
  req: AuthRequest,
  res: Response<ApiResponse<BulkSearchResult>>
): Promise<void> {
  const { queries, engine = 'google' } = req.body as BulkSearchBody;
  const userId = req.user?.userId;

  // ── Validation ───────────────────────────────────────────────
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    res.status(400).json({ success: false, error: 'queries must be a non-empty array' });
    return;
  }

  if (queries.length > 50) {
    res.status(400).json({ success: false, error: 'Maximum 50 queries per bulk request' });
    return;
  }

  // Clean queries — trim whitespace, remove empty strings
  const cleanQueries = queries
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  if (cleanQueries.length === 0) {
    res.status(400).json({ success: false, error: 'No valid queries provided' });
    return;
  }

  // ── Step 1: Create bulk_job row ──────────────────────────────
  const job = await queryOne<BulkJobRow>(
    `INSERT INTO bulk_jobs (user_id, queries, status, total_count, completed_count)
     VALUES ($1, $2, 'running', $3, 0)
     RETURNING *`,
    [userId, JSON.stringify(cleanQueries), cleanQueries.length]
  );

  if (!job) {
    res.status(500).json({ success: false, error: 'Failed to create bulk job' });
    return;
  }

  const results: SearchResult[] = [];
  let cachedCount = 0;

  try {
    // ── Step 2: Process each query ───────────────────────────
    for (let i = 0; i < cleanQueries.length; i++) {
      const queryText = cleanQueries[i];

      const result = await checkAndFetch(userId, queryText, engine, job.id);
      results.push(result);

      if (result.servedFromCache) {
        cachedCount++;
      }

      // Update completed_count after each query
      await query(
        `UPDATE bulk_jobs
         SET completed_count = $1
         WHERE id = $2`,
        [i + 1, job.id]
      );

      // ── Rate limit guard ─────────────────────────────────
      // Only delay on cache MISS — no need to wait for cached results.
      // Keeps us within SerpAPI's rate limit without slowing cache hits.
      const isLastQuery = i === cleanQueries.length - 1;
      if (!result.servedFromCache && !isLastQuery) {
        await sleep(1200);
      }
    }

    // ── Step 3: Mark job as completed ───────────────────────
    await query(
      `UPDATE bulk_jobs
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [job.id]
    );

    // ── Step 4: Return all results ───────────────────────────
    res.json({
      success: true,
      data: {
        jobId: job.id,
        results,
        totalCount: cleanQueries.length,
        cachedCount,
      },
    });
  } catch (err) {
    // Mark job as failed so frontend can show correct status
    await query(
      `UPDATE bulk_jobs
       SET status = 'failed'
       WHERE id = $1`,
      [job.id]
    );

    console.error('Bulk search error:', err);
    res.status(500).json({ success: false, error: 'Bulk search failed' });
  }
}

// ── Utility ──────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}