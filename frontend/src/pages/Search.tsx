// src/pages/Search.tsx
import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { singleSearch, bulkSearch } from '../api/searchApi';
import { ResultCard } from '../components/ResultCard';
import { BulkResults } from '../components/BulkResults';
import { CacheBadge } from '../components/CacheBadge';
import type { SearchResult, BulkSearchResult, SearchMode } from '../types';
import './Search.css';

export function Search() {
  const { user, logout } = useAuth();

  const [mode, setMode]             = useState<SearchMode>('single');
  const [query, setQuery]           = useState('');
  const [bulkInput, setBulkInput]   = useState('');
  const [result, setResult]         = useState<SearchResult | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkSearchResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Single search ──────────────────────────────────────────────
  const handleSingleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await singleSearch({ query: query.trim() });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Bulk search ────────────────────────────────────────────────
  const handleBulkSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const queries = bulkInput
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (queries.length === 0) {
      setError('Enter at least one search term');
      return;
    }
    if (queries.length > 50) {
      setError('Maximum 50 queries allowed');
      return;
    }

    setLoading(true);
    setError(null);
    setBulkResult(null);

    try {
      const data = await bulkSearch({ queries });
      setBulkResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk search failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: SearchMode) => {
    setMode(m);
    setError(null);
    setResult(null);
    setBulkResult(null);
  };

  return (
    <div className="search-page">

      {/* ── Header ── */}
      <header className="search-header">
        <span className="search-logo">SerpSearch</span>
        <div className="search-header__right">
          <span className="search-username">👤 {user?.username}</span>
          <button className="search-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="search-main">

        {/* ── Mode tabs ── */}
        <div className="search-tabs">
          <button
            className={`search-tab ${mode === 'single' ? 'active' : ''}`}
            onClick={() => switchMode('single')}
          >
            Single Search
          </button>
          <button
            className={`search-tab ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => switchMode('bulk')}
          >
            Bulk Search
          </button>
        </div>

        {/* ── Single mode ── */}
        {mode === 'single' && (
          <form className="search-form" onSubmit={handleSingleSearch}>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "iPhone 15 price"'
              disabled={loading}
            />
            <button
              className="search-btn"
              type="submit"
              disabled={loading || !query.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        )}

        {/* ── Bulk mode ── */}
        {mode === 'bulk' && (
          <form className="search-form search-form--bulk" onSubmit={handleBulkSearch}>
            <textarea
              className="search-textarea"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={'One search term per line:\niPhone 15 price\nMacBook Pro price\nAirPods Pro price'}
              rows={6}
              disabled={loading}
            />
            <button
              className="search-btn"
              type="submit"
              disabled={loading || !bulkInput.trim()}
            >
              {loading ? 'Searching...' : 'Run Bulk Search'}
            </button>
          </form>
        )}

        {/* ── Error ── */}
        {error && <p className="search-error">{error}</p>}

        {/* ── Loading ── */}
        {loading && (
          <div className="search-loading">
            <span className="search-spinner" />
            {mode === 'bulk'
              ? 'Running bulk search — this may take a moment...'
              : 'Searching...'}
          </div>
        )}

        {/* ── Single result ── */}
        {result && !loading && (
          <section className="search-results">
            <div className="search-results__header">
              <h2 className="search-results__title">
                Results for "{result.query}"
              </h2>
              <CacheBadge
                fromCache={result.servedFromCache}
                cachedAt={result.cachedAt}
              />
            </div>

            {result.shoppingResults.length === 0 &&
             result.organicPrices.length === 0 ? (
              <p className="search-results__empty">
                No pricing results found for this query.
              </p>
            ) : (
              <div className="search-results__list">
                {[...result.shoppingResults, ...result.organicPrices].map(
                  (item, i) => <ResultCard key={i} item={item} />
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Bulk result ── */}
        {bulkResult && !loading && (
          <section className="search-results">
            <h2 className="search-results__title">Bulk Results</h2>
            <BulkResults data={bulkResult} />
          </section>
        )}

      </main>
    </div>
  );
}