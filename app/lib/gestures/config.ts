// Central tuning surface for the gesture engine (PLAN.md §5.2).
// All geometry thresholds are unitless (normalized by palm size) or degrees —
// never raw pixels — so behavior is invariant to resolution, hand size, and
// camera distance. Tune here, never in classifier code.

export const GESTURE_CONFIG = {
  /** Majority-vote smoothing window (frames) and votes needed to switch. */
  voteWindowSize: 5,
  votesNeeded: 4,

  /** Transition-action cooldowns: fire once per stable-entry, then cool down. */
  actionDebounceMs: {
    victory: 800,
    open_palm: 1500,
  },

  /** Minimum confidence for a classification to become the stable gesture. */
  minConfidence: 0.5,

  /** Finger joint-angle (deg at PIP, 180 = straight) + reach (tip–MCP / palm). */
  finger: {
    extendedDeg: 150,
    curledDeg: 125,
    extendedReach: 0.55,
    curledReach: 0.42,
  },

  /** Thumb: straightness at IP joint + spread from middle knuckle. */
  thumb: {
    extendedDeg: 135,
    extendedReach: 0.55,
  },

  /** Screen-vertical thumb margin (thumb-tip vs knuckle, / palm) for up/down. */
  direction: 0.3,

  /** Index–middle tip spread (/ palm) required for victory. */
  victorySpread: 0.3,

  /** Index–pinky tip spread (/ palm) required for open palm. */
  palmSpread: 0.8,

  /** Velocity scroll tuning: fast attack, slow release glides over vote gaps. */
  scroll: {
    maxSpeedPxS: 1000,
    attackPerS: 8,
    releasePerS: 1.5,
  },
  /** Push/pull slider: relative palm-size tracking while a palm is stable. */
  distance: {
    emaAlpha: 0.3,
    gain: 100,
    deadband: 0.005,
  },

  /** Max inferences per second (pipeline guard). */
  maxInferenceFps: 25,
} as const;

/** Sensitivity presets: vote strictness + confidence gate. Applied live, no reload. */
export const SENSITIVITY_PRESETS = {
  relaxed: { votesNeeded: 3, minConfidence: 0.4 },
  standard: { votesNeeded: 4, minConfidence: 0.5 },
  strict: { votesNeeded: 5, minConfidence: 0.65 },
} as const;

export type Sensitivity = keyof typeof SENSITIVITY_PRESETS;
