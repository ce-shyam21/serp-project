// src/api/searchApi.ts
import axiosInstance from './axiosInstance';
import type {
  SingleSearchPayload,
  BulkSearchPayload,
  SearchResult,
  BulkSearchResult,
  ApiResponse,
} from '../types';

export async function singleSearch(payload: SingleSearchPayload): Promise<SearchResult> {
  const res = await axiosInstance.post<ApiResponse<SearchResult>>(
    '/search/single',
    payload
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error ?? 'Search failed');
  }
  return res.data.data;
}

export async function bulkSearch(payload: BulkSearchPayload): Promise<BulkSearchResult> {
  const res = await axiosInstance.post<ApiResponse<BulkSearchResult>>(
    '/search/bulk',
    payload
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error ?? 'Bulk search failed');
  }
  return res.data.data;
}