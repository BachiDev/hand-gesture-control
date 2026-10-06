'use client';

/**
 * Analog demo control: driven by palm push/pull (relative palm-size
 * tracking), mouse, touch, or arrow keys. Doubles as the frame-size readout:
 * the dock frame resizes with the value.
 */
export default function DistanceSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Distance Slider</h3>
        <span className="font-mono text-sm text-fuchsia-700 dark:text-fuchsia-300 tabular-nums">
          {Math.round(value)}%
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Show an open palm, then move closer or farther — the camera frame resizes with the value. Or
        drag / use arrow keys.
      </p>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Demo level (distance-controlled)"
        className="mt-4 w-full accent-fuchsia-600 dark:accent-fuchsia-400"
      />
      <div
        className="mt-3 h-2.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-100"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
