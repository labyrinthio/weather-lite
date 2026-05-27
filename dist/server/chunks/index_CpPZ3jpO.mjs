import { c as createComponent } from './astro-component_DOxZYdq8.mjs';
import 'piccolore';
import { r as renderHead, l as renderTemplate } from './server_ijRtOX4V.mjs';
import 'clsx';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en" data-astro-cid-j7pv25f6> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>weather-lite</title>${renderHead()}</head> <body data-astro-cid-j7pv25f6> <h1 data-astro-cid-j7pv25f6>weather-lite</h1> <p data-astro-cid-j7pv25f6>Low-bandwidth weather. Zero client JS. SSR only.</p> <h2 style="margin-top:1rem;font-size:1rem" data-astro-cid-j7pv25f6>Usage</h2> <p data-astro-cid-j7pv25f6>Provide <code data-astro-cid-j7pv25f6>lat</code> and <code data-astro-cid-j7pv25f6>lon</code> as query params.</p> <ul data-astro-cid-j7pv25f6> <li data-astro-cid-j7pv25f6><a href="/weather?lat=48.14&lon=11.58" data-astro-cid-j7pv25f6>/weather?lat=48.14&lon=11.58</a> — normal (&lt;5KB)</li> <li data-astro-cid-j7pv25f6><a href="/weather/min?lat=48.14&lon=11.58" data-astro-cid-j7pv25f6>/weather/min?lat=48.14&lon=11.58</a> — minimum (&lt;1KB)</li> <li data-astro-cid-j7pv25f6><a href="/weather/text?lat=48.14&lon=11.58" data-astro-cid-j7pv25f6>/weather/text?lat=48.14&lon=11.58</a> — plain text</li> </ul> <h2 style="margin-top:1rem;font-size:1rem" data-astro-cid-j7pv25f6>Modes</h2> <ul data-astro-cid-j7pv25f6> <li data-astro-cid-j7pv25f6><strong data-astro-cid-j7pv25f6>normal</strong> — tiny inline CSS, ASCII art, payload metrics</li> <li data-astro-cid-j7pv25f6><strong data-astro-cid-j7pv25f6>min</strong> — no CSS, no JS, smallest useful response</li> <li data-astro-cid-j7pv25f6><strong data-astro-cid-j7pv25f6>text</strong> — plain text, Content-Type: text/plain</li> </ul> <p class="meta" data-astro-cid-j7pv25f6>Data: <a href="https://open-meteo.com" data-astro-cid-j7pv25f6>Open-Meteo</a> (free, no API key) · Cache: 10min TTL · Zero tracking</p> </body></html>`;
}, "/home/kenny/src/weather-lite/src/pages/index.astro", void 0);

const $$file = "/home/kenny/src/weather-lite/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
