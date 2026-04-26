// src/routes/search.ts
// Search routes — all protected by JWT middleware

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { singleSearch } from '../controllers/searchController';

const router = Router();

// POST /api/search/single  — protected
router.post('/single', authenticateToken, singleSearch);

// POST /api/search/bulk — will be wired in Module 5
// router.post('/bulk', authenticateToken, bulkSearch);

export default router;