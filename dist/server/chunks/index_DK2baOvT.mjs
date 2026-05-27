import { c as createComponent } from './astro-component_DOxZYdq8.mjs';
import 'piccolore';
import { l as renderTemplate } from './server_ijRtOX4V.mjs';
import 'clsx';
import { s as startTimer, p as parseCoords, g as getWeather, a as formatNormal } from './metrics_CediK8nT.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const totalTimer = startTimer();
  const url = new URL(Astro2.request.url);
  const { lat, lon, error } = parseCoords(url);
  if (error) {
    return new Response(`<!DOCTYPE html><html><body><pre>Error: ${error}

Usage: /weather?lat=48.14&lon=11.58</pre></body></html>`, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  try {
    const weatherTimer = startTimer();
    const { data, cacheHit } = await getWeather(lat, lon);
    const weatherApiMs = data.apiLatencyMs;
    const renderTimer = startTimer();
    const html = formatNormal(data, { totalMs: 0, weatherApiMs, cacheHit, renderMs: 0 });
    const renderMs = renderTimer();
    const totalMs = totalTimer();
    const finalHtml = formatNormal(data, { totalMs, weatherApiMs, cacheHit, renderMs });
    const payloadBytes = new TextEncoder().encode(finalHtml).length;
    return new Response(finalHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Payload-Size": payloadBytes.toString(),
        "X-Cache-Status": cacheHit ? "hit" : "miss",
        "X-Render-Time": `${totalMs}ms`,
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (err) {
    return new Response(`<!DOCTYPE html><html><body><pre>Weather service unavailable: ${err.message}</pre></body></html>`, {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  return renderTemplate``;
}, "/home/kenny/src/weather-lite/src/pages/weather/index.astro", void 0);

const $$file = "/home/kenny/src/weather-lite/src/pages/weather/index.astro";
const $$url = "/weather";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
