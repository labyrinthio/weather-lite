import { c as createComponent } from './astro-component_DOxZYdq8.mjs';
import 'piccolore';
import { l as renderTemplate } from './server_ijRtOX4V.mjs';
import 'clsx';
import { s as startTimer, p as parseCoords, g as getWeather, b as formatText } from './metrics_CediK8nT.mjs';

const $$Text = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Text;
  const totalTimer = startTimer();
  const url = new URL(Astro2.request.url);
  const { lat, lon, error } = parseCoords(url);
  if (error) {
    return new Response(`Error: ${error}

Usage: /weather/text?lat=48.14&lon=11.58`, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  try {
    const { data, cacheHit } = await getWeather(lat, lon);
    const totalMs = totalTimer();
    const text = formatText(data);
    const payloadBytes = new TextEncoder().encode(text).length;
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Payload-Size": payloadBytes.toString(),
        "X-Cache-Status": cacheHit ? "hit" : "miss",
        "X-Render-Time": `${totalMs}ms`,
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (err) {
    return new Response(`Weather service unavailable: ${err.message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  return renderTemplate``;
}, "/home/kenny/src/weather-lite/src/pages/weather/text.astro", void 0);

const $$file = "/home/kenny/src/weather-lite/src/pages/weather/text.astro";
const $$url = "/weather/text";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Text,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
