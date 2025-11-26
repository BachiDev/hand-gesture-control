import React from 'react';

const ContentBlock = ({ title, desc }: { title: string, desc: string }) => (
  <div className="p-6 rounded-xl bg-neutral-800/70 border border-neutral-700 space-y-3">
    <h3 className="text-xl font-semibold text-purple-400">{title}</h3>
    <p className="text-sm text-neutral-400">{desc}</p>
  </div>
);

export default ContentBlock;
