import { ArrowUp, Github } from 'lucide-react';

const SOURCE_URL = 'https://github.com/BachiDev/hand-gesture-control';

/** On-brand footer: privacy line (no tracking, no server) + source + back-to-top. */
export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">Hand Gesture Control</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Built by Fabian Bachmayer ·{' '}
            <a
              href="https://bachi.dev"
              className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              bachi.dev
            </a>
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            Privacy: video never leaves your device. No cookies, no tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:text-zinc-900 hover:border-brand-500/40 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" aria-hidden />
            Source
          </a>
          <a
            href="#top"
            aria-label="Back to top"
            className="p-2.5 rounded-full border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-brand-500/40 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            <ArrowUp className="w-4 h-4" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
