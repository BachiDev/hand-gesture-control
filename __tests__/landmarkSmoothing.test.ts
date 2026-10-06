import { describe, it, expect } from 'vitest';
import { smoothLandmarks } from '../app/lib/gestures/landmarkSmoothing';
import { P } from './fixtures/hands';

describe('landmark smoothing', () => {
  it('halves single-frame jitter with alpha 0.5', () => {
    const prev = [P(100, 100)];
    const out = smoothLandmarks(prev, [P(110, 90)], 0.5);
    expect(out[0].x).toBe(105);
    expect(out[0].y).toBe(95);
  });

  it('passes the first frame through untouched (no ghost)', () => {
    const out = smoothLandmarks(null, [P(10, 20)]);
    expect(out[0]).toEqual({ x: 10, y: 20 });
  });

  it('resets on length mismatch (tracking restart)', () => {
    const out = smoothLandmarks([P(0, 0)], [P(10, 20), P(30, 40)]);
    expect(out).toHaveLength(2);
    expect(out[0].x).toBe(10);
  });

  it('keeps landmark names for downstream mapping', () => {
    const out = smoothLandmarks([{ x: 0, y: 0, name: 'wrist' }], [{ x: 10, y: 10, name: 'wrist' }]);
    expect(out[0].name).toBe('wrist');
  });
});
