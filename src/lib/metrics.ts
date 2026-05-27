// Response timing metrics

export interface Metrics {
  totalMs: number;
  weatherApiMs: number;
  cacheHit: boolean;
  payloadBytes: number;
  renderMs: number;
}

export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

export function formatMetrics(m: Metrics): string {
  const parts = [
    `total=${m.totalMs}ms`,
    `api=${m.weatherApiMs}ms`,
    `render=${m.renderMs}ms`,
    `payload=${m.payloadBytes}B`,
    m.cacheHit ? 'cache=hit' : 'cache=miss',
  ];
  return parts.join(' | ');
}
