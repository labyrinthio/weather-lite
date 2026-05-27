# weather-lite

Low-bandwidth weather app. SSR only, zero client JavaScript.

- Astro SSR with `@astrojs/node`
- Open-Meteo API (free, no API key)
- Three response modes: normal, min, text
- Server-side cache with 10-minute TTL
- Payload size and timing metrics in response headers

## Payload Budget

| Mode | Content-Type | Target | CSS | JS |
|------|-------------|--------|-----|-----|
| normal | text/html | <5 KB | tiny inline | zero |
| min | text/plain | <1 KB | zero | zero |
| text | text/plain | <3 KB | zero | zero |

## Routes

```
/                           Landing page
/weather?lat=&lon=          Normal mode (CSS, ASCII art, metrics)
/weather/min?lat=&lon=      Minimum mode (smallest useful response)
/weather/text?lat=&lon=     Plain text mode
```

Coordinates are decimal degrees. `lat` ranges -90 to 90, `lon` ranges -180 to 180.

Example: `/weather?lat=48.14&lon=11.58` (Munich)

## Response Headers

All weather endpoints include:

- `X-Payload-Size` — response body size in bytes
- `X-Cache-Status` — `hit` or `miss`
- `X-Render-Time` — total server-side time
- `Cache-Control` — `public, max-age=300`

## Development

```bash
npm install
npm run dev          # dev server at localhost:4321
npm test             # run tests
npm run build        # production build
npm run preview      # preview production build
```

## Docker Deployment

```bash
docker compose up -d
```

The container exposes port 4321. For production, put it behind a reverse proxy.

### Behind Caddy

```
weather.yourdomain.com {
    reverse_proxy localhost:4321
}
```

### Behind nginx

```nginx
server {
    listen 80;
    server_name weather.yourdomain.com;

    location / {
        proxy_pass http://localhost:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Architecture

```
src/
├── lib/
│   ├── open-meteo.ts    API wrapper (build URL, parse response)
│   ├── cache.ts         Server-side TTL cache
│   ├── formatter.ts     Weather → human text (min, text, normal HTML)
│   ├── metrics.ts       Timing helpers
│   └── routes.ts        Shared route logic (coords parsing, cached fetch)
├── pages/
│   ├── index.astro      Landing page
│   └── weather/
│       ├── index.astro  Normal mode
│       ├── min.astro    Minimum mode
│       └── text.astro   Plain text mode
tests/
├── formatter.test.ts    Formatter unit tests
├── open-meteo.test.ts   API parsing tests
└── cache.test.ts        Cache tests
```

## No Accounts, No Tracking

No cookies, no local storage, no browser geolocation, no analytics, no external resources.
Bookmarkable URLs with lat/lon. That's it.

## License

MIT
