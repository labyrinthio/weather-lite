// Tests for route helpers
import { describe, it, expect } from 'vitest';
import { parseCoords } from '../src/lib/routes';

function makeUrl(lat?: string, lon?: string): URL {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set('lat', lat);
  if (lon !== undefined) params.set('lon', lon);
  return new URL(`http://localhost/weather?${params.toString()}`);
}

describe('parseCoords', () => {
  it('parses valid coordinates', () => {
    const result = parseCoords(makeUrl('48.14', '11.58'));
    expect(result.lat).toBe(48.14);
    expect(result.lon).toBe(11.58);
    expect(result.error).toBeUndefined();
  });
  it('returns error when lat is missing', () => {
    const result = parseCoords(makeUrl(undefined, '11.58'));
    expect(result.error).toContain('Missing lat or lon');
  });
  it('returns error when lon is missing', () => {
    const result = parseCoords(makeUrl('48.14', undefined));
    expect(result.error).toContain('Missing lat or lon');
  });
  it('returns error when both are missing', () => {
    const result = parseCoords(makeUrl());
    expect(result.error).toContain('Missing lat or lon');
  });
  it('returns error for non-numeric lat', () => {
    const result = parseCoords(makeUrl('abc', '11.58'));
    expect(result.error).toContain('must be numbers');
  });
  it('returns error for non-numeric lon', () => {
    const result = parseCoords(makeUrl('48.14', 'xyz'));
    expect(result.error).toContain('must be numbers');
  });
  it('returns error for lat > 90', () => {
    const result = parseCoords(makeUrl('91', '11.58'));
    expect(result.error).toContain('lat must be -90 to 90');
  });
  it('returns error for lat < -90', () => {
    const result = parseCoords(makeUrl('-91', '11.58'));
    expect(result.error).toContain('lat must be -90 to 90');
  });
  it('returns error for lon > 180', () => {
    const result = parseCoords(makeUrl('48.14', '181'));
    expect(result.error).toContain('lon must be -180 to 180');
  });
  it('returns error for lon < -180', () => {
    const result = parseCoords(makeUrl('48.14', '-181'));
    expect(result.error).toContain('lon must be -180 to 180');
  });
  it('accepts boundary values', () => {
    const r1 = parseCoords(makeUrl('90', '180'));
    expect(r1.lat).toBe(90);
    expect(r1.lon).toBe(180);
    expect(r1.error).toBeUndefined();

    const r2 = parseCoords(makeUrl('-90', '-180'));
    expect(r2.lat).toBe(-90);
    expect(r2.lon).toBe(-180);
    expect(r2.error).toBeUndefined();
  });
  it('handles zero coordinates', () => {
    const result = parseCoords(makeUrl('0', '0'));
    expect(result.lat).toBe(0);
    expect(result.lon).toBe(0);
    expect(result.error).toBeUndefined();
  });
});
