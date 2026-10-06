import { clsx } from 'clsx';
import { SENSITIVITY_PRESETS, type Sensitivity } from '../../lib/gestures/config';
import type { HandModelType } from '../../lib/ml-loader';
import type { DemoSettings } from '../../hooks/useSettings';

export interface CameraOption {
  deviceId: string;
  label: string;
}

/** Detection settings: sensitivity, model, mirror, camera. Persisted + shareable. */
export default function SettingsPanel({
  settings,
  cameras,
  onChange,
}: {
  settings: DemoSettings;
  cameras: CameraOption[];
  onChange: (patch: Partial<DemoSettings>) => void;
}) {
  return (
    <div className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h3>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
        Sensitivity
      </p>
      <div className="mt-2 flex gap-2" role="group" aria-label="Detection sensitivity">
        {(Object.keys(SENSITIVITY_PRESETS) as Sensitivity[]).map((s) => (
          <button
            key={s}
            onClick={() => onChange({ sensitivity: s })}
            aria-pressed={settings.sensitivity === s}
            suppressHydrationWarning
            className={clsx(
              'flex-1 rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors',
              settings.sensitivity === s
                ? 'bg-brand-500/15 text-brand-700 border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-100'
                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-400 dark:hover:text-zinc-100'
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        Relaxed fires faster · strict needs cleaner poses. Applies instantly.
      </p>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
        Model
      </p>
      <div className="mt-2 flex gap-2" role="group" aria-label="Model size">
        {(['full', 'lite'] as HandModelType[]).map((m) => (
          <button
            key={m}
            onClick={() => onChange({ model: m })}
            aria-pressed={settings.model === m}
            suppressHydrationWarning
            className={clsx(
              'flex-1 rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors',
              settings.model === m
                ? 'bg-brand-500/15 text-brand-700 border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-100'
                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-400 dark:hover:text-zinc-100'
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        Lite is 2–4× faster for weak hardware (slightly less accurate). Reloads the model.
      </p>

      <label className="mt-4 flex items-center justify-between gap-4 cursor-pointer">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">Mirror preview</span>
        <input
          type="checkbox"
          checked={settings.mirror}
          onChange={(e) => onChange({ mirror: e.target.checked })}
          className="w-4 h-4 accent-violet-600 dark:accent-violet-500"
          suppressHydrationWarning
        />
      </label>

      <label className="mt-4 block">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Camera
        </span>
        <select
          value={settings.cameraId ?? ''}
          onChange={(e) => onChange({ cameraId: e.target.value || null })}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
          suppressHydrationWarning
        >
          <option value="">Default camera</option>
          {cameras.map((c, i) => (
            <option key={c.deviceId} value={c.deviceId}>
              {c.label || `Camera ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
