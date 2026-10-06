// Local stub for `@mediapipe/hands`.
//
// `@tensorflow-models/hand-pose-detection` statically imports `{ Hands }`
// from `@mediapipe/hands` even when created with `runtime: 'tfjs'` — a path
// that never touches the MediaPipe solution. The real npm package is a
// browser-global UMD build without ESM exports (breaks bundlers) that also
// drags WASM blobs; installing it is pure cost here.
//
// This stub is wired via package.json `"@mediapipe/hands": "file:./stubs/…"`
// — plain npm/node resolution, identical on every OS and CI, no
// bundler-specific alias keys involved. If anyone switches the loader to
// `runtime: 'mediapipe'`, constructing `Hands` throws with directions.
export class Hands {
  constructor() {
    throw new Error(
      "The '@mediapipe/hands' runtime is stubbed out (see stubs/mediapipe-hands). " +
        'Use runtime \'tfjs\' via app/lib/ml-loader.ts, or replace the file: dependency with the real package.',
    );
  }
}

const stub = { Hands };

export default stub;
