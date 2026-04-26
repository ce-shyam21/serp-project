// src/server.ts
// Entry point of the backend.
// Starts Express, wires up middleware, and registers all route groups.

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env variables FIRST — everything else depends on them
dotenv.config();

// Importing pool.ts triggers the DB connection test on startup
import './db/pool';

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
// Runs on every incoming request before it reaches any route.

// Allow requests from the React dev server and production frontend
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Alternative
    ],
    credentials: true,
  })
);

// Parse JSON bodies — enables req.body in route handlers
app.use(express.json());

// ── Health Check ────────────────────────────────────────────────────────────
// Simple endpoint to confirm server is alive.
// Test it: GET http://localhost:5000/health

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
// Uncomment each block as you complete the module.

// Module 3 — Auth
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

// Module 4 & 5 — Search
import searchRoutes from './routes/search';
app.use('/api/search', searchRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;