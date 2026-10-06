import { describe, it, expect } from 'vitest';
import { detectGesture } from '../app/utils/gestureLogic';
import { poses } from './fixtures/hands';

// Compat: the historic entry point delegates to the new engine.
// Behavioral cases live in classifier.test.ts; this pins delegation.
describe('detectGesture (compat)', () => {
  it('delegates to the normalized engine', () => {
    expect(detectGesture(poses.thumbsUp())).toBe('thumbs_up');
    expect(detectGesture(poses.openPalm())).toBe('open_palm');
    expect(detectGesture(poses.victory())).toBe('victory');
    expect(detectGesture([])).toBe('none');
  });
});
