// Stub for `@mediapipe/hands`.
//
// `@tensorflow-models/hand-pose-detection` statically imports `{ Hands }`
// from `@mediapipe/hands` at the top of its ESM bundle — even when the
// detector is created with `runtime: 'tfjs'`, a code path that never touches
// the MediaPipe solution. The real `@mediapipe/hands` npm package is a
// browser-global UMD build that cannot be bundled or SSR-rendered, so we
// alias it to this stub (see next.config.ts). If anyone switches the loader
// to `runtime: 'mediapipe'`, this throws with directions instead of failing
// mysteriously.

export class Hands {
  constructor() {
    throw new Error(
      "The '@mediapipe/hands' runtime is stubbed out in this app (see app/lib/mediapipe-stub.ts). " +
        "Use runtime 'tfjs' via app/lib/ml-loader.ts, or install @mediapipe/hands and remove the bundler alias."
    );
  }
}

const MediaPipeHandsStub = { Hands };

export default MediaPipeHandsStub;
