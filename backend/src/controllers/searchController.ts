// src/controllers/searchController.ts
// Handles POST /api/search/single

import { Response } from 'express';
import { checkAndFetch } from '../services/cacheService';
import { AuthRequest, SingleSearchBody, SearchResult, ApiResponse } from '../types';

// ── POST /api/search/single ──────────────────────────────────────
export async function singleSearch(
  req: AuthRequest,
  res: Response<ApiResponse<SearchResult>>
): Promise<void> {
  const { query, engine = 'google' } = req.body as SingleSearchBody;
  const userId = req.user?.userId;

  // Validation
  if (!query || query.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Query is required' });
    return;
  }

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const result = await checkAndFetch(userId, query, engine);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Single search error:', err);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
}