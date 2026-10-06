import { describe, it, expect } from 'vitest';
import { parseSettings, serializeSettings } from '../app/hooks/useSettings';

describe('settings persistence', () => {
  it('defaults when nothing is stored or linked', () => {
    expect(parseSettings('', null)).toEqual({
      sensitivity: 'standard',
      mirror: true,
      cameraId: null,
      model: 'full',
    });
  });

  it('restores stored settings', () => {
    const stored = serializeSettings({
      sensitivity: 'strict',
      mirror: false,
      cameraId: 'abc',
      model: 'lite',
    });
    expect(parseSettings('', stored)).toEqual({
      sensitivity: 'strict',
      mirror: false,
      cameraId: 'abc',
      model: 'lite',
    });
  });

  it('lets URL params override storage (shareable links)', () => {
    const stored = serializeSettings({
      sensitivity: 'strict',
      mirror: false,
      cameraId: 'abc',
      model: 'full',
    });
    expect(parseSettings('?sensitivity=relaxed&mirror=0&model=lite', stored)).toEqual({
      sensitivity: 'relaxed',
      mirror: false,
      cameraId: 'abc',
      model: 'lite',
    });
  });

  it('ignores garbage gracefully', () => {
    expect(parseSettings('?sensitivity=bogus', 'not-json')).toEqual({
      sensitivity: 'standard',
      mirror: true,
      cameraId: null,
      model: 'full',
    });
  });
});
