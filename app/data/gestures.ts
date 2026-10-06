import type { ComponentType } from 'react';
import { ThumbsUp, ThumbsDown, MoveHorizontal, ZoomIn, type LucideIcon } from 'lucide-react';
import VictoryIcon from '../components/ui/VictoryIcon';
import type { GestureType } from '../utils/gestureLogic';

export interface GestureMeta {
  /** Stable gesture for highlight/simulation; several rows may share one. */
  id: GestureType;
  title: string;
  /** Full explanation — shown as tooltip in the docked command list. */
  desc: string;
  icon: LucideIcon | ComponentType<{ className?: string }>;
  /** Accent dot color (Tailwind class). */
  dot: string;
}

/**
 * Advertised gesture vocabulary. Open-palm rows share one id: the pose does
 * three things (hello + swipe + push/pull) and all rows light up together.
 * `middle_finger` is deliberately absent: unlisted easter egg, never a headline.
 */
export const ADVERTISED_GESTURES: GestureMeta[] = [
  {
    id: 'thumbs_up',
    title: 'Thumbs Up',
    desc: 'Scroll up — hold a fist with the thumb pointing up.',
    icon: ThumbsUp,
    dot: 'bg-emerald-400',
  },
  {
    id: 'thumbs_down',
    title: 'Thumbs Down',
    desc: 'Scroll down — hold a fist with the thumb pointing down.',
    icon: ThumbsDown,
    dot: 'bg-sky-400',
  },
  {
    id: 'victory',
    title: 'Victory',
    desc: 'Flip the whole page between light and dark mode.',
    icon: VictoryIcon,
    dot: 'bg-brand-400',
  },
  {
    id: 'open_palm',
    title: 'Swipe Palm',
    desc: 'Fling an open palm left or right to switch Home / Settings / Insights tabs.',
    icon: MoveHorizontal,
    dot: 'bg-amber-400',
  },
  {
    id: 'open_palm',
    title: 'Push / Pull',
    desc: 'Move an open palm closer or farther to resize the camera frame and drive the slider.',
    icon: ZoomIn,
    dot: 'bg-fuchsia-400',
  },
];
