// Tests for Open-Meteo geocoding wrapper
import { describe, it, expect } from 'vitest';
import { buildGeocodeUrl, parseGeocodeResponse, pickBest } from '../src/lib/geocoding';

describe('buildGeocodeUrl', () => {
  it('encodes city name', () => {
    const url = buildGeocodeUrl('Munich');
    expect(url).toContain('name=Munich');
    expect(url).toContain('geocoding-api.open-meteo.com');
  });
  it('encodes spaces and special chars', () => {
    const url = buildGeocodeUrl('New York');
    expect(url).toContain('name=New%20York');
  });
  it('encodes unicode', () => {
    const url = buildGeocodeUrl('München');
    expect(url).toContain('name=M%C3%BCnchen');
  });
  it('includes count parameter', () => {
    const url = buildGeocodeUrl('Berlin', 3);
    expect(url).toContain('count=3');
  });
  it('defaults count to 5', () => {
    const url = buildGeocodeUrl('Berlin');
    expect(url).toContain('count=5');
  });
  it('includes language parameter', () => {
    const url = buildGeocodeUrl('Berlin');
    expect(url).toContain('language=en');
  });
});

describe('parseGeocodeResponse', () => {
  const mockResponse = {
    results: [
      {
        id: 2950159,
        name: 'Berlin',
        latitude: 52.52437,
        longitude: 13.41053,
        country: 'Germany',
        country_code: 'DE',
        admin1: 'Berlin',
        timezone: 'Europe/Berlin',
        population: 3426354,
      },
      {
        id: 5083330,
        name: 'Berlin',
        latitude: 43.9695,
        longitude: -71.2756,
        country: 'United States',
        country_code: 'US',
        admin1: 'New Hampshire',
        timezone: 'America/New_York',
        population: 1018,
      },
    ],
  };

  it('parses results array', () => {
    const results = parseGeocodeResponse(mockResponse);
    expect(results).toHaveLength(2);
  });
  it('parses first result fields', () => {
    const results = parseGeocodeResponse(mockResponse);
    expect(results[0].name).toBe('Berlin');
    expect(results[0].lat).toBeCloseTo(52.524, 2);
    expect(results[0].lon).toBeCloseTo(13.41, 2);
    expect(results[0].country).toBe('Germany');
    expect(results[0].country_code).toBe('DE');
    expect(results[0].population).toBe(3426354);
  });
  it('returns empty array for error response', () => {
    expect(parseGeocodeResponse({ error: true, reason: 'bad' })).toEqual([]);
  });
  it('returns empty array for null input', () => {
    expect(parseGeocodeResponse(null)).toEqual([]);
  });
  it('returns empty array for missing results', () => {
    expect(parseGeocodeResponse({})).toEqual([]);
  });
  it('handles missing fields gracefully', () => {
    const results = parseGeocodeResponse({ results: [{ id: 1 }] });
    expect(results[0].name).toBe('');
    expect(results[0].population).toBe(0);
  });
});

describe('pickBest', () => {
  it('picks the most populated result', () => {
    const results = [
      { id: 1, name: 'Berlin NH', lat: 44, lon: -71, country: 'US', country_code: 'US', admin1: '', timezone: '', population: 1018 },
      { id: 2, name: 'Berlin', lat: 52, lon: 13, country: 'DE', country_code: 'DE', admin1: '', timezone: '', population: 3426354 },
    ];
    expect(pickBest(results)!.name).toBe('Berlin');
  });
  it('returns null for empty array', () => {
    expect(pickBest([])).toBeNull();
  });
  it('returns single result', () => {
    const r = { id: 1, name: 'X', lat: 0, lon: 0, country: '', country_code: '', admin1: '', timezone: '', population: 100 };
    expect(pickBest([r])).toBe(r);
  });
});
