// Tests for cache module
import { describe, it, expect, beforeEach } from 'vitest';
import { cacheGet, cacheSet, cacheKey, cacheSize, cacheClear } from '../src/lib/cache';

describe('cacheKey', () => {
  it('formats rounded coordinates without mode', () => {
    expect(cacheKey(48.14, 11.58)).toBe('48.14,11.58');
  });
  it('pads coordinates consistently', () => {
    expect(cacheKey(0, 0)).toBe('0.00,0.00');
  });
  it('same coords produce same key regardless of precision', () => {
    expect(cacheKey(48.141, 11.583)).toBe(cacheKey(48.142, 11.584));
  });
});

describe('cacheSet / cacheGet', () => {
  beforeEach(() => {
    cacheClear();
  });

  it('stores and retrieves data', () => {
    cacheSet('test:key1', { value: 42 });
    const result = cacheGet<{ value: number }>('test:key1');
    expect(result).not.toBeNull();
    expect(result!.data.value).toBe(42);
    expect(result!.hit).toBe(true);
  });

  it('returns null for missing keys', () => {
    const result = cacheGet('test:nonexistent');
    expect(result).toBeNull();
  });

  it('returns null for expired entries', () => {
    cacheSet('test:expired', { value: 1 });
    const result = cacheGet('test:expired', 0); // TTL=0ms → always expired
    expect(result).toBeNull();
  });

  it('overwrites existing keys', () => {
    cacheSet('test:overwrite', { v: 1 });
    cacheSet('test:overwrite', { v: 2 });
    const result = cacheGet<{ v: number }>('test:overwrite');
    expect(result!.data.v).toBe(2);
  });

  it('tracks cache size', () => {
    expect(cacheSize()).toBe(0);
    cacheSet('a', 1);
    cacheSet('b', 2);
    expect(cacheSize()).toBe(2);
  });
});

describe('cacheClear', () => {
  it('empties the cache', () => {
    cacheSet('x', 1);
    cacheSet('y', 2);
    cacheClear();
    expect(cacheSize()).toBe(0);
    expect(cacheGet('x')).toBeNull();
  });
});
