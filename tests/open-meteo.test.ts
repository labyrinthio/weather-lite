// Tests for Open-Meteo API wrapper
import { describe, it, expect } from 'vitest';
import { buildUrl, parseWeather } from '../src/lib/open-meteo';

describe('buildUrl', () => {
  it('includes latitude and longitude', () => {
    const url = buildUrl(48.14, 11.58);
    expect(url).toContain('latitude=48.14');
    expect(url).toContain('longitude=11.58');
  });
  it('uses Open-Meteo base URL', () => {
    const url = buildUrl(0, 0);
    expect(url).toMatch(/^https:\/\/api\.open-meteo\.com\/v1\/forecast/);
  });
  it('includes required parameters', () => {
    const url = buildUrl(48.14, 11.58);
    expect(url).toContain('current=');
    expect(url).toContain('hourly=');
    expect(url).toContain('timezone=auto');
    expect(url).toContain('forecast_hours=12');
  });
});

describe('parseWeather', () => {
  const mockResponse = {
    current: {
      temperature_2m: 26.2,
      apparent_temperature: 26.9,
      relative_humidity_2m: 42,
      weather_code: 2,
      wind_speed_10m: 11.5,
      wind_direction_10m: 312,
    },
    hourly: {
      time: [
        '2026-05-27T12:00', '2026-05-27T13:00', '2026-05-27T14:00',
        '2026-05-27T15:00', '2026-05-27T16:00', '2026-05-27T17:00',
        '2026-05-27T18:00', '2026-05-27T19:00', '2026-05-27T20:00',
        '2026-05-27T21:00', '2026-05-27T22:00', '2026-05-27T23:00',
      ],
      temperature_2m: [26, 27, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19],
      weather_code: [2, 2, 2, 3, 3, 3, 0, 0, 0, 0, 0, 0],
    },
    timezone: 'Europe/Berlin',
  };

  it('parses current temperature', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.current.temperature).toBe(26);
  });
  it('rounds apparent temperature', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.current.feelsLike).toBe(27);
  });
  it('parses humidity', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.current.humidity).toBe(42);
  });
  it('parses weather code', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.current.weatherCode).toBe(2);
  });
  it('parses wind data', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.current.windSpeed).toBe(12);
    expect(data.current.windDirection).toBe(312);
  });
  it('parses exactly 12 hourly entries', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.hourly).toHaveLength(12);
  });
  it('first hourly entry has correct time', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.hourly[0].time).toBe('2026-05-27T12:00');
  });
  it('stores coordinates', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.lat).toBe(48.14);
    expect(data.lon).toBe(11.58);
  });
  it('stores API latency', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.apiLatencyMs).toBe(150);
  });
  it('stores fetchedAt timestamp', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.fetchedAt).toBeGreaterThan(0);
  });
  it('stores timezone from response', () => {
    const data = parseWeather(mockResponse, 48.14, 11.58, 150);
    expect(data.timezone).toBe('Europe/Berlin');
  });
  it('defaults timezone to UTC when missing', () => {
    const noTz = { ...mockResponse };
    delete (noTz as any).timezone;
    const data = parseWeather(noTz, 0, 0, 100);
    expect(data.timezone).toBe('UTC');
  });
});

describe('parseWeather edge cases', () => {
  it('handles negative temperatures', () => {
    const json = {
      current: {
        temperature_2m: -15.7,
        apparent_temperature: -20.3,
        relative_humidity_2m: 85,
        weather_code: 71,
        wind_speed_10m: 25,
        wind_direction_10m: 180,
      },
      hourly: {
        time: Array.from({ length: 12 }, (_, i) => `2026-01-15T${String(i).padStart(2, '0')}:00`),
        temperature_2m: Array(12).fill(-15),
        weather_code: Array(12).fill(71),
      },
    };
    const data = parseWeather(json, 64.15, -21.94, 200);
    expect(data.current.temperature).toBe(-16);
    expect(data.current.feelsLike).toBe(-20);
  });
  it('handles zero wind direction', () => {
    const json = {
      current: {
        temperature_2m: 20,
        apparent_temperature: 20,
        relative_humidity_2m: 50,
        weather_code: 0,
        wind_speed_10m: 0,
        wind_direction_10m: 0,
      },
      hourly: {
        time: Array.from({ length: 12 }, (_, i) => `2026-05-27T${String(i).padStart(2, '0')}:00`),
        temperature_2m: Array(12).fill(20),
        weather_code: Array(12).fill(0),
      },
    };
    const data = parseWeather(json, 0, 0, 100);
    expect(data.current.windDirection).toBe(0);
  });
  it('throws on error response', () => {
    const errJson = { error: true, reason: 'Invalid coordinates' };
    expect(() => parseWeather(errJson, 999, 999, 0)).toThrow('Open-Meteo error: Invalid coordinates');
  });
  it('throws on missing current/hourly', () => {
    expect(() => parseWeather({}, 0, 0, 0)).toThrow('missing current or hourly data');
  });
  it('throws on null input', () => {
    expect(() => parseWeather(null, 0, 0, 0)).toThrow('not an object');
  });
  it('defaults missing fields to 0', () => {
    const json = {
      current: { temperature_2m: 20 },
      hourly: {
        time: Array.from({ length: 3 }, (_, i) => `2026-05-27T${String(i).padStart(2, '0')}:00`),
        temperature_2m: [20, 20, 20],
        weather_code: [0, 0, 0],
      },
    };
    const data = parseWeather(json, 0, 0, 100);
    expect(data.current.feelsLike).toBe(0);
    expect(data.current.humidity).toBe(0);
    expect(data.current.windSpeed).toBe(0);
    expect(data.current.windDirection).toBe(0);
  });
});
