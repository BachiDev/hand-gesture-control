'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Github, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { cn } from '../../lib/cn';
import type { Theme } from '../DemoApp';

const SOURCE_URL = 'https://github.com/BachiDev/hand-gesture-control';

/** Fixed navbar: brand row + tab row pinned below it. Tabs live here, on top. */
export default function SiteHeader({
  tabs,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
}: {
  tabs: readonly string[];
  activeTab: number;
  onTabChange: (i: number) => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 backdrop-blur-md transition-colors',
        scrolled
          ? 'bg-white/80 border-b border-zinc-200 dark:bg-zinc-950/80 dark:border-white/10'
          : 'bg-white/60 border-b border-zinc-200/60 dark:bg-transparent dark:border-white/5'
      )}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="https://bachi.dev"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
              bachi.dev
            </a>
            <span className="w-px h-5 bg-zinc-300 dark:bg-white/10 shrink-0" aria-hidden />
            <div className="flex items-center gap-2 min-w-0">
              <Image alt="" height={24} src="./logo.png" width={24} className="shrink-0" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Hand Gesture Control
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                aria-hidden
              />
              100% in-browser
            </span>
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              // Stored preference may differ from the SSR default.
              suppressHydrationWarning
              className="p-2 rounded-full border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-brand-500/40 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden />
              ) : (
                <Moon className="w-4 h-4" aria-hidden />
              )}
            </button>
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source code on GitHub"
              className="p-2 rounded-full border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-brand-500/40 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" aria-hidden />
            </a>
          </div>
        </div>
        <nav aria-label="Site sections">
          <div role="tablist" className="flex gap-1 overflow-x-auto pb-2 -mt-1">
            {tabs.map((name, i) => (
              <button
                key={name}
                role="tab"
                aria-selected={activeTab === i}
                onClick={() => onTabChange(i)}
                className={clsx(
                  'rounded-full px-5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  activeTab === i
                    ? 'bg-brand-500/15 text-brand-700 border border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-100'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
