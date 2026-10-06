import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface SectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
  className?: string;
}

/** Shared section intro: mono kicker → H2 → lede (mirrors bachi.dev). */
export default function Section({ id, eyebrow, title, lede, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('py-16 md:py-24', className)}>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {lede && (
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          {lede}
        </p>
      )}
      <div className="mt-10">{children}</div>
    </section>
  );
}
