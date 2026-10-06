import type { ReactNode } from 'react';

const ContentBlock = ({ title, desc }: { title: string; desc: ReactNode }) => (
  <div className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10 space-y-3 hover:border-brand-500/40 transition-colors">
    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>
  </div>
);

export default ContentBlock;
