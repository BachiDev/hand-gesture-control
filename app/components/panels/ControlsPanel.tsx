import SettingsPanel, { type CameraOption } from '../gestures/SettingsPanel';
import DistanceSlider from '../play/DistanceSlider';
import type { DemoSettings } from '../../hooks/useSettings';

/** Controls tab: detection settings + the distance-driven slider/zoom. */
export default function ControlsPanel({
  settings,
  cameras,
  onSettingsChange,
  sliderValue,
  onSliderChange,
}: {
  settings: DemoSettings;
  cameras: CameraOption[];
  onSettingsChange: (patch: Partial<DemoSettings>) => void;
  sliderValue: number;
  onSliderChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
        Tune
      </p>
      <h2 className="mt-3 mb-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Settings & distance
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <SettingsPanel settings={settings} cameras={cameras} onChange={onSettingsChange} />
        <DistanceSlider value={sliderValue} onChange={onSliderChange} />
      </div>
    </div>
  );
}
