// Generates public/og-cover.png (1200×630) from an inline SVG via sharp.
// Mirrors the bachi.dev approach: checked-in generated asset, rerun via `npm run og`.
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#09090b"/>
      <stop offset="1" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#d946ef"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="100" y="150" width="72" height="8" rx="4" fill="url(#bar)"/>
  <text x="100" y="130" font-family="monospace" font-size="28" letter-spacing="6" fill="#a78bfa">BACHI.DEV · LIVE ML DEMO</text>
  <text x="100" y="270" font-family="sans-serif" font-size="96" font-weight="bold" fill="#f4f4f5">Hand Gesture</text>
  <text x="100" y="370" font-family="sans-serif" font-size="96" font-weight="bold" fill="#f4f4f5">Control</text>
  <text x="100" y="450" font-family="sans-serif" font-size="34" fill="#a1a1aa">Thumbs up to scroll, victory to toggle.</text>
  <text x="100" y="500" font-family="sans-serif" font-size="34" fill="#a1a1aa">100% in-browser — video never leaves your device.</text>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-cover.png'));
console.log('og-cover.png written');
