import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_URL = 'https://bachidev.github.io/hand-gesture-control';

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: 'Hand Gesture Control — In-Browser Hand Tracking Demo',
  description:
    'Control a web page with hand gestures. Real-time TensorFlow.js + MediaPipe tracking, 100% in-browser — no video ever leaves your device.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  authors: [{ name: 'Fabian Bachmayer', url: 'https://bachi.dev' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Hand Gesture Control',
    title: 'Hand Gesture Control — In-Browser Hand Tracking Demo',
    description:
      'Thumbs up to scroll, victory to toggle. Real-time hand tracking with TensorFlow.js — no video ever leaves your device.',
    images: [{ url: `${SITE_URL}/og-cover.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hand Gesture Control — In-Browser Hand Tracking Demo',
    description:
      'Thumbs up to scroll, victory to toggle. Real-time hand tracking with TensorFlow.js — no video ever leaves your device.',
    images: [`${SITE_URL}/og-cover.png`],
  },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Hand Gesture Control',
  applicationCategory: 'BrowserApplication',
  operatingSystem: 'Any (Web Browser)',
  url: SITE_URL,
  description:
    'In-browser hand gesture control demo using TensorFlow.js and MediaPipe. All tracking runs client-side; no video leaves the device.',
  author: {
    '@type': 'Person',
    name: 'Fabian Bachmayer',
    url: 'https://bachi.dev',
    email: 'fabian@bachi.dev',
  },
  offers: { '@type': 'Offer', price: '0' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `dark` default matches the pre-paint theme script below; the script may
    // remove it pre-hydration (stored light preference) — hence suppressed.
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hgc-theme');if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
