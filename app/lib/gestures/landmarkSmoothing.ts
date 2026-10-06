// Landmark-level smoothing: exponential moving average over the 21 points,
// applied BEFORE drawing + classification so every downstream consumer
// (skeleton, angles, margins, slider values) sees steadier input.
// Critical on weak hardware, where per-frame model jitter is large.
// Lag cost ≈ 1 frame at the smoothing factor; reset whenever tracking
// restarts (no hand, camera restart) to avoid ghost blending.

import type { Keypoint } from '../../utils/gestureLogic';

export const LANDMARK_SMOOTHING_ALPHA = 0.5;

export function smoothLandmarks(
  prev: Keypoint[] | null,
  curr: Keypoint[],
  alpha: number = LANDMARK_SMOOTHING_ALPHA
): Keypoint[] {
  if (!prev || prev.length !== curr.length) return curr.map((p) => ({ ...p }));
  const beta = 1 - alpha;
  return curr.map((p, i) => ({
    x: alpha * p.x + beta * prev[i].x,
    y: alpha * p.y + beta * prev[i].y,
    z:
      p.z !== undefined && prev[i].z !== undefined
        ? alpha * p.z + beta * (prev[i].z as number)
        : p.z,
    name: p.name,
  }));
}
