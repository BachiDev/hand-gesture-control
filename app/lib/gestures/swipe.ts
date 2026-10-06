// Palm-centroid swipe tracker: while an open palm is held (not the hold that
// stops the camera — movement cancels holds anyway), a fast horizontal
// displacement becomes a swipe event for tab navigation.
// Pure + unit-tested; DemoApp feeds it the machine's stable gesture.

export type SwipeDirection = 'left' | 'right';

export interface SwipeTracker {
  trail: { x: number; y: number; t: number }[];
  cooldownUntil: number;
}

const MIN_DISPLACEMENT_PALMS = 0.6; // centroid travel, in palm sizes
const MAX_SWIPE_MS = 400;
const COOLDOWN_MS = 800;

export function createSwipeTracker(): SwipeTracker {
  return { trail: [], cooldownUntil: 0 };
}

/**
 * @param stable current machine-stable gesture (only open_palm is tracked)
 * @param centroid palm centroid in video pixels (unmirrored camera space)
 * @param palmPx palm size in the same pixels
 * @param mirrored whether the preview is mirrored (flips screen direction)
 */
export function pushSwipePosition(
  tracker: SwipeTracker,
  stable: string,
  centroid: { x: number; y: number } | null,
  palmPx: number,
  mirrored: boolean,
  nowMs: number
): SwipeDirection | null {
  if (stable !== 'open_palm' || !centroid || palmPx <= 0) {
    tracker.trail = [];
    return null;
  }
  tracker.trail.push({ x: centroid.x, y: centroid.y, t: nowMs });
  // Keep only the recent window.
  while (tracker.trail.length > 0 && nowMs - tracker.trail[0].t > MAX_SWIPE_MS) {
    tracker.trail.shift();
  }
  if (nowMs < tracker.cooldownUntil || tracker.trail.length < 2) return null;

  const first = tracker.trail[0];
  const last = tracker.trail[tracker.trail.length - 1];
  const dx = (last.x - first.x) / palmPx;
  const dy = (last.y - first.y) / palmPx;
  if (Math.abs(dx) >= MIN_DISPLACEMENT_PALMS && Math.abs(dy) < Math.abs(dx) * 0.6) {
    tracker.cooldownUntil = nowMs + COOLDOWN_MS;
    tracker.trail = [];
    const cameraLeft = dx < 0;
    // Mirrored selfie preview flips left/right on screen.
    if (mirrored) return cameraLeft ? 'right' : 'left';
    return cameraLeft ? 'left' : 'right';
  }
  return null;
}
