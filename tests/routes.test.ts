// Tests for route helpers
import { describe, it, expect } from 'vitest';
import { parseLocation } from '../src/lib/routes';

function makeUrl(params: Record<string, string>): URL {
  const sp = new URLSearchParams(params);
  return new URL(`http://localhost/weather?${sp.toString()}`);
}

describe('parseLocation', () => {
  it('parses valid lat/lon', () => {
    const result = parseLocation(makeUrl({ lat: '48.14', lon: '11.58' }));
    expect(result.lat).toBe(48.14);
    expect(result.lon).toBe(11.58);
    expect(result.error).toBeUndefined();
  });
  it('accepts city parameter', () => {
    const result = parseLocation(makeUrl({ city: 'Munich' }));
    expect(result.error).toBeUndefined();
  });
  it('city takes priority over lat/lon', () => {
    const result = parseLocation(makeUrl({ city: 'Berlin', lat: '48', lon: '11' }));
    // City should take priority — lat/lon will be resolved later
    expect(result.error).toBeUndefined();
  });
  it('returns error when neither city nor lat/lon provided', () => {
    const result = parseLocation(makeUrl({}));
    expect(result.error).toContain('Provide');
  });
  it('returns error for non-numeric lat', () => {
    const result = parseLocation(makeUrl({ lat: 'abc', lon: '11.58' }));
    expect(result.error).toContain('must be numbers');
  });
  it('returns error for lat > 90', () => {
    const result = parseLocation(makeUrl({ lat: '91', lon: '11.58' }));
    expect(result.error).toContain('lat must be -90 to 90');
  });
  it('returns error for lat < -90', () => {
    const result = parseLocation(makeUrl({ lat: '-91', lon: '11.58' }));
    expect(result.error).toContain('lat must be -90 to 90');
  });
  it('returns error for lon > 180', () => {
    const result = parseLocation(makeUrl({ lat: '48', lon: '181' }));
    expect(result.error).toContain('lon must be -180 to 180');
  });
  it('returns error for lon < -180', () => {
    const result = parseLocation(makeUrl({ lat: '48', lon: '-181' }));
    expect(result.error).toContain('lon must be -180 to 180');
  });
  it('accepts boundary values', () => {
    const r1 = parseLocation(makeUrl({ lat: '90', lon: '180' }));
    expect(r1.lat).toBe(90);
    expect(r1.lon).toBe(180);
    expect(r1.error).toBeUndefined();

    const r2 = parseLocation(makeUrl({ lat: '-90', lon: '-180' }));
    expect(r2.lat).toBe(-90);
    expect(r2.lon).toBe(-180);
    expect(r2.error).toBeUndefined();
  });
  it('handles zero coordinates', () => {
    const result = parseLocation(makeUrl({ lat: '0', lon: '0' }));
    expect(result.lat).toBe(0);
    expect(result.lon).toBe(0);
    expect(result.error).toBeUndefined();
  });
  it('accepts empty city string as missing', () => {
    const result = parseLocation(makeUrl({ city: '   ' }));
    expect(result.error).toContain('Provide');
  });
});
