import React from 'react';

export default function InstructionPanel() {
  const items = [
    { emoji: '👍', title: 'Thumbs Up', desc: 'Scrolls the page UP smoothly.', color: 'text-green-400' },
    { emoji: '👎', title: 'Thumbs Down', desc: 'Scrolls the page DOWN smoothly.', color: 'text-blue-400' },
    { emoji: '🖕', title: 'Middle Finger', desc: 'Emergency Stop. Cuts camera feed.', color: 'text-red-400' },
    { emoji: '✌️', title: 'Victory', desc: 'Toggles visibility of content below.', color: 'text-purple-400' },
  ];

  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 h-full">
      <h2 className="text-2xl font-bold mb-4 text-white">Command Center</h2>
      <p className="text-neutral-400 mb-6 leading-relaxed">
        Control this page using hand gestures. Ensure your hand is visible.
      </p>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-800/50">
            <div className="p-2 bg-neutral-950 rounded-md">
              <span className={`text-xl ${item.color}`}>{item.emoji}</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">{item.title}</h4>
              <p className="text-xs text-neutral-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}