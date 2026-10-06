import { clsx } from 'clsx';
import { ADVERTISED_GESTURES } from '../../data/gestures';
import type { GestureType } from '../../utils/gestureLogic';

/**
 * Compact command reference docked to the camera feed — always visible while
 * detection runs. Icon + name + live status dot per gesture.
 */
export default function CommandMini({ activeGesture }: { activeGesture: GestureType }) {
  return (
    <div
      aria-label="Command center"
      className="rounded-xl border border-white/10 bg-zinc-900/95 p-3 shadow-2xl w-full sm:w-44 shrink-0"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">Commands</p>
      <ul className="mt-2 space-y-1.5">
        {ADVERTISED_GESTURES.map((item) => {
          const Icon = item.icon;
          const isActive = activeGesture === item.id;
          return (
            <li
              key={item.title}
              title={item.desc}
              className={clsx(
                'flex items-center gap-2 rounded-md px-2 py-1.5 border transition-colors',
                isActive ? 'bg-brand-500/15 border-brand-500/40' : 'border-transparent'
              )}
            >
              <Icon
                className={clsx('w-4 h-4 shrink-0', isActive ? 'text-brand-300' : 'text-zinc-400')}
                aria-hidden
              />
              <span
                className={clsx(
                  'text-xs truncate',
                  isActive ? 'text-zinc-100 font-medium' : 'text-zinc-400'
                )}
              >
                {item.title}
              </span>
              <span
                className={clsx('w-1.5 h-1.5 rounded-full ml-auto shrink-0', item.dot)}
                aria-hidden={!isActive}
                aria-label={isActive ? 'Active now' : undefined}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
