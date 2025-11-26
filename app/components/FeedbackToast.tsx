import React from 'react';
import { clsx } from 'clsx';
import { GestureType } from '../utils/gestureLogic';

const gestureConfig: Record<string, { emoji: string; text: string; color: string }> = {
  thumbs_up: { emoji: '👍', text: 'Scrolling Up', color: 'bg-green-600' },
  thumbs_down: { emoji: '👎', text: 'Scrolling Down', color: 'bg-blue-600' },
  middle_finger: { emoji: '🖕', text: 'Stopping Camera', color: 'bg-red-600' },
  victory: { emoji: '✌️', text: 'Toggling Content', color: 'bg-purple-600' },
  none: { emoji: '👀', text: 'Waiting for gesture...', color: 'bg-neutral-800' },
};

export default function FeedbackToast({ gesture }: { gesture: GestureType }) {
  const config = gestureConfig[gesture] || gestureConfig.none;

  return (
    <div className={clsx(
      "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full backdrop-blur-md flex items-center gap-3 transition-all duration-300 border border-white/10 shadow-xl z-50",
      config.color,
      "bg-opacity-90"
    )}>
      <span className="text-2xl">{config.emoji}</span>
      <span className="font-semibold whitespace-nowrap text-white">{config.text}</span>
    </div>
  );
}