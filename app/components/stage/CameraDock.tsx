'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, Video, VideoOff } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Always-on-screen camera dock: fixed bottom-right, follows the visitor down
 * the page so the feed + skeleton are visible while scrolling the playground.
 * Push/pull resizes the FRAME (width prop); the feed inside always fills it.
 * Collapses to a status dot (detection pauses while collapsed).
 */
export default function CameraDock({
  active,
  onVisibilityChange,
  onStop,
  frameWidth,
  sidePanel,
  children,
}: {
  active: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onStop: () => void;
  /** Frame width in px (push/pull distance). */
  frameWidth: number;
  /** Command reference docked beside the feed (hidden when collapsed). */
  sidePanel: ReactNode;
  children: ReactNode;
}) {
  // Open by default on all viewports (SSR-identical — no window sniffing,
  // which caused a hydration mismatch on narrow screens). Small screens get
  // a narrower dock via CSS; the user can collapse it to a dot.
  const [open, setOpen] = useState(true);

  const set = (next: boolean) => {
    setOpen(next);
    onVisibilityChange(next);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-[calc(100vw-2rem)]">
          {sidePanel}
          <div
            style={{ width: frameWidth }}
            className="relative max-w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900"
          >
            {children}
            {active && (
              <button
                onClick={onStop}
                aria-label="Stop camera"
                title="Stop camera"
                className="absolute top-2 left-2 z-30 p-1.5 rounded-full bg-zinc-950/70 border border-white/10 text-zinc-300 hover:text-white transition-colors"
              >
                <VideoOff className="w-4 h-4" aria-hidden />
              </button>
            )}
            <button
              onClick={() => set(false)}
              aria-label="Minimize camera dock"
              className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-zinc-950/70 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => set(true)}
          aria-label="Show camera dock"
          className="relative w-12 h-12 rounded-full bg-zinc-900/90 border border-white/10 shadow-xl backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white hover:border-brand-500/40 transition-colors"
        >
          <Video className="w-5 h-5" aria-hidden />
          <span
            className={clsx(
              'absolute top-1 right-1 w-2.5 h-2.5 rounded-full',
              active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
            )}
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}
