// Tests for metrics module
import { describe, it, expect } from 'vitest';
import { startTimer, formatMetrics } from '../src/lib/metrics';
import type { Metrics } from '../src/lib/metrics';

describe('startTimer', () => {
  it('returns a function', () => {
    const timer = startTimer();
    expect(typeof timer).toBe('function');
  });
  it('returns elapsed ms when called', async () => {
    const timer = startTimer();
    await new Promise(r => setTimeout(r, 50));
    const elapsed = timer();
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(200);
  });
});

describe('formatMetrics', () => {
  it('formats all fields', () => {
    const m: Metrics = {
      totalMs: 200,
      weatherApiMs: 150,
      cacheHit: true,
      payloadBytes: 1234,
      renderMs: 10,
    };
    const out = formatMetrics(m);
    expect(out).toContain('total=200ms');
    expect(out).toContain('api=150ms');
    expect(out).toContain('render=10ms');
    expect(out).toContain('payload=1234B');
    expect(out).toContain('cache=hit');
  });
  it('shows cache=miss when not hit', () => {
    const m: Metrics = {
      totalMs: 100,
      weatherApiMs: 80,
      cacheHit: false,
      payloadBytes: 500,
      renderMs: 5,
    };
    expect(formatMetrics(m)).toContain('cache=miss');
  });
});
