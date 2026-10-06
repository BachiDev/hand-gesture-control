import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PillProps {
  children: ReactNode;
  className?: string;
}

/** Small mono pill for meta facts (mirrors bachi.dev tech pills). */
export default function Pill({ children, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs',
        'border-zinc-300 bg-zinc-200/60 text-zinc-600',
        'dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400',
        className
      )}
    >
      {children}
    </span>
  );
}
