# `@mediapipe/hands` stub

Installed as `"@mediapipe/hands": "file:./stubs/mediapipe-hands"` (see root
`package.json`). Plain npm resolution — no Turbopack/webpack alias keys, which
proved platform-fragile (`resolveAlias` relative paths) or inert (`tsconfig`
`paths` is bypassed for this import).

Do NOT `npm install @mediapipe/hands` over this: the real package has no ESM
exports (build error: `export Hands was not found`) and ships WASM blobs the
`tfjs` runtime path never uses.
