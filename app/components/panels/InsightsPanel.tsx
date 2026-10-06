import Hud from '../stage/Hud';
import GestureLab from '../gestures/GestureLab';
import EventLog, { type LogEntry } from '../gestures/EventLog';
import type { InferenceStats } from '../WebcamFrame';
import type { MachineSnapshot } from '../../lib/gestures/smoothing';
import type { HandAnalysis } from '../../lib/gestures/classifiers';

const MODEL_NOTES = [
  {
    title: 'Model',
    body: 'MediaPipe Hands via TensorFlow.js, bundled with the app — no CDN scripts. 21 landmarks per hand at up to 25 inferences per second, WebGL with CPU fallback, Full or Lite graph. Angle math on normalized joints classifies the pose; a 5-frame majority vote commits it.',
  },
  {
    title: 'Proof',
    body: 'Every claim on this page is checkable: the Lab shows live joint angles, the HUD shows frame cost, the event log exports as JSON, and the unit suite pins the classifiers on synthetic hands across mirrors, scales, and flips.',
  },
];

/** Insights tab: measurements (HUD, Lab, log) + model notes. */
export default function InsightsPanel({
  stats,
  snapshot,
  analysis,
  log,
  onClearLog,
}: {
  stats: InferenceStats | null;
  snapshot: MachineSnapshot;
  analysis: HandAnalysis | null;
  log: LogEntry[];
  onClearLog: () => void;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
        Measure
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Technical details
      </h2>
      <div className="mt-6">
        <Hud
          fps={stats?.fps ?? null}
          ms={stats?.ms ?? null}
          stable={snapshot.stable}
          confidence={snapshot.confidence}
          errors={stats?.errors ?? 0}
          badLandmarks={stats?.badLandmarks ?? 0}
        />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <GestureLab analysis={analysis} snapshot={snapshot} />
        <EventLog entries={log} onClear={onClearLog} />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {MODEL_NOTES.map((n) => (
          <div
            key={n.title}
            className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {n.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
