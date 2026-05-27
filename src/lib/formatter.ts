// Weather formatting — terse, human-readable output

import type { WeatherData } from './open-meteo';

// WMO weather code → short label
const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  56: 'Freezing Drizzle',
  57: 'Heavy Freezing Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Light Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm+Hail',
  99: 'Severe Thunderstorm',
};

export function weatherLabel(code: number): string {
  return WMO[code] ?? `Code ${code}`;
}

// Wind direction degrees → compass
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function windCompass(deg: number): string {
  if (!isFinite(deg) || isNaN(deg)) return '--';
  return DIRS[Math.round(((deg % 360 + 360) % 360) / 45) % 8];
}

// Extract hour from Open-Meteo time string without Date parsing (timezone-safe)
// Open-Meteo returns "2026-05-27T14:00" in the location's local timezone
function extractHour(time: string): number {
  const match = time.match(/T(\d{2}):/);
  return match ? parseInt(match[1], 10) : 0;
}

// Group hourly data into 3-hour blocks for compact display
export interface HourBlock {
  label: string;   // e.g. "12-15"
  temp: number;    // average rounded
  code: number;    // dominant weather code
  labelFull: string; // e.g. "12-15: 24°C Partly Cloudy"
}

export function groupHours(hourly: WeatherData['hourly']): HourBlock[] {
  const blocks: HourBlock[] = [];
  for (let i = 0; i < hourly.length; i += 3) {
    const chunk = hourly.slice(i, i + 3);
    const avgTemp = Math.round(chunk.reduce((s, h) => s + h.temperature, 0) / chunk.length);
    // Use the code from the middle hour (or last if fewer)
    const mid = chunk[Math.floor(chunk.length / 2)];
    const startHour = extractHour(chunk[0].time);
    const endHour = extractHour(chunk[chunk.length - 1].time);
    const label = `${String(startHour).padStart(2, '0')}-${String((endHour + 1) % 24).padStart(2, '0')}`;
    const code = mid.weatherCode;
    blocks.push({
      label,
      temp: avgTemp,
      code,
      labelFull: `${label}: ${avgTemp}°C ${weatherLabel(code)}`,
    });
  }
  return blocks;
}

// ── Minimum mode (<1KB target) ──

export function formatMin(w: WeatherData): string {
  const cond = weatherLabel(w.current.weatherCode);
  const wind = windCompass(w.current.windDirection);
  const blocks = groupHours(w.hourly);

  const lines = [
    `${w.location} ${w.current.temperature}°C ${cond}`,
    `Wind: ${w.current.windSpeed}km/h ${wind} Humid: ${w.current.humidity}%`,
    `Feels: ${w.current.feelsLike}°C`,
    '---',
    `12h: ${blocks.map(b => `${b.label} ${b.temp}°C ${weatherLabel(b.code)}`).join(' | ')}`,
  ];

  return lines.join('\n');
}

// ── Plain text mode ──

export function formatText(w: WeatherData): string {
  const cond = weatherLabel(w.current.weatherCode);
  const wind = windCompass(w.current.windDirection);
  const blocks = groupHours(w.hourly);

  const lines = [
    `Weather for ${w.location}`,
    `Updated: ${new Date(w.fetchedAt).toISOString()}`,
    '',
    `Current: ${w.current.temperature}°C ${cond}`,
    `Feels like: ${w.current.feelsLike}°C`,
    `Humidity: ${w.current.humidity}%`,
    `Wind: ${w.current.windSpeed} km/h ${wind}`,
    '',
    'Next 12 hours:',
    ...blocks.map(b => `  ${b.labelFull}`),
  ];

  return lines.join('\n');
}

// ── Normal mode (HTML, <5KB target) ──

function statusEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫';
  if (code <= 57) return '🌧';
  if (code <= 67) return '🌧';
  if (code <= 77) return '❄';
  if (code <= 82) return '🌦';
  if (code <= 86) return '🌨';
  if (code >= 95) return '⛈';
  return '·';
}

function getAscii(code: number): string {
  if (code === 0) return '    \\   /    \n    (   )    \n   (___(__)  ';
  if (code === 1) return '    \\  _/    \n    (   )    \n   (___(__)  ';
  if (code <= 3) return '    \\  _/    \n    (   )    \n   (__(_)    ';
  if (code <= 48) return '    _ - _    \n   _ - _     \n  _ - _ - _  ';
  return '    .--.     \n  .-(    ).  \n (___.__)__) ';
}

export function formatNormal(w: WeatherData, metrics: { totalMs: number; weatherApiMs: number; cacheHit: boolean; renderMs: number }): string {
  const cond = weatherLabel(w.current.weatherCode);
  const wind = windCompass(w.current.windDirection);
  const blocks = groupHours(w.hourly);
  const ascii = getAscii(w.current.weatherCode);
  const emoji = statusEmoji(w.current.weatherCode);

  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;max-width:600px;margin:0 auto;padding:1rem;background:#111;color:#eee;font-size:14px;line-height:1.4}h1{font-size:1.1rem;margin-bottom:.5rem}pre{white-space:pre;font-size:12px;line-height:1.2}.current{display:flex;gap:1rem;margin:1rem 0}.info{flex:1}.meta{font-size:11px;color:#888;border-top:1px solid #333;padding-top:.5rem;margin-top:1rem}table{width:100%;border-collapse:collapse;margin:.5rem 0}td,th{text-align:left;padding:2px 6px;font-size:12px}th{color:#888}`;

  const hourRows = blocks.map(b =>
    `<tr><td>${b.label}</td><td>${b.temp}°C</td><td>${statusEmoji(b.code)} ${weatherLabel(b.code)}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Weather ${w.location}</title>
<style>${css}</style>
</head>
<body>
<h1>${emoji} ${w.location}</h1>
<div class="current">
<pre>${ascii}</pre>
<div class="info">
<div><strong>${w.current.temperature}°C</strong> ${cond}</div>
<div>Feels ${w.current.feelsLike}°C</div>
<div>Wind ${w.current.windSpeed}km/h ${wind}</div>
<div>Humidity ${w.current.humidity}%</div>
</div>
</div>
<table>
<tr><th>Time</th><th>Temp</th><th>Condition</th></tr>
${hourRows}
</table>
<div class="meta">
${w.current.temperature}°C ${cond} | api=${metrics.weatherApiMs}ms render=${metrics.renderMs}ms total=${metrics.totalMs}ms | cache=${metrics.cacheHit ? 'hit' : 'miss'}
</div>
</body>
</html>`;
}
