// Rotation-invariant finger-state primitives.
// Angles (not screen-Y comparisons) decide extended vs. curled, so poses
// classify identically upright, inverted, mirrored, or scaled. All distances
// are normalized by palm size (wrist→middle-MCP), never raw pixels.

import { GESTURE_CONFIG } from './config';

export interface Vec {
  x: number;
  y: number;
}

export interface KeypointLike extends Vec {
  z?: number;
  name?: string;
}

export type FingerLabel = 'extended' | 'half' | 'curled';

export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Angle ABC (degrees, 0–180) with the vertex at B. 180 = straight line. */
export function angleDeg(a: Vec, vertex: Vec, c: Vec): number {
  const v1x = a.x - vertex.x;
  const v1y = a.y - vertex.y;
  const v2x = c.x - vertex.x;
  const v2y = c.y - vertex.y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Normalization unit: wrist (0) → middle knuckle (9). */
export const palmSize = (kp: KeypointLike[]): number => dist(kp[0], kp[9]);

export interface FingerState {
  label: FingerLabel;
  angleDeg: number;
  /** tip→MCP distance, normalized by palm size. */
  reach: number;
}

/**
 * Composite finger state: joint angle catches straight/bent, reach catches
 * folded-into-palm (where the PIP angle alone can read straight).
 */
export function fingerState(mcp: Vec, pip: Vec, tip: Vec, palm: number): FingerState {
  const { extendedDeg, curledDeg, extendedReach, curledReach } = GESTURE_CONFIG.finger;
  const angle = angleDeg(mcp, pip, tip);
  const reach = dist(tip, mcp) / palm;
  let label: FingerLabel = 'half';
  if (angle >= extendedDeg && reach >= extendedReach) label = 'extended';
  else if (angle <= curledDeg || reach <= curledReach) label = 'curled';
  return { label, angleDeg: angle, reach };
}

export interface ThumbState {
  extended: boolean;
  angleDeg: number;
  /** tip→middle-knuckle distance, normalized by palm size. */
  reach: number;
}

/** Thumb: straightness at the IP joint + spread away from the palm. */
export function thumbState(
  cmc: Vec,
  mcp: Vec,
  ip: Vec,
  tip: Vec,
  middleMcp: Vec,
  palm: number
): ThumbState {
  const { extendedDeg, extendedReach } = GESTURE_CONFIG.thumb;
  const angle = angleDeg(mcp, ip, tip);
  const reach = dist(tip, middleMcp) / palm;
  return { extended: angle >= extendedDeg && reach >= extendedReach, angleDeg: angle, reach };
}
