// Single-frame hand classifiers. Pure functions of 21 landmarks →
// { gesture, confidence, details }. No temporal logic here (see smoothing.ts).
//
// Priority order matters: the first matching rule wins, so the silent
// middle-finger shape can never steal a real gesture.

import { GESTURE_CONFIG } from './config';
import { dist, fingerState, thumbState, palmSize, type FingerState } from './fingerState';
import type { GestureType, Keypoint } from '../../utils/gestureLogic';

export interface HandAnalysis {
  gesture: GestureType;
  /** 0.5 (at threshold) → 1 (decisive). Below minConfidence the caller maps to 'none'. */
  confidence: number;
  fingers: { index: FingerState; middle: FingerState; ring: FingerState; pinky: FingerState };
  /** Palm centroid in input pixels + palm size (for motion features like swipe). */
  centroid: { x: number; y: number };
  palmPx: number;
  /** Raw normalized margins, for the Lab inspector (thresholds in config). */
  metrics: HandMetrics;
  /** True when input landmarks were non-finite (driver/model glitch frame). */
  invalid?: boolean;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Confidence from criterion margins: 0.5 exactly at threshold, →1 when decisive. */
const conf = (margins: number[]): number => 0.5 + 0.5 * clamp01(Math.min(...margins));

export interface HandMetrics {
  /** Thumb–index tip gap (diagnostic; no rule bound). */
  gap: number;
  /** Index–middle tip spread (victory > victorySpread). */
  spreadVM: number;
  /** Index–pinky tip spread (palm > palmSpread). */
  spreadIP: number;
  /** Screen-vertical thumb margins (thumbs > direction). */
  upMargin: number;
  downMargin: number;
  /** Tip–wrist distances: fingertips pointing OUT (high) vs folded IN (low). */
  indexTipWrist: number;
  middleTipWrist: number;
}

const ZERO_METRICS: HandMetrics = {
  gap: 0,
  spreadVM: 0,
  spreadIP: 0,
  upMargin: 0,
  downMargin: 0,
  indexTipWrist: 0,
  middleTipWrist: 0,
};

/** All normalized inter-landmark measures in one place (rules + Lab read from here). */
export function handMetrics(kp: Keypoint[], palm: number): HandMetrics {
  return {
    gap: dist(kp[4], kp[8]) / palm,
    spreadVM: dist(kp[8], kp[12]) / palm,
    spreadIP: dist(kp[8], kp[20]) / palm,
    upMargin: (kp[5].y - kp[4].y) / palm,
    downMargin: (kp[4].y - kp[17].y) / palm,
    indexTipWrist: dist(kp[8], kp[0]) / palm,
    middleTipWrist: dist(kp[12], kp[0]) / palm,
  };
}

type PoseResult = Omit<HandAnalysis, 'centroid' | 'palmPx' | 'metrics'>;

export function classifyHand(keypoints: Keypoint[]): HandAnalysis {
  const r = classify(keypoints);
  if (r.palmPx === 0) return { ...r, centroid: { x: 0, y: 0 }, palmPx: 0, metrics: ZERO_METRICS };
  const palmPts = [keypoints[0], keypoints[5], keypoints[9], keypoints[13], keypoints[17]];
  return {
    ...r,
    centroid: {
      x: palmPts.reduce((s, p) => s + p.x, 0) / palmPts.length,
      y: palmPts.reduce((s, p) => s + p.y, 0) / palmPts.length,
    },
    palmPx: r.palmPx,
    metrics: handMetrics(keypoints, r.palmPx),
  };
}

function classify(keypoints: Keypoint[]): PoseResult & { palmPx: number } {
  const half = (label: FingerState['label']): FingerState => ({ label, angleDeg: 0, reach: 0 });
  const blank = (): PoseResult & { palmPx: number } => ({
    gesture: 'none',
    confidence: 0,
    fingers: { index: half('half'), middle: half('half'), ring: half('half'), pinky: half('half') },
    palmPx: 0,
  });
  const none = (fingers: HandAnalysis['fingers']): PoseResult & { palmPx: number } => ({
    gesture: 'none',
    confidence: 0,
    fingers,
    palmPx: 0,
  });

  if (!keypoints || keypoints.length < 21) {
    return blank();
  }

  // Non-finite landmarks (NaN/undefined from a glitch frame) must never reach
  // the angle math — NaN poisons every downstream value (Lab, confidence).
  if (!keypoints.every((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))) {
    return { ...blank(), invalid: true };
  }

  const palm = palmSize(keypoints);
  if (palm === 0) {
    return blank();
  }

  const F = GESTURE_CONFIG.finger;
  const index = fingerState(keypoints[5], keypoints[6], keypoints[8], palm);
  const middle = fingerState(keypoints[9], keypoints[10], keypoints[12], palm);
  const ring = fingerState(keypoints[13], keypoints[14], keypoints[16], palm);
  const pinky = fingerState(keypoints[17], keypoints[18], keypoints[20], palm);
  const fingers = { index, middle, ring, pinky };
  const thumb = thumbState(
    keypoints[1],
    keypoints[2],
    keypoints[3],
    keypoints[4],
    keypoints[9],
    palm
  );

  const m = handMetrics(keypoints, palm);

  const ext = (s: FingerState) => s.label === 'extended';
  const curled = (s: FingerState) => s.label === 'curled';

  // --- Middle finger (unlisted easter egg; silent, action TBD) ---
  if (ext(middle) && curled(index) && curled(ring) && curled(pinky)) {
    return {
      gesture: 'middle_finger',
      confidence: conf([
        (middle.angleDeg - F.extendedDeg) / 30,
        (middle.reach - F.extendedReach) / 0.2,
        (F.curledDeg - index.angleDeg) / 30,
      ]),
      fingers,
      palmPx: palm,
    };
  }

  // --- Victory ---
  if (
    ext(index) &&
    ext(middle) &&
    curled(ring) &&
    curled(pinky) &&
    m.spreadVM > GESTURE_CONFIG.victorySpread
  ) {
    return {
      gesture: 'victory',
      confidence: conf([
        (m.spreadVM - GESTURE_CONFIG.victorySpread) / 0.3,
        (index.angleDeg - F.extendedDeg) / 30,
        (middle.angleDeg - F.extendedDeg) / 30,
      ]),
      fingers,
      palmPx: palm,
    };
  }

  // --- Open palm ---
  if (
    ext(index) &&
    ext(middle) &&
    ext(ring) &&
    ext(pinky) &&
    thumb.extended &&
    m.spreadIP > GESTURE_CONFIG.palmSpread
  ) {
    return {
      gesture: 'open_palm',
      confidence: conf([
        (m.spreadIP - GESTURE_CONFIG.palmSpread) / 0.3,
        (thumb.angleDeg - GESTURE_CONFIG.thumb.extendedDeg) / 30,
      ]),
      fingers,
      palmPx: palm,
    };
  }

  const fourCurled = curled(index) && curled(middle) && curled(ring) && curled(pinky);

  // --- Thumbs up / down (screen-relative, symmetric — no inversion hacks) ---
  if (fourCurled && thumb.extended) {
    if (m.upMargin > GESTURE_CONFIG.direction) {
      return {
        gesture: 'thumbs_up',
        confidence: conf([
          (m.upMargin - GESTURE_CONFIG.direction) / 0.3,
          (thumb.angleDeg - GESTURE_CONFIG.thumb.extendedDeg) / 30,
        ]),
        fingers,
        palmPx: palm,
      };
    }
    if (m.downMargin > GESTURE_CONFIG.direction) {
      return {
        gesture: 'thumbs_down',
        confidence: conf([
          (m.downMargin - GESTURE_CONFIG.direction) / 0.3,
          (thumb.angleDeg - GESTURE_CONFIG.thumb.extendedDeg) / 30,
        ]),
        fingers,
        palmPx: palm,
      };
    }
  }

  // NOTE: a tucked-thumb fist intentionally matches nothing — natural resting
  // fists must never fire actions. It falls through to 'none' below.

  return none(fingers);
}
