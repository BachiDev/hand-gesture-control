import { describe, it, expect } from 'vitest';
import { classifyHand } from '../app/lib/gestures/classifiers';
import { GESTURE_CONFIG } from '../app/lib/gestures/config';
import { poses, mirrorX, flipY, scaleTranslate } from './fixtures/hands';

// The Phase 2 contract: normalized angle math classifies every pose
// correctly across mirror / flip / scale+translate transforms.
// Product rule (no-fist revision): a tucked-thumb fist matches NOTHING —
// natural resting hands must never fire actions.

describe('classifyHand', () => {
  it("returns 'none' for missing/short/degenerate input", () => {
    expect(classifyHand([]).gesture).toBe('none');
    expect(classifyHand(poses.thumbsUp().slice(0, 10)).gesture).toBe('none');
  });

  it('quarantines non-finite landmarks instead of poisoning the pipeline', () => {
    const nan = poses.thumbsUp().map((p) => ({ ...p, x: NaN }));
    const r = classifyHand(nan);
    expect(r.gesture).toBe('none');
    expect(r.invalid).toBe(true);
    expect(Number.isNaN(r.confidence)).toBe(false);
    const undef = poses.thumbsUp().map((p, i) => (i === 4 ? { x: 0, y: undefined as never } : p));
    expect(classifyHand(undef).invalid).toBe(true);
  });

  it('detects the advertised set on canonical poses', () => {
    expect(classifyHand(poses.thumbsUp()).gesture).toBe('thumbs_up');
    expect(classifyHand(poses.thumbsDown()).gesture).toBe('thumbs_down');
    expect(classifyHand(poses.victory()).gesture).toBe('victory');
    expect(classifyHand(poses.openPalm()).gesture).toBe('open_palm');
  });

  it('a natural fist fires nothing', () => {
    expect(classifyHand(poses.fist()).gesture).toBe('none');
    expect(classifyHand(mirrorX(poses.fist())).gesture).toBe('none');
  });

  it('still classifies the unlisted easter egg', () => {
    expect(classifyHand(poses.middleFinger()).gesture).toBe('middle_finger');
  });

  it('rejects near-misses instead of guessing', () => {
    expect(classifyHand(poses.victoryTogether()).gesture).toBe('none');
    expect(classifyHand(poses.flatHalf()).gesture).toBe('none');
  });

  it('is invariant to mirroring (left hand)', () => {
    expect(classifyHand(mirrorX(poses.thumbsUp())).gesture).toBe('thumbs_up');
    expect(classifyHand(mirrorX(poses.victory())).gesture).toBe('victory');
  });

  it('is invariant to scale + translation (distance / framing)', () => {
    const t = (kp: ReturnType<typeof poses.thumbsUp>) => scaleTranslate(kp, 1.6, 200, 150);
    expect(classifyHand(t(poses.thumbsUp())).gesture).toBe('thumbs_up');
    expect(classifyHand(t(poses.victory())).gesture).toBe('victory');
    expect(classifyHand(t(poses.openPalm())).gesture).toBe('open_palm');
  });

  it('handles upside-down hands via symmetric screen rules', () => {
    // Victory is orientation-free (angles + spread only).
    expect(classifyHand(flipY(poses.victory())).gesture).toBe('victory');
    // A flipped thumbs-down points screen-up: correctly reads as thumbs-up.
    expect(classifyHand(flipY(poses.thumbsDown())).gesture).toBe('thumbs_up');
  });

  it('reports confidence above threshold for clear poses', () => {
    for (const pose of [poses.thumbsUp(), poses.victory(), poses.openPalm()]) {
      const r = classifyHand(pose);
      expect(r.confidence).toBeGreaterThanOrEqual(GESTURE_CONFIG.minConfidence);
    }
  });
});
