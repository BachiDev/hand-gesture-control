import { clsx } from 'clsx';
import type { HandAnalysis } from '../../lib/gestures/classifiers';
import type { MachineSnapshot } from '../../lib/gestures/smoothing';

interface GestureLabProps {
  analysis: HandAnalysis | null;
  snapshot: MachineSnapshot;
}

const FINGER_ORDER = ['index', 'middle', 'ring', 'pinky'] as const;

const LABEL_STYLE: Record<string, string> = {
  extended: 'bg-emerald-500 dark:bg-emerald-400',
  half: 'bg-amber-500 dark:bg-amber-400',
  curled: 'bg-zinc-400 dark:bg-zinc-600',
};

function MetricRow({
  label,
  value,
  threshold,
}: {
  label: string;
  value: number;
  threshold: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-16 text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-100">{value.toFixed(2)}</span>
      <span className="text-zinc-500 dark:text-zinc-400">({threshold})</span>
    </li>
  );
}

/**
 * Detection inspector: per-finger joint state, confidence, and the live
 * vote-window histogram. Turns the black box into a verifiable instrument.
 */
export default function GestureLab({ analysis, snapshot }: GestureLabProps) {
  const votes = Object.entries(snapshot.windowCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10 h-full">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Gesture Lab</h3>
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
          stable:{' '}
          <span className="text-brand-700 dark:text-brand-300">
            {snapshot.stable.replace(/_/g, ' ')}
          </span>
        </span>
      </div>

      {!analysis ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No hand in frame — show your hand to inspect it.
        </p>
      ) : analysis.invalid ? (
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-300" role="alert">
          Landmarks invalid — the model emitted non-finite points for this frame. If this persists,
          open DevTools console for the sample and report it.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {FINGER_ORDER.map((name) => {
              const f = analysis.fingers[name];
              return (
                <li key={name} className="flex items-center gap-3 font-mono text-xs">
                  <span className="w-14 text-zinc-600 dark:text-zinc-400">{name}</span>
                  <span
                    className={clsx('w-2 h-2 rounded-full', LABEL_STYLE[f.label])}
                    aria-hidden
                  />
                  <span className="w-20 text-zinc-800 dark:text-zinc-200">{f.label}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {Math.round(f.angleDeg)}° · reach {f.reach.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <div className="flex justify-between font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <span>confidence</span>
              <span className="text-zinc-800 dark:text-zinc-200 tabular-nums">
                {analysis.confidence.toFixed(2)}
              </span>
            </div>
            <div
              className="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden"
              role="meter"
              aria-label="Classification confidence"
              aria-valuenow={Math.round(analysis.confidence * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                style={{ width: `${analysis.confidence * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4 border-t border-zinc-200 dark:border-white/5 pt-3">
            <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
              margins (rule thresholds in brackets)
            </p>
            <ul className="mt-1.5 space-y-1 font-mono text-xs tabular-nums">
              <MetricRow label="up" value={analysis.metrics.upMargin} threshold="> 0.30" />
              <MetricRow label="down" value={analysis.metrics.downMargin} threshold="> 0.30" />
              <MetricRow label="v-spread" value={analysis.metrics.spreadVM} threshold="> 0.30" />
            </ul>
          </div>
        </>
      )}

      <div className="mt-4 border-t border-zinc-200 dark:border-white/5 pt-3">
        <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
          vote window (last 5 frames)
        </p>
        {votes.length === 0 ? (
          <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">—</p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {votes.map(([g, n]) => (
              <li
                key={g}
                className={clsx(
                  'font-mono text-xs rounded-full border px-2.5 py-0.5',
                  g === snapshot.stable
                    ? 'border-brand-500/50 text-brand-700 bg-brand-500/10 dark:text-brand-200'
                    : 'border-zinc-300 text-zinc-500 dark:border-white/10 dark:text-zinc-400'
                )}
              >
                {g.replace(/_/g, ' ')} ×{n}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
