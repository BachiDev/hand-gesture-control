// Synthetic 21-landmark poses for the classifier suite.
// Coordinates are hand-placed to be anatomically plausible (straight fingers
// are collinear, curled fingers genuinely fold). All poses use the canonical
// upright right hand as a base; transforms (mirror/scale/translate/flip)
// prove normalization invariance — the core Phase 2 claim.

import type { Keypoint } from '../../app/utils/gestureLogic';

export const P = (x: number, y: number): Keypoint => ({ x, y });

type Pose = Record<number, Keypoint>;

function build(base: Pose, overrides: Pose = {}): Keypoint[] {
  const kp: Keypoint[] = Array.from({ length: 21 }, () => P(100, 100));
  for (const [k, v] of Object.entries({ ...base, ...overrides })) kp[Number(k)] = v;
  return kp;
}

/** Canonical open hand, upright, palm facing camera. palmSize ≈ 84. */
const OPEN: Pose = {
  0: P(100, 200),
  1: P(72, 172),
  2: P(60, 150),
  3: P(52, 124),
  4: P(46, 84), // thumb extended, clearly above index knuckle
  5: P(84, 120),
  6: P(79, 92),
  7: P(77, 68),
  8: P(76, 46), // index extended
  9: P(104, 116),
  10: P(104, 86),
  11: P(104, 60),
  12: P(104, 36), // middle extended
  13: P(124, 120),
  14: P(126, 92),
  15: P(127, 70),
  16: P(128, 50), // ring extended
  17: P(142, 128),
  18: P(146, 104),
  19: P(149, 84),
  20: P(151, 66), // pinky extended
};

/** Genuinely folded fingers (tips pulled toward the palm). */
const CURLED_FINGERS: Pose = {
  5: P(84, 120),
  6: P(88, 146),
  7: P(86, 166),
  8: P(72, 150), // index curled
  9: P(104, 116),
  10: P(108, 144),
  11: P(108, 166),
  12: P(94, 150), // middle curled
  13: P(124, 120),
  14: P(128, 146),
  15: P(130, 166),
  16: P(116, 150), // ring curled
  17: P(142, 128),
  18: P(148, 150),
  19: P(150, 168),
  20: P(136, 154), // pinky curled
};

/** Thumb tucked across the palm (fist). */
const TUCKED_THUMB: Pose = {
  1: P(72, 172),
  2: P(80, 165),
  3: P(88, 158),
  4: P(95, 150),
};

/** Thumb extended downward past the fist (thumbs-down). */
const DOWN_THUMB: Pose = {
  1: P(70, 165),
  2: P(95, 172),
  3: P(125, 174),
  4: P(160, 175),
};

export const poses = {
  openPalm: () => build(OPEN),
  thumbsUp: () => build(OPEN, { ...CURLED_FINGERS }),
  thumbsDown: () => build(OPEN, { ...CURLED_FINGERS, ...DOWN_THUMB }),
  fist: () => build(OPEN, { ...CURLED_FINGERS, ...TUCKED_THUMB }),
  victory: () =>
    build(OPEN, {
      13: P(124, 120),
      14: P(128, 146),
      15: P(130, 166),
      16: P(116, 150), // ring curled
      17: P(142, 128),
      18: P(148, 150),
      19: P(150, 168),
      20: P(136, 154), // pinky curled
    }),
  /** Index + middle together: no V spread → must reject. */
  victoryTogether: () =>
    build(OPEN, {
      9: P(104, 116),
      10: P(100, 88),
      11: P(96, 62),
      12: P(80, 40), // middle hugging the index
      13: P(124, 120),
      14: P(128, 146),
      15: P(130, 166),
      16: P(116, 150),
      17: P(142, 128),
      18: P(148, 150),
      19: P(150, 168),
      20: P(136, 154),
    }),
  middleFinger: () =>
    build(OPEN, {
      ...TUCKED_THUMB,
      5: P(84, 120),
      6: P(88, 146),
      7: P(86, 166),
      8: P(72, 150), // index curled
      13: P(124, 120),
      14: P(128, 146),
      15: P(130, 166),
      16: P(116, 150), // ring curled
      17: P(142, 128),
      18: P(148, 150),
      19: P(150, 168),
      20: P(136, 154), // pinky curled (middle stays extended)
    }),
  /** All fingers half-bent, thumb adducted → no rule matches. */
  flatHalf: () =>
    build(OPEN, {
      ...TUCKED_THUMB,
      5: P(84, 120),
      6: P(83, 100),
      7: P(82, 92),
      8: P(80, 82),
      9: P(104, 116),
      10: P(104, 98),
      11: P(104, 90),
      12: P(104, 80),
      13: P(124, 120),
      14: P(125, 102),
      15: P(126, 94),
      16: P(127, 86),
      17: P(142, 128),
      18: P(144, 112),
      19: P(145, 104),
      20: P(146, 96),
    }),
};

/** Mirror about x=100 (left hand): classification must not change. */
export const mirrorX = (kp: Keypoint[]): Keypoint[] => kp.map((p) => ({ ...p, x: 200 - p.x }));

/** Flip about y=130 (hand upside down): angles survive, screen-Y rules flip. */
export const flipY = (kp: Keypoint[]): Keypoint[] => kp.map((p) => ({ ...p, y: 260 - p.y }));

/** Scale about origin + translate: normalization must absorb it. */
export const scaleTranslate = (kp: Keypoint[], s: number, dx: number, dy: number): Keypoint[] =>
  kp.map((p) => ({ ...p, x: p.x * s + dx, y: p.y * s + dy }));
