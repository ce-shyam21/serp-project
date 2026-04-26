// src/components/CacheBadge.tsx
import './CacheBadge.css';

interface Props {
  fromCache: boolean;
  cachedAt?: string;
}

export function CacheBadge({ fromCache, cachedAt }: Props) {
  if (fromCache) {
    const time = cachedAt
      ? new Date(cachedAt).toLocaleTimeString()
      : null;

    return (
      <span className="cache-badge cache-badge--hit" title={time ? `Cached at ${time}` : undefined}>
        ⚡ From cache
      </span>
    );
  }

  return (
    <span className="cache-badge cache-badge--fresh">
      🔄 Fresh result
    </span>
  );
}