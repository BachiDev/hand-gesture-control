import { Camera, Shapes, MousePointerClick } from 'lucide-react';
import Pill from '../ui/Pill';
import Section from '../ui/Section';

const STEPS = [
  {
    icon: Camera,
    title: '1. See',
    desc: 'Your webcam feed goes through a hand model — 21 3D landmarks per hand, up to 25 times a second. The docked frame resizes as you push and pull.',
  },
  {
    icon: Shapes,
    title: '2. Understand',
    desc: 'Finger geometry (extended vs. curled, thumb position, finger spread) is classified into a gesture — all in a few milliseconds, on your device.',
  },
  {
    icon: MousePointerClick,
    title: '3. Act',
    desc: 'The active gesture drives the page: scroll it, flip the theme, say hello, switch tabs. Nothing destructive — the camera stops only via explicit UI.',
  },
];

/** Home tab: hero + how it works. Commands live docked to the
 *  camera feed (always visible). Hero first keeps heading order h1 → h2 → h3. */
export default function HomePanel() {
  return (
    <>
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
          Live ML demo · TensorFlow.js + MediaPipe
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Control this page with your hand.
        </h1>
        <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Real-time hand tracking, right in your browser. The camera starts automatically (your
          browser asks for permission first) — thumbs up to scroll, victory to flip the theme, open
          palm to say hi.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Pill>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
              aria-hidden
            />
            Auto-starts with camera
          </Pill>
          <Pill>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
              aria-hidden
            />
            Video never leaves your device
          </Pill>
          <Pill>No cookies · no tracking</Pill>
        </div>
      </div>

      <Section
        eyebrow="Try it"
        title="Live detection"
        lede="The camera docks to your screen and follows you down the page. Swipe a palm — or use the tabs, arrow keys, and buttons — to move between sections."
      >
        <div>
          <p className="mt-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            Keyboard: ↑↓ scroll · ←→ tabs · V theme · P pause · 1–3 tabs. Live commands follow the
            camera dock, bottom-right.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="p-6 rounded-xl border border-zinc-200 bg-white dark:bg-white/[0.02] dark:border-white/10 space-y-3"
                >
                  <div className="p-2.5 w-fit rounded-lg bg-brand-500/10 border border-brand-500/30">
                    <Icon className="w-5 h-5 text-brand-600 dark:text-brand-300" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </>
  );
}
