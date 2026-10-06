import { describe, it, expect } from 'vitest';
import { createPushPull, pushPullDelta, resetPushPull } from '../app/lib/gestures/distance';

describe('push/pull tracking', () => {
  it('re-arms without jumping on entry', () => {
    const s = createPushPull();
    expect(pushPullDelta(s, 100, 0.3, 100, 0.005)).toBe(0);
  });

  it('drives positive when approaching, negative when retreating', () => {
    const s = createPushPull();
    pushPullDelta(s, 100, 0.3, 100, 0.005);
    expect(pushPullDelta(s, 120, 0.3, 100, 0.005)).toBeGreaterThan(0);
    expect(pushPullDelta(s, 80, 0.3, 100, 0.005)).toBeLessThan(0);
  });

  it('deadband absorbs jitter', () => {
    const s = createPushPull();
    pushPullDelta(s, 100, 0.3, 100, 0.005);
    expect(pushPullDelta(s, 100.2, 0.3, 100, 0.005)).toBe(0);
  });

  it('resets on invalid frames and manual reset', () => {
    const s = createPushPull();
    pushPullDelta(s, 100, 0.3, 100, 0.005);
    expect(pushPullDelta(s, 0, 0.3, 100, 0.005)).toBe(0);
    expect(pushPullDelta(s, 120, 0.3, 100, 0.005)).toBe(0); // re-armed
    resetPushPull(s);
    expect(pushPullDelta(s, 200, 0.3, 100, 0.005)).toBe(0);
  });
});
