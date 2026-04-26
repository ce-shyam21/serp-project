// src/services/serpService.ts
// Calls SerpAPI and extracts clean pricing data from the raw response.

import axios from 'axios';
import {
  SerpApiResult,
  PriceItem,
  SearchResult,
} from '../types';

const SERP_API_BASE = 'https://serpapi.com/search';

// ── Fetch from SerpAPI ───────────────────────────────────────────
export async function fetchFromSerpApi(
  query: string,
  engine: string = 'google'
): Promise<SerpApiResult> {
  const response = await axios.get<SerpApiResult>(SERP_API_BASE, {
    params: {
      q: query,
      engine,
      api_key: process.env.SERPAPI_KEY,
      gl: 'us',
      hl: 'en',
    },
    timeout: 10000, // 10s timeout — fail fast if SerpAPI is slow
  });

  return response.data;
}

// ── Extract pricing from raw SerpAPI response ────────────────────
// SerpAPI returns prices in two places:
//   shopping_results  — Google Shopping panel (structured, has prices)
//   organic_results   — Regular results (unstructured, may mention prices)
// We extract both and return them separately.

function extractShoppingResults(raw: SerpApiResult): PriceItem[] {
  const items = [
    ...(raw.shopping_results ?? []),
    ...(raw.inline_shopping_results ?? []),
  ];

  return items
    .filter((item) => item.price) // only items that have a price
    .map((item) => ({
      title: item.title ?? 'Unknown',
      price: item.price ?? '',
      source: item.source ?? 'Unknown',
      link: item.link,
      thumbnail: item.thumbnail,
    }));
}

function extractOrganicPrices(raw: SerpApiResult): PriceItem[] {
  return (raw.organic_results ?? [])
    .filter((item) => {
      // Keep organic results that mention a price in their snippet
      return item.snippet && /\$[\d,]+(\.\d{2})?/.test(item.snippet);
    })
    .map((item) => ({
      title: item.title ?? 'Unknown',
      price: extractPriceFromSnippet(item.snippet ?? ''),
      source: new URL(item.link).hostname.replace('www.', ''),
      link: item.link,
    }));
}

function extractPriceFromSnippet(snippet: string): string {
  const match = snippet.match(/\$[\d,]+(\.\d{2})?/);
  return match ? match[0] : '';
}

// ── Build final SearchResult from raw SerpAPI data ───────────────
export function buildSearchResult(
  query: string,
  engine: string,
  raw: SerpApiResult,
  servedFromCache: boolean,
  cachedAt?: Date
): SearchResult {
  return {
    query,
    engine,
    servedFromCache,
    cachedAt: cachedAt?.toISOString(),
    shoppingResults: extractShoppingResults(raw),
    organicPrices: extractOrganicPrices(raw),
  };
}