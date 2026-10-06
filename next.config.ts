import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages (project page).
  // NOTE: branch stays `master` per PLAN.md decision; workflow deploys `./out`.
  output: 'export',
  images: {
    unoptimized: true,
  },
  // NOTE: `@mediapipe/hands` is aliased in tsconfig `paths` (standard Next.js
  // mechanism, honored by webpack + Turbopack on every platform) — see below.
};

export default nextConfig;
