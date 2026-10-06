'use client';

import { useCallback, useRef, useState } from 'react';
import {
  createMachine,
  pushReading,
  resetMachine,
  setTuning,
  snapshot,
  type Machine,
  type MachineEvents,
  type MachineSnapshot,
  type MachineTuning,
  type RawReading,
} from '../lib/gestures/smoothing';

/**
 * React wrapper around the pure gesture machine. `push` is called once per
 * inference; the returned snapshot drives rendering (toast, hold overlay,
 * command-center highlight). Re-renders at inference rate (~25/s max).
 *
 * The machine instance itself lives in state (created once, never replaced)
 * so no refs are touched during render. `stableRef` mirrors the latest
 * stable gesture for rAF loops and callbacks.
 */
export function useGestureMachine() {
  const [machine] = useState(createMachine);
  const [snap, setSnap] = useState<MachineSnapshot>(() => snapshot(machine));
  const stableRef = useRef<MachineSnapshot['stable']>('none');
  // Sensitivity preset, written from effects and applied on the next push —
  // no setState in effects, so no cascading renders.
  const tuningRef = useRef<MachineTuning | null>(null);

  const push = useCallback(
    (reading: RawReading, nowMs: number): MachineEvents => {
      if (tuningRef.current) setTuning(machine, tuningRef.current);
      const events = pushReading(machine, reading, nowMs);
      const s = snapshot(machine);
      stableRef.current = s.stable;
      // Avoid no-op renders when nothing visible changed.
      setSnap((prev) =>
        prev.stable === s.stable &&
        JSON.stringify(prev.windowCounts) === JSON.stringify(s.windowCounts)
          ? prev
          : s
      );
      return events;
    },
    [machine]
  );

  const reset = useCallback(() => {
    resetMachine(machine);
    const s = snapshot(machine);
    stableRef.current = s.stable;
    setSnap(s);
  }, [machine]);

  /** Mutates the live machine (tuning) then republishes the snapshot. */
  const applyMachine = useCallback(
    (fn: (m: Machine) => void) => {
      fn(machine);
      setSnap(snapshot(machine));
    },
    [machine]
  );

  /** Stage a sensitivity preset; applied on the next push (effect-safe). */
  const setSensitivity = useCallback((tuning: MachineTuning) => {
    tuningRef.current = tuning;
  }, []);

  return { snapshot: snap, stableRef, push, reset, applyMachine, setSensitivity };
}

export type { RawReading };
