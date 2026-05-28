// Geocoding wrapper for Open-Meteo Geocoding API (free, no API key)

export interface LocationResult {
  id: number;
  name: string;
  lat: number;
  lon: number;
  country: string;
  country_code: string;
  admin1: string;
  timezone: string;
  population: number;
}

const BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 10_000;

export function buildGeocodeUrl(query: string, count = 5): string {
  return `${BASE}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
}

export function parseGeocodeResponse(json: any): LocationResult[] {
  if (!json || json.error) return [];
  if (!json.results || !Array.isArray(json.results)) return [];

  return json.results.map((r: any) => ({
    id: r.id ?? 0,
    name: r.name ?? '',
    lat: r.latitude ?? 0,
    lon: r.longitude ?? 0,
    country: r.country ?? '',
    country_code: r.country_code ?? '',
    admin1: r.admin1 ?? '',
    timezone: r.timezone ?? 'UTC',
    population: r.population ?? 0,
  }));
}

// Pick the most populated result (best guess for ambiguous queries)
export function pickBest(results: LocationResult[]): LocationResult | null {
  if (results.length === 0) return null;
  return results.reduce((best, r) => r.population > best.population ? r : best, results[0]);
}

export async function geocode(query: string): Promise<LocationResult[]> {
  const url = buildGeocodeUrl(query);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
    const json = await res.json();
    return parseGeocodeResponse(json);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Geocoding request timed out after 10s');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
