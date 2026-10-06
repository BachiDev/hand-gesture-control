// Push/pull: relative palm-size tracking. While an open palm is stable,
// frame-to-frame fractional changes in (smoothed) palm size drive a value:
// move closer → up, farther → down. Relative (not absolute) means zero
// calibration across cameras, distances, and hand sizes. Pure + tested.

export interface PushPullState {
  ema: number | null;
}

export function createPushPull(): PushPullState {
  return { ema: null };
}

/**
 * @returns display delta for this frame (0 when deadbanded or re-arming).
 * Caller clamps/accumulates into its own range.
 */
export function pushPullDelta(
  state: PushPullState,
  palmPx: number,
  alpha: number,
  gain: number,
  deadband: number
): number {
  if (!(palmPx > 0)) {
    state.ema = null;
    return 0;
  }
  const prev = state.ema;
  if (prev == null) {
    state.ema = palmPx; // re-arm: no jump on entry
    return 0;
  }
  const ema = prev + alpha * (palmPx - prev);
  state.ema = ema;
  const frac = (ema - prev) / prev;
  if (Math.abs(frac) < deadband) return 0;
  return gain * frac;
}

/** Re-arm on palm exit (call when stable leaves open_palm). */
export function resetPushPull(state: PushPullState): void {
  state.ema = null;
}
