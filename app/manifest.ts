import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hand Gesture Control',
    short_name: 'Gesture Control',
    description: 'In-browser hand tracking demo — control a page with gestures.',
    start_url: '.',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [{ src: 'logo.png', sizes: 'any', type: 'image/png' }],
  };
}
