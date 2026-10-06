import type { NextConfig } from 'next';
import path from 'path';

const mediapipeStub = path.join(__dirname, 'app/lib/mediapipe-stub.ts');

const nextConfig: NextConfig = {
  // Static export for GitHub Pages (project page).
  // NOTE: branch stays `master` per PLAN.md decision; workflow deploys `./out`.
  output: 'export',
  images: {
    unoptimized: true,
  },
  // `@tensorflow-models/hand-pose-detection` statically imports
  // `@mediapipe/hands` even for `runtime: 'tfjs'` (which never uses it).
  // The real package is a browser-global UMD build that breaks bundling/SSR,
  // so both bundlers resolve it to a local stub (see app/lib/mediapipe-stub.ts).
  turbopack: {
    // NOTE: value must be project-relative — Turbopack cannot parse absolute
    // Windows paths (`C:\…`) here ("windows imports are not implemented yet").
    resolveAlias: {
      '@mediapipe/hands': './app/lib/mediapipe-stub.ts',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@mediapipe/hands': mediapipeStub,
    };
    return config;
  },
};

export default nextConfig;
