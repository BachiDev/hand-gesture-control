import { describe, it, expect } from 'vitest';
import { ADVERTISED_GESTURES } from '../app/data/gestures';

// Pins the PLAN.md decision: middle_finger is an unlisted easter egg.
// If someone adds it to the advertised set, this fails on purpose.
describe('advertised gestures', () => {
  it('exposes exactly the portfolio-safe set (palm rows share one id)', () => {
    expect(ADVERTISED_GESTURES.map((g) => g.id).sort()).toEqual(
      ['open_palm', 'open_palm', 'thumbs_down', 'thumbs_up', 'victory'].sort()
    );
    const titles = ADVERTISED_GESTURES.map((g) => g.title);
    expect(new Set(titles).size).toBe(titles.length); // unique labels/tooltips
    expect(titles).toContain('Swipe Palm');
    expect(titles).toContain('Push / Pull');
  });

  it('every entry has an icon, copy, and accent dot', () => {
    for (const g of ADVERTISED_GESTURES) {
      expect(g.icon).toBeTruthy();
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.desc.length).toBeGreaterThan(0);
      expect(g.dot).toMatch(/^bg-/);
    }
  });
});
