import { describe, it, expect } from 'vitest';
import { createSwipeTracker, pushSwipePosition } from '../app/lib/gestures/swipe';

const P = (x: number, y: number) => ({ x, y });

describe('swipe tracker', () => {
  it('fires on a fast horizontal palm motion', () => {
    const t = createSwipeTracker();
    const dirs = [];
    // 100 px travel at palm 100 px = 1.0 palm sizes over 200 ms.
    for (let i = 0; i <= 4; i++) {
      dirs.push(pushSwipePosition(t, 'open_palm', P(i * 25, 0), 100, false, i * 50));
    }
    expect(dirs).toContain('right');
  });

  it('mirrors direction for the selfie preview', () => {
    const t = createSwipeTracker();
    const dirs = [];
    for (let i = 0; i <= 4; i++) {
      dirs.push(pushSwipePosition(t, 'open_palm', P(i * 25, 0), 100, true, i * 50));
    }
    expect(dirs).toContain('left');
  });

  it('ignores slow drift, vertical motion, and other gestures', () => {
    const slow = createSwipeTracker();
    let dir = null;
    for (let i = 0; i <= 8; i++) {
      dir = pushSwipePosition(slow, 'open_palm', P(i * 5, 0), 100, false, i * 50);
    }
    expect(dir).toBeNull();

    const vertical = createSwipeTracker();
    for (let i = 0; i <= 4; i++) {
      dir = pushSwipePosition(vertical, 'open_palm', P(0, i * 25), 100, false, i * 50);
    }
    expect(dir).toBeNull();

    const other = createSwipeTracker();
    for (let i = 0; i <= 4; i++) {
      dir = pushSwipePosition(other, 'victory', P(i * 25, 0), 100, false, i * 50);
    }
    expect(dir).toBeNull();
  });

  it('cools down after firing', () => {
    const t = createSwipeTracker();
    for (let i = 0; i <= 4; i++)
      pushSwipePosition(t, 'open_palm', P(i * 25, 0), 100, false, i * 50);
    // Still moving right, but inside cooldown: silent.
    const dir = pushSwipePosition(t, 'open_palm', P(150, 0), 100, false, 260);
    expect(dir).toBeNull();
  });
});
