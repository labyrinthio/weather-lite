// Weather API wrapper for Open-Meteo (free, no API key)

export interface WeatherData {
  lat: number;
  lon: number;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
  }>;
  location: string;
  timezone: string;
  fetchedAt: number;
  apiLatencyMs: number;
}

const BASE = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000;

const PARAMS = [
  'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
  'hourly=temperature_2m,weather_code',
  'timezone=auto',
  'forecast_hours=12',
].join('&');

export function buildUrl(lat: number, lon: number): string {
  return `${BASE}?latitude=${lat}&longitude=${lon}&${PARAMS}`;
}

export function parseWeather(json: any, lat: number, lon: number, latencyMs: number): WeatherData {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid response from Open-Meteo: not an object');
  }
  if (json.error) {
    throw new Error(`Open-Meteo error: ${json.reason || json.error}`);
  }
  if (!json.current || !json.hourly) {
    throw new Error('Invalid response from Open-Meteo: missing current or hourly data');
  }

  const c = json.current;
  return {
    lat,
    lon,
    current: {
      temperature: Math.round(c.temperature_2m ?? 0),
      feelsLike: Math.round(c.apparent_temperature ?? 0),
      humidity: Math.round(c.relative_humidity_2m ?? 0),
      weatherCode: c.weather_code ?? 0,
      windSpeed: Math.round(c.wind_speed_10m ?? 0),
      windDirection: c.wind_direction_10m ?? 0,
    },
    hourly: json.hourly.time.slice(0, 12).map((time: string, i: number) => ({
      time,
      temperature: Math.round(json.hourly.temperature_2m[i] ?? 0),
      weatherCode: json.hourly.weather_code[i] ?? 0,
    })),
    location: `${lat},${lon}`,
    timezone: json.timezone ?? 'UTC',
    fetchedAt: Date.now(),
    apiLatencyMs: latencyMs,
  };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = buildUrl(lat, lon);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = performance.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return parseWeather(json, lat, lon, latencyMs);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Open-Meteo request timed out after 10s');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
