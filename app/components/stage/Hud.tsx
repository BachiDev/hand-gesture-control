import type { GestureType } from '../../utils/gestureLogic';

interface HudProps {
  fps: number | null;
  ms: number | null;
  stable: GestureType;
  confidence: number;
  errors: number;
  badLandmarks: number;
}

/** Live performance readout: effective inference rate, cost, and decision. */
export default function Hud({ fps, ms, stable, confidence, errors, badLandmarks }: HudProps) {
  const stat = (label: string, value: string) => (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-100 tabular-nums">{value}</span>
    </span>
  );

  return (
    <div
      className="mt-4 flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-100/70 dark:border-white/5 dark:bg-zinc-950/60 px-4 py-2.5 font-mono text-xs"
      role="status"
      aria-label="Detection performance"
    >
      {stat('fps', fps === null ? '—' : String(Math.round(fps)))}
      {stat('infer', ms === null ? '—' : `${Math.round(ms)} ms`)}
      {stat('stable', stable.replace(/_/g, ' '))}
      {stat('conf', confidence > 0 ? confidence.toFixed(2) : '—')}
      {errors > 0 && (
        <span className="inline-flex items-baseline gap-1.5" role="alert">
          <span className="text-amber-700 dark:text-amber-400">
            detection failing ×{errors} — see console
          </span>
        </span>
      )}
      {badLandmarks > 0 && (
        <span className="inline-flex items-baseline gap-1.5" role="alert">
          <span className="text-amber-700 dark:text-amber-400">
            bad landmarks ×{badLandmarks} — see console
          </span>
        </span>
      )}
    </div>
  );
}
