'use client';

import { useCallback, useState } from 'react';
import { SENSITIVITY_PRESETS, type Sensitivity } from '../lib/gestures/config';
import type { HandModelType } from '../lib/ml-loader';

export interface DemoSettings {
  sensitivity: Sensitivity;
  mirror: boolean;
  cameraId: string | null;
  model: HandModelType;
}

const DEFAULTS: DemoSettings = {
  sensitivity: 'standard',
  mirror: true,
  cameraId: null,
  model: 'full',
};
const STORAGE_KEY = 'hgc-settings-v2';

/** Pure: URL (?sensitivity=&mirror=&camera=) overrides stored overrides defaults. */
export function parseSettings(search: string, stored: string | null): DemoSettings {
  let fromStored: Partial<DemoSettings> = {};
  try {
    if (stored) fromStored = JSON.parse(stored) as Partial<DemoSettings>;
  } catch {
    /* corrupted storage → defaults */
  }
  const params = new URLSearchParams(search);
  const sensitivity = params.get('sensitivity');
  const mirror = params.get('mirror');
  const model = params.get('model');
  return {
    sensitivity:
      sensitivity === 'relaxed' || sensitivity === 'standard' || sensitivity === 'strict'
        ? sensitivity
        : typeof fromStored.sensitivity === 'string' &&
            (Object.keys(SENSITIVITY_PRESETS) as string[]).includes(fromStored.sensitivity)
          ? (fromStored.sensitivity as Sensitivity)
          : DEFAULTS.sensitivity,
    mirror: mirror !== null ? mirror !== '0' : (fromStored.mirror ?? DEFAULTS.mirror),
    cameraId: params.get('camera') ?? fromStored.cameraId ?? DEFAULTS.cameraId,
    model:
      model === 'lite' || model === 'full'
        ? model
        : fromStored.model === 'lite' || fromStored.model === 'full'
          ? fromStored.model
          : DEFAULTS.model,
  };
}

export function serializeSettings(s: DemoSettings): string {
  return JSON.stringify(s);
}

/** Settings with localStorage persistence + shareable URL params. */
export function useSettings() {
  // Lazy init reads storage/URL once — no mount effect, SSR-safe.
  const [settings, setSettings] = useState<DemoSettings>(() => {
    if (typeof window === 'undefined') return DEFAULTS;
    try {
      return parseSettings(window.location.search, window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return DEFAULTS;
    }
  });

  const update = useCallback((patch: Partial<DemoSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, serializeSettings(next));
      } catch {
        /* storage blocked → session-only */
      }
      return next;
    });
  }, []);

  return { settings, update };
}
