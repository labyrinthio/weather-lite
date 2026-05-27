// Tests for weather formatter
import { describe, it, expect } from 'vitest';
import {
  weatherLabel,
  windCompass,
  groupHours,
  formatMin,
  formatText,
  formatNormal,
} from '../src/lib/formatter';
import type { WeatherData } from '../src/lib/open-meteo';

const mockWeather: WeatherData = {
  lat: 48.14,
  lon: 11.58,
  current: {
    temperature: 26,
    feelsLike: 27,
    humidity: 42,
    weatherCode: 2,
    windSpeed: 12,
    windDirection: 315,
  },
  hourly: Array.from({ length: 12 }, (_, i) => ({
    time: `2026-05-27T${String(i + 12).padStart(2, '0')}:00`,
    temperature: 24 + Math.floor(i / 4),
    weatherCode: i < 4 ? 2 : i < 8 ? 3 : 0,
  })),
  location: '48.14,11.58',
  timezone: 'Europe/Berlin',
  fetchedAt: new Date('2026-05-27T12:00:00Z').getTime(),
  apiLatencyMs: 150,
};

describe('weatherLabel', () => {
  it('maps WMO code 0 to Clear', () => {
    expect(weatherLabel(0)).toBe('Clear');
  });
  it('maps WMO code 2 to Partly Cloudy', () => {
    expect(weatherLabel(2)).toBe('Partly Cloudy');
  });
  it('maps WMO code 61 to Light Rain', () => {
    expect(weatherLabel(61)).toBe('Light Rain');
  });
  it('maps WMO code 95 to Thunderstorm', () => {
    expect(weatherLabel(95)).toBe('Thunderstorm');
  });
  it('handles unknown codes gracefully', () => {
    expect(weatherLabel(999)).toBe('Code 999');
  });
});

describe('windCompass', () => {
  it('maps 0° to N', () => { expect(windCompass(0)).toBe('N'); });
  it('maps 90° to E', () => { expect(windCompass(90)).toBe('E'); });
  it('maps 180° to S', () => { expect(windCompass(180)).toBe('S'); });
  it('maps 270° to W', () => { expect(windCompass(270)).toBe('W'); });
  it('maps 315° to NW', () => { expect(windCompass(315)).toBe('NW'); });
  it('maps 45° to NE', () => { expect(windCompass(45)).toBe('NE'); });
  it('returns -- for NaN', () => { expect(windCompass(NaN)).toBe('--'); });
  it('returns -- for undefined cast to number', () => { expect(windCompass(undefined as any)).toBe('--'); });
  it('handles negative degrees', () => { expect(windCompass(-45)).toBe('NW'); });
  it('handles degrees >= 360', () => { expect(windCompass(405)).toBe('NE'); });
});

describe('groupHours', () => {
  it('groups 12 hours into 4 blocks of 3', () => {
    const blocks = groupHours(mockWeather.hourly);
    expect(blocks).toHaveLength(4);
  });
  it('first block label starts at 12', () => {
    const blocks = groupHours(mockWeather.hourly);
    expect(blocks[0].label).toBe('12-15');
  });
  it('calculates average temperature per block', () => {
    const blocks = groupHours(mockWeather.hourly);
    // Hours 12-14: temps 24,24,24 → avg 24
    expect(blocks[0].temp).toBe(24);
  });
  it('uses middle hour weather code', () => {
    const blocks = groupHours(mockWeather.hourly);
    // Middle of first block (index 1) → code 2
    expect(blocks[0].code).toBe(2);
  });
  it('handles wrap-around midnight in label', () => {
    const nightHours = Array.from({ length: 12 }, (_, i) => ({
      time: `2026-05-27T${String((i + 21) % 24).padStart(2, '0')}:00`,
      temperature: 15,
      weatherCode: 0,
    }));
    const blocks = groupHours(nightHours);
    // Last block: 03-06 wraps around
    const lastBlock = blocks[blocks.length - 1];
    expect(lastBlock.label).toMatch(/^\d{2}-\d{2}$/);
  });
  it('timezone-safe: extracts hour from time string without Date', () => {
    // The key check: we parse "T14:" from "2026-05-27T14:00" directly
    const singleHour = [{ time: '2026-01-01T14:00', temperature: 20, weatherCode: 0 }];
    // groupHours needs 3-hour chunks, so test via the full formatMin
    const w = { ...mockWeather, hourly: singleHour.concat(singleHour, singleHour) };
    const out = formatMin(w);
    expect(out).toContain('14-');
  });
});

describe('formatMin', () => {
  it('returns plain text without HTML tags', () => {
    const out = formatMin(mockWeather);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
  });
  it('contains current temperature', () => {
    const out = formatMin(mockWeather);
    expect(out).toContain('26°C');
  });
  it('contains humidity and wind', () => {
    const out = formatMin(mockWeather);
    expect(out).toContain('Humid: 42%');
    expect(out).toContain('Wind: 12km/h NW');
  });
  it('contains 12-hour forecast', () => {
    const out = formatMin(mockWeather);
    expect(out).toContain('12h:');
    expect(out).toContain('12-15');
  });
  it('contains separator', () => {
    const out = formatMin(mockWeather);
    expect(out).toContain('---');
  });
  it('is under 500 bytes for typical data', () => {
    const out = formatMin(mockWeather);
    expect(new TextEncoder().encode(out).length).toBeLessThan(500);
  });
});

describe('formatText', () => {
  it('returns plain text without HTML', () => {
    const out = formatText(mockWeather);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
  });
  it('includes header with coordinates', () => {
    const out = formatText(mockWeather);
    expect(out).toContain('Weather for 48.14,11.58');
  });
  it('includes updated timestamp', () => {
    const out = formatText(mockWeather);
    expect(out).toContain('Updated:');
  });
  it('includes all current conditions', () => {
    const out = formatText(mockWeather);
    expect(out).toContain('Current: 26°C');
    expect(out).toContain('Feels like: 27°C');
    expect(out).toContain('Humidity: 42%');
    expect(out).toContain('Wind: 12 km/h NW');
  });
  it('includes 12-hour forecast section', () => {
    const out = formatText(mockWeather);
    expect(out).toContain('Next 12 hours:');
    expect(out).toContain('12-15: 24°C');
  });
});

describe('formatNormal', () => {
  const metrics = { totalMs: 200, weatherApiMs: 150, cacheHit: false, renderMs: 10 };
  it('returns valid HTML', () => {
    const out = formatNormal(mockWeather, metrics);
    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('</html>');
  });
  it('contains current temperature', () => {
    const out = formatNormal(mockWeather, metrics);
    expect(out).toContain('26°C');
  });
  it('contains metrics', () => {
    const out = formatNormal(mockWeather, metrics);
    expect(out).toContain('api=150ms');
    expect(out).toContain('total=200ms');
    expect(out).toContain('render=10ms');
    expect(out).toContain('cache=miss');
  });
  it('contains inline CSS only (no external resources)', () => {
    const out = formatNormal(mockWeather, metrics);
    expect(out).not.toContain('href="');
    expect(out).not.toContain('src="');
  });
  it('contains zero client JS', () => {
    const out = formatNormal(mockWeather, metrics);
    expect(out).not.toContain('<script');
  });
  it('includes weather table', () => {
    const out = formatNormal(mockWeather, metrics);
    expect(out).toContain('<table>');
    expect(out).toContain('12-15');
  });
  it('shows cache=hit when cacheHit is true', () => {
    const out = formatNormal(mockWeather, { ...metrics, cacheHit: true });
    expect(out).toContain('cache=hit');
  });
});
