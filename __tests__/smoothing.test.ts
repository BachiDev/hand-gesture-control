import { describe, it, expect } from 'vitest';
import { createMachine, pushReading, setTuning, snapshot } from '../app/lib/gestures/smoothing';
import type { RawReading } from '../app/lib/gestures/smoothing';

const reading = (gesture: RawReading['gesture']): RawReading => ({ gesture, confidence: 0.9 });

// Drives the machine with one reading per 50 ms tick.
function drive(
  gestures: RawReading['gesture'][],
  start = 0
): { ev: ReturnType<typeof pushReading>[] } {
  const m = createMachine();
  const ev = gestures.map((g, i) => pushReading(m, reading(g), start + i * 50));
  return { ev };
}

describe('gesture machine', () => {
  it('commits a gesture after enough votes, not on first sight', () => {
    const m = createMachine();
    let t = 0;
    for (let i = 0; i < 3; i++) pushReading(m, reading('victory'), (t += 50));
    expect(snapshot(m).stable).toBe('none');
    pushReading(m, reading('victory'), (t += 50));
    expect(snapshot(m).stable).toBe('victory');
  });

  it('ignores single-frame blips (hysteresis)', () => {
    const m = createMachine();
    let t = 0;
    for (let i = 0; i < 5; i++) pushReading(m, reading('thumbs_up'), (t += 50));
    expect(snapshot(m).stable).toBe('thumbs_up');
    pushReading(m, reading('victory'), (t += 50)); // a single foreign frame
    expect(snapshot(m).stable).toBe('thumbs_up');
  });

  it('fires a transition action once per cooldown window', () => {
    const m = createMachine();
    let t = 0;
    const evs = [];
    for (let i = 0; i < 5; i++) evs.push(pushReading(m, reading('victory'), (t += 50)));
    expect(evs.filter((e) => e.entered === 'victory')).toHaveLength(1);
    // Still victory: no re-fire without a transition…
    for (let i = 0; i < 5; i++) evs.push(pushReading(m, reading('victory'), (t += 50)));
    expect(evs.filter((e) => e.entered === 'victory')).toHaveLength(1);
    // …leave and come back after the cooldown: fires again.
    for (let i = 0; i < 5; i++) pushReading(m, reading('none'), (t += 50));
    t += 800;
    const back = [];
    for (let i = 0; i < 5; i++) back.push(pushReading(m, reading('victory'), (t += 50)));
    expect(back.filter((e) => e.entered === 'victory')).toHaveLength(1);
  });

  it('greets on palm entry with its own (longer) cooldown', () => {
    const m = createMachine();
    let t = 0;
    const evs = [];
    for (let i = 0; i < 5; i++) evs.push(pushReading(m, reading('open_palm'), (t += 50)));
    expect(evs.filter((e) => e.entered === 'open_palm')).toHaveLength(1);
    // Immediate re-wave inside the cooldown: silent.
    for (let i = 0; i < 5; i++) pushReading(m, reading('none'), (t += 50));
    const again = [];
    for (let i = 0; i < 5; i++) again.push(pushReading(m, reading('open_palm'), (t += 50)));
    expect(again.filter((e) => e.entered === 'open_palm')).toHaveLength(0);
    // After the cooldown: greets again.
    t += 1500;
    for (let i = 0; i < 5; i++) pushReading(m, reading('none'), (t += 50));
    const later = [];
    for (let i = 0; i < 5; i++) later.push(pushReading(m, reading('open_palm'), (t += 50)));
    expect(later.filter((e) => e.entered === 'open_palm')).toHaveLength(1);
  });

  it('fires no action for non-configured gestures (thumbs just steer)', () => {
    const m = createMachine();
    let t = 0;
    const evs = [];
    for (let i = 0; i < 6; i++) evs.push(pushReading(m, reading('thumbs_up'), (t += 50)));
    expect(snapshot(m).stable).toBe('thumbs_up');
    expect(evs.every((e) => e.entered === null)).toBe(true);
  });

  it('applies sensitivity tuning live', () => {
    const m = createMachine();
    setTuning(m, { votesNeeded: 5, minConfidence: 0.65 });
    let t = 0;
    for (let i = 0; i < 4; i++) pushReading(m, reading('victory'), (t += 50));
    expect(snapshot(m).stable).toBe('none'); // strict needs 5
    pushReading(m, reading('victory'), (t += 50));
    expect(snapshot(m).stable).toBe('victory');

    // Low-confidence frames vote 'none' under strict tuning.
    const m2 = createMachine();
    setTuning(m2, { votesNeeded: 3, minConfidence: 0.65 });
    for (let i = 0; i < 5; i++)
      pushReading(m2, { gesture: 'victory', confidence: 0.55 }, (t += 50));
    expect(snapshot(m2).stable).toBe('none');
  });

  it('drive helper sanity: exports are wired', () => {
    expect(drive(['none']).ev).toHaveLength(1);
  });
});
