// Simple server-side cache with TTL

interface CacheEntry<T> {
  data: T;
  storedAt: number;
}

const store = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ENTRIES = 1000;

export function cacheGet<T>(key: string, ttlMs = DEFAULT_TTL_MS): { data: T; hit: boolean } | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt >= ttlMs) {
    store.delete(key);
    return null;
  }
  return { data: entry.data as T, hit: true };
}

export function cacheSet<T>(key: string, data: T): void {
  // Evict oldest entries if at capacity
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { data, storedAt: Date.now() });
}

export function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export function cacheSize(): number {
  return store.size;
}

export function cacheClear(): void {
  store.clear();
}
