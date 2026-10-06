// Temporal gesture machine: turns jittery per-frame classifications into
// committed actions. Pure (no React) so it is fully unit-testable.
//
// - Majority vote over a sliding window: a gesture becomes stable only with
//   `votesNeeded` of the last `voteWindowSize` frames (single-frame blips
//   never fire). Keeping the previous stable on splits is the hysteresis.
// - Transition actions: entering a configured gesture (victory toggle, palm
//   hello) fires once per stable-entry, then cools down. No holds, no
//   destructive gesture actions — those belong to explicit UI.

import { GESTURE_CONFIG } from './config';
import type { GestureType } from '../../utils/gestureLogic';

export interface RawReading {
  gesture: GestureType;
  confidence: number;
  /** Palm centroid in video pixels + palm size; enables motion features (swipe). */
  centroid?: { x: number; y: number };
  palmPx?: number;
}

export interface MachineEvents {
  /** Gesture whose transition action fired on this push (null = none). */
  entered: GestureType | null;
}

export interface MachineSnapshot {
  stable: GestureType;
  confidence: number;
  /** Current vote-window histogram (for the Lab inspector). */
  windowCounts: Partial<Record<GestureType, number>>;
}

export interface MachineTuning {
  votesNeeded: number;
  minConfidence: number;
}

export interface Machine extends MachineSnapshot {
  window: GestureType[];
  lastActionAt: Partial<Record<GestureType, number>>;
  tuning: MachineTuning;
}

export function createMachine(tuning?: Partial<MachineTuning>): Machine {
  const m: Machine = {
    window: [],
    stable: 'none',
    confidence: 0,
    lastActionAt: {},
    tuning: {
      votesNeeded: tuning?.votesNeeded ?? GESTURE_CONFIG.votesNeeded,
      minConfidence: tuning?.minConfidence ?? GESTURE_CONFIG.minConfidence,
    },
    windowCounts: {},
  };
  return m;
}

/** Sensitivity presets (relaxed/standard/strict). Applied live, no reload. */
export function setTuning(m: Machine, tuning: Partial<MachineTuning>): void {
  if (tuning.votesNeeded !== undefined) m.tuning.votesNeeded = tuning.votesNeeded;
  if (tuning.minConfidence !== undefined) m.tuning.minConfidence = tuning.minConfidence;
}

/** Re-initializes a machine in place (used by the React hook's reset). Keeps tuning. */
export function resetMachine(m: Machine): void {
  m.window = [];
  m.stable = 'none';
  m.confidence = 0;
  m.lastActionAt = {};
  m.windowCounts = {};
}

function mode(window: GestureType[]): { gesture: GestureType; votes: number } {
  const counts = new Map<GestureType, number>();
  for (const g of window) counts.set(g, (counts.get(g) ?? 0) + 1);
  let best: GestureType = window[window.length - 1] ?? 'none';
  let votes = 0;
  for (const [g, n] of counts) {
    if (n > votes) {
      best = g;
      votes = n;
    }
  }
  return { gesture: best, votes };
}

export function pushReading(m: Machine, reading: RawReading, nowMs: number): MachineEvents {
  const events: MachineEvents = { entered: null };

  // Sensitivity gate: low-confidence frames vote 'none' instead of firing.
  const vote: GestureType =
    reading.gesture !== 'none' && reading.confidence < m.tuning.minConfidence
      ? 'none'
      : reading.gesture;
  m.window.push(vote);
  if (m.window.length > GESTURE_CONFIG.voteWindowSize) m.window.shift();
  m.windowCounts = {};
  for (const g of m.window) m.windowCounts[g] = (m.windowCounts[g] ?? 0) + 1;

  // --- Stable switch (majority vote = hysteresis against flicker) ---
  const { gesture: candidate, votes } = mode(m.window);
  if (candidate !== m.stable && votes >= m.tuning.votesNeeded) {
    m.stable = candidate;
    m.confidence = reading.confidence;

    const cooldown =
      GESTURE_CONFIG.actionDebounceMs[candidate as keyof typeof GESTURE_CONFIG.actionDebounceMs];
    if (cooldown !== undefined) {
      const last = m.lastActionAt[candidate] ?? Number.NEGATIVE_INFINITY;
      if (nowMs - last >= cooldown) {
        m.lastActionAt[candidate] = nowMs;
        events.entered = candidate;
      }
    }
  } else if (candidate === m.stable) {
    m.confidence = reading.confidence;
  }

  return events;
}

export function snapshot(m: Machine): MachineSnapshot {
  return {
    stable: m.stable,
    confidence: m.confidence,
    windowCounts: { ...m.windowCounts },
  };
}
