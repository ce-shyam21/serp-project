// src/components/BulkResults.tsx
import type { BulkSearchResult } from '../types';
import { ResultCard } from './ResultCard';
import { CacheBadge } from './CacheBadge';
import './BulkResults.css';

interface Props {
  data: BulkSearchResult;
}

export function BulkResults({ data }: Props) {
  return (
    <div className="bulk-results">
      <p className="bulk-results__summary">
        {data.totalCount} queries · {data.cachedCount} from cache
      </p>

      <div className="bulk-results__grid">
        {data.results.map((result) => (
          <div key={result.query} className="bulk-results__item">
            <div className="bulk-results__item-header">
              <span className="bulk-results__query">{result.query}</span>
              <CacheBadge
                fromCache={result.servedFromCache}
                cachedAt={result.cachedAt}
              />
            </div>

            {result.shoppingResults.length === 0 &&
             result.organicPrices.length === 0 ? (
              <p className="bulk-results__empty">No pricing results found</p>
            ) : (
              <div className="bulk-results__cards">
                {[...result.shoppingResults, ...result.organicPrices]
                  .slice(0, 3)
                  .map((item, i) => (
                    <ResultCard key={i} item={item} />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}