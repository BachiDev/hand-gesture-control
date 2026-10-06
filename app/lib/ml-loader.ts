// app/lib/ml-loader.ts
//
// Bundled TF.js hand-detector loader (PLAN.md decision: npm bundle over CDN).
// - Version-pinned via package.json.
// - Slim imports (core + converter + webgl/cpu backends) instead of the full
//   `@tensorflow/tfjs` bundle (which drags data/layers/io the model never uses).
// - Dynamically imported so the TF.js payload never blocks the page shell —
//   and only fetched AFTER the camera is granted (see WebcamFrame: no stream,
//   no model download, so denied/headless visits pay zero ML cost).
// - Cached per model size; WebGL preferred with CPU fallback; retryable.

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
  // Backend imports register themselves as a side effect; core exposes setBackend.
  const [{ createDetector, SupportedModels }, tf] = await Promise.all([
    import('@tensorflow-models/hand-pose-detection'),
    import('@tensorflow/tfjs-core'),
    import('@tensorflow/tfjs-backend-webgl'),
    import('@tensorflow/tfjs-backend-cpu'),
  ]).then(([model, core]) => [model, core] as const);

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
