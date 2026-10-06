'use client';

import { useState } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';

export interface LogEntry {
  time: string;
  text: string;
}

/** Rolling gesture event log with copy-as-JSON (manual test record). */
export default function EventLog({
  entries,
  onClear,
}: {
  entries: LogEntry[];
  onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const json = JSON.stringify(entries, null, 2);
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Event Log</h3>
        <div className="flex gap-2">
          <button
            onClick={copy}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:text-zinc-900 hover:border-brand-500/40 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white transition-colors disabled:opacity-40"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={onClear}
            disabled={entries.length === 0}
            aria-label="Clear event log"
            className="p-1.5 rounded-full border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-brand-500/40 dark:border-white/10 dark:text-zinc-400 dark:hover:text-white transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Gesture, hold, and navigation events land here.
        </p>
      ) : (
        <ol className="mt-4 space-y-1.5 overflow-y-auto max-h-56 font-mono text-xs" aria-live="off">
          {entries.map((e, i) => (
            <li key={`${e.time}-${i}`} className="flex gap-3">
              <span className="text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                {e.time}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
