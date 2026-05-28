// Shared helpers for weather routes

import { fetchWeather, type WeatherData } from '../lib/open-meteo';
import { geocode, pickBest, type LocationResult } from '../lib/geocoding';
import { cacheGet, cacheSet, cacheKey } from '../lib/cache';

export interface LocationParams {
  lat: number;
  lon: number;
  name: string;
  error?: string;
}

export function parseLocation(url: URL): LocationParams {
  const city = url.searchParams.get('city');
  const latStr = url.searchParams.get('lat');
  const lonStr = url.searchParams.get('lon');

  // City search takes priority
  if (city && city.trim()) {
    return { lat: 0, lon: 0, name: '', _city: city.trim() } as any;
  }

  // Lat/lon fallback
  if (latStr && lonStr) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) {
      return { lat: 0, lon: 0, name: '', error: 'lat and lon must be numbers' };
    }
    if (lat < -90 || lat > 90) {
      return { lat: 0, lon: 0, name: '', error: 'lat must be -90 to 90' };
    }
    if (lon < -180 || lon > 180) {
      return { lat: 0, lon: 0, name: '', error: 'lon must be -180 to 180' };
    }
    return { lat, lon, name: '' };
  }

  return { lat: 0, lon: 0, name: '', error: 'Provide ?city= or ?lat=&lon=' };
}

// Resolve a location — geocode if needed, then return coords
export async function resolveLocation(url: URL): Promise<LocationParams & { geocoded?: LocationResult }> {
  const parsed = parseLocation(url);
  if (parsed.error) return parsed;

  const city = (url.searchParams.get('city') || '').trim();
  if (!city) return parsed;

  // Check geocoding cache first
  const geoCacheKey = `geo:${city.toLowerCase()}`;
  const cached = cacheGet<LocationResult>(geoCacheKey, 24 * 60 * 60 * 1000); // 24h TTL
  if (cached) {
    return { lat: cached.data.lat, lon: cached.data.lon, name: cached.data.name, geocoded: cached.data };
  }

  // Geocode
  const results = await geocode(city);
  const best = pickBest(results);
  if (!best) {
    return { lat: 0, lon: 0, name: '', error: `No location found for "${city}"` };
  }

  cacheSet(geoCacheKey, best);
  return { lat: best.lat, lon: best.lon, name: best.name, geocoded: best };
}

export async function getWeather(lat: number, lon: number): Promise<{ data: WeatherData; cacheHit: boolean }> {
  const key = cacheKey(lat, lon);
  const cached = cacheGet<WeatherData>(key);

  if (cached) {
    return { data: cached.data, cacheHit: true };
  }

  const data = await fetchWeather(lat, lon);
  cacheSet(key, data);
  return { data, cacheHit: false };
}
