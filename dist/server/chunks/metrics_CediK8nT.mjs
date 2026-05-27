const BASE = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 1e4;
const PARAMS = [
  "current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
  "hourly=temperature_2m,weather_code",
  "timezone=auto",
  "forecast_hours=12"
].join("&");
function buildUrl(lat, lon) {
  return `${BASE}?latitude=${lat}&longitude=${lon}&${PARAMS}`;
}
function parseWeather(json, lat, lon, latencyMs) {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid response from Open-Meteo: not an object");
  }
  if (json.error) {
    throw new Error(`Open-Meteo error: ${json.reason || json.error}`);
  }
  if (!json.current || !json.hourly) {
    throw new Error("Invalid response from Open-Meteo: missing current or hourly data");
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
      windDirection: c.wind_direction_10m ?? 0
    },
    hourly: json.hourly.time.slice(0, 12).map((time, i) => ({
      time,
      temperature: Math.round(json.hourly.temperature_2m[i] ?? 0),
      weatherCode: json.hourly.weather_code[i] ?? 0
    })),
    location: `${lat},${lon}`,
    timezone: json.timezone ?? "UTC",
    fetchedAt: Date.now(),
    apiLatencyMs: latencyMs
  };
}
async function fetchWeather(lat, lon) {
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
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Open-Meteo request timed out after 10s");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const store = /* @__PURE__ */ new Map();
const DEFAULT_TTL_MS = 10 * 60 * 1e3;
const MAX_ENTRIES = 1e3;
function cacheGet(key, ttlMs = DEFAULT_TTL_MS) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt >= ttlMs) {
    store.delete(key);
    return null;
  }
  return { data: entry.data, hit: true };
}
function cacheSet(key, data) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { data, storedAt: Date.now() });
}
function cacheKey(lat, lon) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function parseCoords(url) {
  const latStr = url.searchParams.get("lat");
  const lonStr = url.searchParams.get("lon");
  if (!latStr || !lonStr) {
    return { lat: 0, lon: 0, error: "Missing lat or lon query params" };
  }
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (isNaN(lat) || isNaN(lon)) {
    return { lat: 0, lon: 0, error: "lat and lon must be numbers" };
  }
  if (lat < -90 || lat > 90) {
    return { lat: 0, lon: 0, error: "lat must be -90 to 90" };
  }
  if (lon < -180 || lon > 180) {
    return { lat: 0, lon: 0, error: "lon must be -180 to 180" };
  }
  return { lat, lon };
}
async function getWeather(lat, lon) {
  const key = cacheKey(lat, lon);
  const cached = cacheGet(key);
  if (cached) {
    return { data: cached.data, cacheHit: true };
  }
  const data = await fetchWeather(lat, lon);
  cacheSet(key, data);
  return { data, cacheHit: false };
}

const WMO = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  56: "Freezing Drizzle",
  57: "Heavy Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Light Snow Showers",
  86: "Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm+Hail",
  99: "Severe Thunderstorm"
};
function weatherLabel(code) {
  return WMO[code] ?? `Code ${code}`;
}
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function windCompass(deg) {
  if (!isFinite(deg) || isNaN(deg)) return "--";
  return DIRS[Math.round((deg % 360 + 360) % 360 / 45) % 8];
}
function extractHour(time) {
  const match = time.match(/T(\d{2}):/);
  return match ? parseInt(match[1], 10) : 0;
}
function groupHours(hourly) {
  const blocks = [];
  for (let i = 0; i < hourly.length; i += 3) {
    const chunk = hourly.slice(i, i + 3);
    const avgTemp = Math.round(chunk.reduce((s, h) => s + h.temperature, 0) / chunk.length);
    const mid = chunk[Math.floor(chunk.length / 2)];
    const startHour = extractHour(chunk[0].time);
    const endHour = extractHour(chunk[chunk.length - 1].time);
    const label = `${String(startHour).padStart(2, "0")}-${String((endHour + 1) % 24).padStart(2, "0")}`;
    const code = mid.weatherCode;
    blocks.push({
      label,
      temp: avgTemp,
      code,
      labelFull: `${label}: ${avgTemp}°C ${weatherLabel(code)}`
    });
  }
  return blocks;
}
function formatMin(w) {
  const cond = weatherLabel(w.current.weatherCode);
  const wind = windCompass(w.current.windDirection);
  const blocks = groupHours(w.hourly);
  const lines = [
    `${w.location} ${w.current.temperature}°C ${cond}`,
    `Wind: ${w.current.windSpeed}km/h ${wind} Humid: ${w.current.humidity}%`,
    `Feels: ${w.current.feelsLike}°C`,
    "---",
    `12h: ${blocks.map((b) => `${b.label} ${b.temp}°C ${weatherLabel(b.code)}`).join(" | ")}`
  ];
  return lines.join("\n");
}
function formatText(w) {
  const cond = weatherLabel(w.current.weatherCode);
  const wind = windCompass(w.current.windDirection);
  const blocks = groupHours(w.hourly);
  const lines = [
    `Weather for ${w.location}`,
    `Updated: ${new Date(w.fetchedAt).toISOString()}`,
    "",
    `Current: ${w.current.temperature}°C ${cond}`,
    `Feels like: ${w.current.feelsLike}°C`,
    `Humidity: ${w.current.humidity}%`,
    `Wind: ${w.current.windSpeed} km/h ${wind}`,
    "",
    "Next 12 hours:",
    ...blocks.map((b) => `  ${b.labelFull}`)
  ];
  return lines.join("\n");
}
function statusEmoji(code) {
  if (code === 0 || code === 1) return "☀";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫";
  if (code <= 57) return "🌧";
  if (code <= 67) return "🌧";
  if (code <= 77) return "❄";
  if (code <= 82) return "🌦";
  if (code <= 86) return "🌨";
  if (code >= 95) return "⛈";
  return "·";
}
function getAscii(code) {
  if (code === 0) return "    \\   /    \n    (   )    \n   (___(__)  ";
  if (code === 1) return "    \\  _/    \n    (   )    \n   (___(__)  ";
  if (code <= 3) return "    \\  _/    \n    (   )    \n   (__(_)    ";
  if (code <= 48) return "    _ - _    \n   _ - _     \n  _ - _ - _  ";
  return "    .--.     \n  .-(    ).  \n (___.__)__) ";
}
function formatNormal(w, metrics) {
  const cond = weatherLabel(w.current.weatherCode);
  const wind = windCompass(w.current.windDirection);
  const blocks = groupHours(w.hourly);
  const ascii = getAscii(w.current.weatherCode);
  const emoji = statusEmoji(w.current.weatherCode);
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;max-width:600px;margin:0 auto;padding:1rem;background:#111;color:#eee;font-size:14px;line-height:1.4}h1{font-size:1.1rem;margin-bottom:.5rem}pre{white-space:pre;font-size:12px;line-height:1.2}.current{display:flex;gap:1rem;margin:1rem 0}.info{flex:1}.meta{font-size:11px;color:#888;border-top:1px solid #333;padding-top:.5rem;margin-top:1rem}table{width:100%;border-collapse:collapse;margin:.5rem 0}td,th{text-align:left;padding:2px 6px;font-size:12px}th{color:#888}`;
  const hourRows = blocks.map(
    (b) => `<tr><td>${b.label}</td><td>${b.temp}°C</td><td>${statusEmoji(b.code)} ${weatherLabel(b.code)}</td></tr>`
  ).join("");
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
${w.current.temperature}°C ${cond} | api=${metrics.weatherApiMs}ms render=${metrics.renderMs}ms total=${metrics.totalMs}ms | cache=${metrics.cacheHit ? "hit" : "miss"}
</div>
</body>
</html>`;
}

function startTimer() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

export { formatNormal as a, formatText as b, formatMin as f, getWeather as g, parseCoords as p, startTimer as s };
