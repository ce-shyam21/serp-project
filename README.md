# SerpSearch — Full Stack Project

> React + Node.js + PostgreSQL (Supabase) · **100% TypeScript**
> Search pricing data via SerpAPI with 24-hour smart caching per user.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Tech Stack](#tech-stack)
3. [Full Project Structure](#full-project-structure)
4. [Database Tables](#database-tables)
5. [Environment Variables](#environment-variables)
6. [Module Build Plan](#module-build-plan)
   - [Module 1 — Project Setup](#module-1--project-setup--folder-structure)
   - [Module 2 — Database Tables](#module-2--database-tables-in-supabase)
   - [Module 3 — Auth API](#module-3--auth-register--login-api)
   - [Module 4 — Cache + Single Search API](#module-4--cache-logic--single-search-api)
   - [Module 5 — Bulk Search API](#module-5--bulk-search-api)
   - [Module 6 — React Auth Flow](#module-6--react--login--auth-flow)
   - [Module 7 — React Search UI](#module-7--react--search-page-ui)
   - [Module 8 — Polish + Deploy](#module-8--polish--test--deploy)
7. [How the 24-Hour Cache Works](#how-the-24-hour-cache-works)
8. [API Reference](#api-reference)
9. [How to Run Locally](#how-to-run-locally)

---

## What This App Does

- Users **register and log in** with a username and password
- They can do a **single search** (one term) or a **bulk search** (many terms at once)
- The app calls **SerpAPI** to get real Google search results including pricing data
- Results are **cached in Supabase for 24 hours** — if the same user searches the same term again within 24 hours, the DB result is returned instantly without calling SerpAPI again
- Every search is **logged per user** so we can track cache hits vs fresh API calls

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios (with interceptors for JWT) |
| Backend | Node.js + Express + TypeScript |
| TS Runner (dev) | `tsx` — runs `.ts` files without compiling |
| Auth | JWT (jsonwebtoken) + bcryptjs for password hashing |
| Database | PostgreSQL via Supabase |
| DB Client | `pg` (node-postgres) |
| External API | SerpAPI (Google Search API) |
| Deploy (BE) | Render.com |
| Deploy (FE) | Vercel |

---

## Full Project Structure

```
serp-project/
│
├── backend/                          # Node.js + Express API (TypeScript)
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts               # PostgreSQL connection pool + typed query helpers
│   │   │   └── schema.sql            # Run once in Supabase SQL Editor to create tables
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # ALL shared TypeScript types for the backend
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT verification middleware (protects routes)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts               # POST /api/auth/register, POST /api/auth/login
│   │   │   └── search.ts             # POST /api/search/single, POST /api/search/bulk
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Business logic for register + login
│   │   │   ├── searchController.ts   # Business logic for single search
│   │   │   └── bulkController.ts     # Business logic for bulk search
│   │   │
│   │   ├── services/
│   │   │   ├── cacheService.ts       # 24-hour cache check + save logic
│   │   │   └── serpService.ts        # SerpAPI HTTP calls + result extraction
│   │   │
│   │   └── server.ts                 # Entry point — Express app setup
│   │
│   ├── .env                          # Secret keys (never commit to git)
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                         # React + TypeScript (Vite)
    ├── src/
    │   ├── types/
    │   │   └── index.ts              # ALL shared TypeScript types for the frontend
    │   │
    │   ├── api/
    │   │   ├── axiosInstance.ts      # Pre-configured Axios — auto JWT, 401 handling
    │   │   ├── authApi.ts            # login(), register() functions
    │   │   └── searchApi.ts          # singleSearch(), bulkSearch() functions
    │   │
    │   ├── context/
    │   │   └── AuthContext.tsx       # Global auth state — user, token, login, logout
    │   │
    │   ├── components/
    │   │   ├── PrivateRoute.tsx      # Redirects to /login if not authenticated
    │   │   ├── ResultCard.tsx        # Displays one search result with price info
    │   │   ├── BulkResults.tsx       # Displays a grid of bulk search results
    │   │   └── CacheBadge.tsx        # Green "from cache" / grey "fresh" badge
    │   │
    │   ├── pages/
    │   │   ├── Login.tsx             # Login + Register tabs
    │   │   └── Search.tsx            # Main search page — single + bulk tabs
    │   │
    │   ├── App.tsx                   # Root — sets up React Router routes
    │   └── main.tsx                  # Vite entry point — wraps app in AuthProvider
    │
    ├── .env                          # VITE_API_URL=http://localhost:5000/api
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json                 # Created by Vite react-ts template
    └── tsconfig.node.json            # Created by Vite react-ts template
```

---

## Database Tables

Four tables in Supabase PostgreSQL. Run `backend/src/db/schema.sql` in the Supabase SQL Editor to create them all at once.

### `users`
Stores registered users. Passwords are **never stored as plain text** — only the bcrypt hash.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `username` | VARCHAR(100) | Unique, not null |
| `password_hash` | TEXT | bcrypt hash |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `last_login` | TIMESTAMPTZ | Updated on each login |

### `search_cache`
Stores raw SerpAPI results. Shared across all users — if anyone searched the same term within 24 hours, this row is reused.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `query_text` | VARCHAR(500) | The search term |
| `engine` | VARCHAR(50) | Default: `google` |
| `result_data` | JSONB | Full SerpAPI JSON response |
| `cached_at` | TIMESTAMPTZ | When it was stored |
| `expires_at` | TIMESTAMPTZ | `cached_at + 24 hours` |

### `search_history`
One row per search a user performs. Records cache hits vs fresh API calls.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK → users) | Who searched |
| `cache_id` | UUID (FK → search_cache) | Which cache entry was used |
| `bulk_job_id` | UUID (FK → bulk_jobs) | Set if part of a bulk job |
| `query_text` | VARCHAR(500) | The search term |
| `mode` | VARCHAR(10) | `'single'` or `'bulk'` |
| `searched_at` | TIMESTAMPTZ | When searched |
| `served_from_cache` | BOOLEAN | `true` = DB hit, `false` = fresh call |

### `bulk_jobs`
Tracks a batch of bulk searches so the frontend can show progress.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK → users) | Who created the job |
| `queries` | JSONB | Array of search terms |
| `status` | VARCHAR(20) | `'running'`, `'completed'`, `'failed'` |
| `total_count` | INTEGER | Total terms in the batch |
| `completed_count` | INTEGER | How many are done |
| `created_at` | TIMESTAMPTZ | When started |
| `completed_at` | TIMESTAMPTZ | When finished |

---

## Environment Variables

### Backend — `backend/.env`

```env
PORT=5000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=any_long_random_string_min_32_characters
SERPAPI_KEY=your_serpapi_key_from_dashboard
CACHE_HOURS=24
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

> **Rule:** Never commit `.env` files. Both `.gitignore` files already exclude them.

---

## Module Build Plan

The project is built in 8 modules. Complete them in order — each module depends on the previous.

---

### Module 1 — Project Setup + Folder Structure
**Timeline: Day 1**

**Goal:** Both servers run, DB is connected, health check works.

**Commands to run:**
```bash
# Root
mkdir serp-project && cd serp-project && mkdir backend frontend

# Backend
cd backend && npm init -y
npm install express cors dotenv pg bcryptjs jsonwebtoken node-fetch
npm install --save-dev typescript tsx @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/pg

# Frontend
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install axios react-router-dom
```

**Files to create:**
- `backend/tsconfig.json` — TypeScript config (target ES2020, module CommonJS)
- `backend/package.json` — add `"type"` not needed (CommonJS), scripts: `dev: tsx watch src/server.ts`
- `backend/src/server.ts` — Express app, health check route
- `backend/src/db/pool.ts` — PostgreSQL Pool, typed `query<T>()` and `queryOne<T>()` helpers
- `backend/src/db/schema.sql` — All 4 CREATE TABLE statements
- `backend/src/types/index.ts` — All shared backend types
- `backend/.env` — Fill in DATABASE\_URL, JWT\_SECRET, SERPAPI\_KEY
- `frontend/src/types/index.ts` — All shared frontend types
- `frontend/src/api/axiosInstance.ts` — Axios with JWT interceptor
- `frontend/.env` — VITE\_API\_URL

**Done when:**
```
✅ npm run dev → "🚀 Server running at http://localhost:5000"
✅ npm run dev → "✅ Connected to Supabase PostgreSQL"
✅ GET http://localhost:5000/health → { success: true }
✅ Supabase SQL editor ran schema.sql — all 4 tables visible
✅ http://localhost:5173 → placeholder page loads
```

---

### Module 2 — Database Tables in Supabase
**Timeline: Day 1–2**

**Goal:** All tables created and accessible from Node.js.

**Steps:**
1. Open Supabase → SQL Editor → New Query
2. Paste `backend/src/db/schema.sql` → click Run
3. Go to Table Editor and confirm all 4 tables exist: `users`, `search_cache`, `search_history`, `bulk_jobs`
4. Test the connection with a raw query in `pool.ts`:

```typescript
// Temporary test — delete after confirming it works
const rows = await query<{ now: Date }>('SELECT NOW() as now');
console.log('DB time:', rows[0].now);
```

**Done when:**
```
✅ All 4 tables appear in Supabase Table Editor
✅ DB time logs in terminal from the test query
✅ Indexes created (check in Supabase → Database → Indexes)
```

---

### Module 3 — Auth: Register + Login API
**Timeline: Day 2–3**

**Goal:** Working `POST /api/auth/register` and `POST /api/auth/login` endpoints.

**Files to create:**
- `backend/src/routes/auth.ts` — Route definitions only (no logic)
- `backend/src/controllers/authController.ts` — register and login logic
- `backend/src/middleware/auth.ts` — JWT verification middleware

**How register works:**
1. Receive `{ username, password }` in request body
2. Check if username already exists in `users` table
3. Hash the password with `bcrypt.hash(password, 10)`
4. Insert new row into `users` table
5. Return `{ success: true, message: "User created" }`

**How login works:**
1. Receive `{ username, password }` in request body
2. Find user by username in `users` table
3. Compare password with stored hash using `bcrypt.compare()`
4. If match: sign a JWT with `jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })`
5. Update `last_login` timestamp in `users` table
6. Return `{ success: true, data: { token, user: { id, username } } }`

**How the auth middleware works:**
1. Read `Authorization: Bearer <token>` header from request
2. Verify with `jwt.verify(token, JWT_SECRET)`
3. Attach decoded payload to `req.user` (typed as `AuthRequest`)
4. Call `next()` to proceed to the route handler — or return 401 if invalid

**Uncomment in `server.ts`:**
```typescript
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);
```

**Test with Postman / Thunder Client:**
```
POST http://localhost:5000/api/auth/register
Body: { "username": "testuser", "password": "test123" }
→ Expected: { "success": true, "message": "User created" }

POST http://localhost:5000/api/auth/login
Body: { "username": "testuser", "password": "test123" }
→ Expected: { "success": true, "data": { "token": "eyJ...", "user": {...} } }
```

**Done when:**
```
✅ Register creates a row in the users table (check Supabase Table Editor)
✅ Login returns a valid JWT token
✅ Wrong password returns 401
✅ Duplicate username returns 409
✅ Hitting a protected route without token returns 401
```

---

### Module 4 — Cache Logic + Single Search API
**Timeline: Day 3–4**

**Goal:** Working `POST /api/search/single` with 24-hour cache.

**Files to create:**
- `backend/src/services/serpService.ts` — calls SerpAPI, extracts price data
- `backend/src/services/cacheService.ts` — check cache, save to cache
- `backend/src/controllers/searchController.ts` — orchestrates the flow
- `backend/src/routes/search.ts` — route definition with auth middleware

**The exact cache check logic (in `cacheService.ts`):**
```
1. Query search_cache WHERE query_text = $1 AND engine = $2 AND expires_at > NOW()
2. If row found → it's a cache HIT
   - Log to search_history (served_from_cache = true, cache_id = row.id)
   - Return the cached result_data
3. If no row → it's a cache MISS
   - Call SerpAPI (serpService.ts)
   - Insert new row into search_cache with expires_at = NOW() + INTERVAL '24 hours'
   - Log to search_history (served_from_cache = false, cache_id = new cache row id)
   - Return the fresh result_data
```

**Single search flow:**
```
React → POST /api/search/single { query, engine? }
  → auth middleware checks JWT → gets userId
  → searchController calls cacheService.checkAndFetch(userId, query, engine)
    → cacheService checks search_cache table
    → HIT: return DB data instantly
    → MISS: call serpService → save to DB → return fresh data
  → return ApiResponse<SearchResult> to React
```

**Uncomment in `server.ts`:**
```typescript
import searchRoutes from './routes/search';
app.use('/api/search', searchRoutes);
```

**Done when:**
```
✅ POST /api/search/single returns pricing results
✅ First call: served_from_cache = false, row added to search_cache
✅ Second call (same query, same user, within 24hrs): served_from_cache = true
✅ Second call response is noticeably faster (no SerpAPI call)
✅ Calling without JWT token returns 401
```

---

### Module 5 — Bulk Search API
**Timeline: Day 4–5**

**Goal:** Working `POST /api/search/bulk` that processes an array of terms.

**Files to create:**
- `backend/src/controllers/bulkController.ts` — bulk job orchestration

**Bulk search flow:**
```
React → POST /api/search/bulk { queries: ["term1", "term2", ...], engine? }
  → auth middleware → userId
  → bulkController:
    1. Insert row into bulk_jobs { user_id, queries, status: 'running', total_count }
    2. Loop through each query:
       a. Call cacheService.checkAndFetch(userId, query, engine, bulk_job_id)
       b. Wait 1200ms between SerpAPI calls (only if cache MISS — no need to delay for hits)
       c. Update bulk_jobs.completed_count += 1
    3. Update bulk_jobs.status = 'completed', completed_at = NOW()
    4. Return BulkSearchResult { jobId, results[], totalCount, cachedCount }
```

**Key rule — delay only on cache misses:**
```typescript
if (!servedFromCache) {
  await new Promise(resolve => setTimeout(resolve, 1200));
}
```
This avoids hitting SerpAPI's rate limit while still being fast for cached terms.

**Done when:**
```
✅ POST /api/search/bulk with 5 terms returns all 5 results
✅ bulk_jobs row created in DB with status 'completed'
✅ Each term logged individually in search_history with correct bulk_job_id
✅ Cached terms in the batch skip the delay and return instantly
✅ Response includes cachedCount showing how many were served from cache
```

---

### Module 6 — React: Login + Auth Flow
**Timeline: Day 5–6**

**Goal:** Login page works, JWT stored, protected routes redirect unauthenticated users.

**Files to create:**
- `frontend/src/context/AuthContext.tsx` — global auth state with React Context
- `frontend/src/api/authApi.ts` — typed `login()` and `register()` functions
- `frontend/src/pages/Login.tsx` — login + register form with tab toggle
- `frontend/src/components/PrivateRoute.tsx` — redirects to /login if no token
- Update `frontend/src/App.tsx` — add React Router with `/login` and `/search` routes
- Update `frontend/src/main.tsx` — wrap app in `<AuthProvider>`

**AuthContext provides:**
```typescript
interface AuthContextType {
  user: { id: string; username: string } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Token storage:** JWT stored in `localStorage` under key `'token'`. The Axios interceptor (already built in Module 1) automatically reads it and attaches it to every request.

**Route setup in `App.tsx`:**
```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/search" element={
    <PrivateRoute>
      <Search />
    </PrivateRoute>
  } />
  <Route path="*" element={<Navigate to="/search" replace />} />
</Routes>
```

**Done when:**
```
✅ /login page renders with username + password fields
✅ Successful login redirects to /search
✅ Wrong credentials show an error message
✅ Visiting /search without logging in redirects to /login
✅ After login, user's name shows in the top right
✅ Logout button clears token and sends user back to /login
```

---

### Module 7 — React: Search Page UI
**Timeline: Day 6–7**

**Goal:** Full working search UI — single and bulk modes, results displayed with cache badge.

**Files to create:**
- `frontend/src/api/searchApi.ts` — typed `singleSearch()` and `bulkSearch()` functions
- `frontend/src/pages/Search.tsx` — main search page with tab toggle
- `frontend/src/components/ResultCard.tsx` — one search result card
- `frontend/src/components/BulkResults.tsx` — grid of bulk results
- `frontend/src/components/CacheBadge.tsx` — "from cache ⚡" vs "fresh" indicator

**Single mode UI:**
```
[ Search input field                    ] [ Search ]
─────────────────────────────────────────────────────
Results for "iPhone 15 price"           ⚡ From cache
┌─────────────────────────────────────────────────┐
│ iPhone 15 — Apple                    $799.00    │
│ source: apple.com                               │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ iPhone 15 — Best Buy                 $799.99    │
└─────────────────────────────────────────────────┘
```

**Bulk mode UI:**
```
[ Term 1                ]
[ Term 2                ]
[ Term 3                ]     [ Run Bulk Search ]
─────────────────────────────────────────────────────
Bulk Results — 3 queries · 2 from cache

┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Term 1        │  │ Term 2  ⚡    │  │ Term 3  ⚡    │
│ $799          │  │ $249          │  │ $1299         │
└───────────────┘  └───────────────┘  └───────────────┘
```

**State shape in `Search.tsx`:**
```typescript
const [mode, setMode] = useState<SearchMode>('single');
const [query, setQuery] = useState<string>('');
const [bulkInput, setBulkInput] = useState<string>('');
const [result, setResult] = useState<SearchResult | null>(null);
const [bulkResult, setBulkResult] = useState<BulkSearchResult | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

**Done when:**
```
✅ Single search shows results with price cards
✅ Cache badge shows correctly (⚡ for cached, fresh indicator otherwise)
✅ Bulk mode: paste multiple terms, click Run, see all results in a grid
✅ Loading spinner shows while waiting for API
✅ Error message shows if API call fails
✅ Bulk results show how many were served from cache
```

---

### Module 8 — Polish + Test + Deploy
**Timeline: Day 8–10**

**Goal:** App fully works end to end, deployed and accessible from the internet.

**Polish tasks:**
- Add proper form validation (empty search, too-short password, etc.)
- Add a logout button visible on the Search page
- Handle expired JWT gracefully (Axios interceptor already does this — test it)
- Add a search history panel showing user's past searches (optional)
- Mobile responsive layout check

**Testing checklist — run through this manually:**
```
□ Register a new user
□ Try registering the same username again → should get error
□ Login with wrong password → should get error
□ Login with correct credentials → should redirect to /search
□ Single search: "iPhone 15 price" → results appear
□ Single search: "iPhone 15 price" again → badge shows "from cache", faster response
□ Bulk search: 3 terms → all 3 results appear
□ Bulk search same 3 terms → all served from cache
□ Wait 24 hours (or manually delete from search_cache) → fresh call happens again
□ Remove token from localStorage, refresh page → redirected to /login
□ Try hitting POST /api/search/single without token → 401 response
```

**Deploy Backend to Render.com:**
1. Push backend folder to a GitHub repo
2. Go to render.com → New → Web Service → connect repo
3. Build command: `npm install && npm run build`
4. Start command: `node dist/server.js`
5. Add all `.env` variables in Render's Environment section
6. Deploy — Render gives you a URL like `https://serp-backend.onrender.com`

**Deploy Frontend to Vercel:**
1. Push frontend folder to a GitHub repo
2. Go to vercel.com → New Project → connect repo
3. Framework: Vite (auto-detected)
4. Add environment variable: `VITE_API_URL=https://serp-backend.onrender.com/api`
5. Deploy — Vercel gives you a URL like `https://serp-search.vercel.app`

**Update CORS in `server.ts`:**
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://serp-search.vercel.app', // ← add your real Vercel URL
  ],
  credentials: true,
}));
```

**Done when:**
```
✅ Backend URL returns { success: true } from /health
✅ Frontend loads from Vercel URL in the browser
✅ Can register, login, and search from the live deployed URL
✅ Cache still works correctly in production
```

---

## How the 24-Hour Cache Works

```
User searches "iPhone 15 price"
        │
        ▼
Check search_cache WHERE
  query_text = 'iphone 15 price'
  AND engine = 'google'
  AND expires_at > NOW()
        │
   ┌────┴────┐
   │         │
  HIT       MISS
   │         │
   │         ▼
   │     Call SerpAPI
   │     (costs 1 credit)
   │         │
   │         ▼
   │     Save to search_cache
   │     (expires_at = NOW() + 24h)
   │         │
   └────┬────┘
        │
        ▼
Log to search_history
(served_from_cache = true/false)
        │
        ▼
Return result to React
```

**Important:** The cache is keyed on `query_text + engine` — not on `user_id`. So if User A searched "iPhone price" 2 hours ago, and User B searches the same thing now, User B also gets the cached result. This keeps SerpAPI credit usage low.

The `search_history` table is keyed per user — so we know each user's personal search history and can show it to them.

---

## API Reference

All protected routes require: `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ username, password }` | `{ success, message }` |
| POST | `/api/auth/login` | `{ username, password }` | `{ success, data: { token, user } }` |

### Search (protected)

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/search/single` | `{ query, engine? }` | `{ success, data: SearchResult }` |
| POST | `/api/search/bulk` | `{ queries: string[], engine? }` | `{ success, data: BulkSearchResult }` |

### SearchResult shape
```typescript
{
  query: string;
  engine: string;
  servedFromCache: boolean;
  cachedAt?: string;
  shoppingResults: { title, price, source, link?, thumbnail? }[];
  organicPrices: { title, price, source, link? }[];
}
```

---

## How to Run Locally

```bash
# 1. Clone / create the project
cd serp-project

# 2. Start the backend
cd backend
npm install
# Fill in backend/.env with your secrets
npm run dev

# 3. Start the frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. Run the DB schema (one time only)
# Supabase Dashboard → SQL Editor → paste backend/src/db/schema.sql → Run
```

| Service | URL |
|---|---|
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/health |
| Frontend | http://localhost:5173 |
| Supabase dashboard | https://supabase.com/dashboard |

---
