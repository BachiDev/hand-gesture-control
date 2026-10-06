// app/lib/ml-loader.ts
//
// Bundled TF.js hand-detector loader (PLAN.md decision: npm bundle over CDN).
// - Version-pinned via package.json (@tensorflow/tfjs + @tensorflow-models/hand-pose-detection).
// - Dynamically imported so the TF.js payload never blocks the page shell.
// - Cached: concurrent callers share one load.
// - Prefers the WebGL backend, falls back to CPU on devices without WebGL.

import type { Keypoint } from '../utils/gestureLogic';

export interface HandDetector {
  estimateHands: (
    video: HTMLVideoElement,
    config?: { flipHorizontal: boolean }
  ) => Promise<{ keypoints: Keypoint[] }[]>;
  dispose?: () => void;
  /** Clears tracker state (forces fresh palm detection next frame). */
  reset?: () => void;
}

/** 'lite' is 2–4× cheaper inference for weak hardware (slightly less accurate). */
export type HandModelType = 'full' | 'lite';

const cache = new Map<HandModelType, Promise<HandDetector>>();

export function loadHandDetector(modelType: HandModelType = 'full'): Promise<HandDetector> {
  let pending = cache.get(modelType);
  if (!pending) {
    pending = doLoad(modelType).catch((err) => {
      cache.delete(modelType); // allow retry after failure
      throw err;
    });
    cache.set(modelType, pending);
  }
  return pending;
}

async function doLoad(modelType: HandModelType): Promise<HandDetector> {
  const [{ createDetector, SupportedModels }, tf] = await Promise.all([
    import('@tensorflow-models/hand-pose-detection'),
    import('@tensorflow/tfjs'),
  ]);

  try {
    await tf.setBackend('webgl');
  } catch {
    await tf.setBackend('cpu');
  }
  await tf.ready();

  const detector = await createDetector(SupportedModels.MediaPipeHands, {
    runtime: 'tfjs',
    modelType,
  });
  // The model's Hand type carries extra fields (score, handedness, …);
  // we only consume keypoints, so a structural cast keeps this module typed
  // without leaking the heavy model types into callers.
  return detector as unknown as HandDetector;
}
