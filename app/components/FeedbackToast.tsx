import { clsx } from 'clsx';
import { ThumbsUp, ThumbsDown, Zap, Hand, EyeOff, type LucideIcon } from 'lucide-react';
import { GestureType } from '../utils/gestureLogic';

const gestureConfig: Record<GestureType, { icon: LucideIcon; text: string; dot: string }> = {
  thumbs_up: { icon: ThumbsUp, text: 'Scrolling up', dot: 'bg-emerald-400' },
  thumbs_down: { icon: ThumbsDown, text: 'Scrolling down', dot: 'bg-sky-400' },
  // Unlisted easter egg: classified but never announced and never advertised.
  middle_finger: { icon: Hand, text: '…', dot: 'bg-red-400' },
  victory: { icon: Zap, text: 'Toggling theme', dot: 'bg-brand-400' },
  open_palm: {
    icon: Hand,
    text: 'Nice hand! Swipe ←/→, push closer, pull away',
    dot: 'bg-amber-400',
  },
  none: { icon: EyeOff, text: 'Waiting for gesture', dot: 'bg-zinc-500' },
};

/**
 * Polite status line: announces the active gesture to assistive tech,
 * hidden when idle — and always silent for the unlisted easter egg.
 */
export default function FeedbackToast({
  gesture,
  extra,
}: {
  gesture: GestureType;
  extra?: string;
}) {
  if (gesture === 'none' || gesture === 'middle_finger') return null;
  const config = gestureConfig[gesture];
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-5 py-2.5 rounded-full',
        'bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-xl'
      )}
    >
      <span className={clsx('w-2 h-2 rounded-full', config.dot)} aria-hidden />
      <Icon className="w-4 h-4 text-zinc-200" aria-hidden />
      <span className="font-medium text-sm text-zinc-100 whitespace-nowrap">
        {config.text}
        {extra ? ` · ${extra}` : ''}
      </span>
    </div>
  );
}
