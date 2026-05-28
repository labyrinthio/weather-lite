# weather-lite — Design Principles

## Core Ethos: Brutal Minimalism

Ask "why" at every step. Every byte, every dependency, every feature must justify its existence. The point is to be the leanest possible weather delivery.

## The JS Rule

**Core features MUST work without JavaScript.** The app must be fully usable via curl, wget, a text browser, or with JS disabled.

**Optional convenience features MAY use JavaScript** — but only as progressive enhancement. JS adds convenience on top of a working baseline; it never replaces a core feature.

### What this means in practice

- The weather data, rendering, and all modes work with zero JS
- JS is allowed for convenience: "use my location" button, auto-refresh, etc.
- JS never fetches weather data directly — it redirects or fills form fields
- JS never renders HTML — the server always returns complete pages
- Features without JS degrade gracefully (button simply doesn't appear)

## Tests for "should this exist?"

1. Does it work without JS? → If not, it's not a core feature.
2. Does the JS version do MORE than redirect/fill fields? → Too much.
3. Does it break curl/wget/text mode? → It doesn't belong in core.
4. Can it be done server-side? → Do it server-side.
5. Would a user on 2G with a feature phone benefit? → If not, reconsider.

## What we deliberately chose NOT to do

- No client-side framework, library, or runtime
- No external fonts, icons, images, or CDN resources
- No analytics, tracking, or cookies
- No service workers or offline mode
- No push notifications
- No JS that fetches weather or renders HTML

## Location Input — The Right Flow

### No JS (core): City/postal code search

1. User visits `/` → sees a search form
2. User types "Munich" → form submits to `/weather?city=Munich`
3. Server calls Open-Meteo Geocoding → gets lat/lon → fetches weather → returns page
4. Works in curl: `curl weather.ari.hue.bz/weather?city=Munich`
5. Bookmarkable: `/weather?city=Munich` or `/weather?lat=48.14&lon=11.58`

### With JS (opt-in convenience): "Use my location" button

1. JS detects `<button id="geolocate">` exists → shows it (hidden by default via `<noscript>`)
2. User clicks → `navigator.geolocation.getCurrentPosition()` fires
3. On success → redirects to `/weather?lat=X&lon=Y`
4. On failure/error → silently does nothing (form still works)
5. Total JS: ~15 lines. No framework. No library. No fetch. Just a redirect.

### Why this is the right design

- The JS doesn't duplicate server logic — it just provides coordinates
- The server always does the real work (geocoding, weather, rendering)
- The JS is a thin convenience layer, not a parallel architecture
- curl users get the same app as browser users
- The "use my location" button is invisible without JS — no broken buttons

### Open-Meteo Geocoding API (FREE, no key)

- Endpoint: `https://geocoding-api.open-meteo.com/v1/search?name=Munich`
- Returns: lat/lon, timezone, country, admin areas, population
- Supports: city names, postal codes, fuzzy matching (3+ chars)
- Server-side only, adds ~100ms to the request
- Cache geocoding results too (cities don't move)

## Future Considerations (only if justified)

- City name in path: `/weather/Munich` (cleaner URLs)
- Recent locations via URL history (no storage needed)
- Multiple result disambiguation page for ambiguous city names
