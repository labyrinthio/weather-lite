// Shared helpers for weather routes

import { fetchWeather, type WeatherData } from '../lib/open-meteo';
import { cacheGet, cacheSet, cacheKey } from '../lib/cache';

export function parseCoords(url: URL): { lat: number; lon: number; error?: string } {
  const latStr = url.searchParams.get('lat');
  const lonStr = url.searchParams.get('lon');

  if (!latStr || !lonStr) {
    return { lat: 0, lon: 0, error: 'Missing lat or lon query params' };
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return { lat: 0, lon: 0, error: 'lat and lon must be numbers' };
  }
  if (lat < -90 || lat > 90) {
    return { lat: 0, lon: 0, error: 'lat must be -90 to 90' };
  }
  if (lon < -180 || lon > 180) {
    return { lat: 0, lon: 0, error: 'lon must be -180 to 180' };
  }

  return { lat, lon };
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
