// src/db/pool.ts
// Creates ONE shared PostgreSQL connection pool for the whole app.
// Import `pool` wherever you need to query the database.

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool manages multiple DB connections efficiently.
// Instead of opening/closing a connection per request, it reuses them.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase hosted connections
  },
  max: 10,                // Maximum 10 simultaneous DB connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to Supabase PostgreSQL');
  release(); // Always release the client back to the pool
});

// Helper for typed queries — use this instead of pool.query directly
// Example: await query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper to get a single row (returns null if not found)
export async function queryOne<T>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query(text, params);
  return result.rows.length > 0 ? (result.rows[0] as T) : null;
}

export default pool;