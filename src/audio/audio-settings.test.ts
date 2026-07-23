import { describe, expect, it } from 'vitest';
import {
  clampAudioVolume,
  defaultAudioSettings,
  resolveEffectiveVolume,
} from './audio-settings';

describe('audio settings', () => {
  it('clamps volume to the 0 to 1 range', () => {
    expect(clampAudioVolume(-1)).toBe(0);
    expect(clampAudioVolume(0.5)).toBe(0.5);
    expect(clampAudioVolume(2)).toBe(1);
  });

  it('treats non-finite volume as silent', () => {
    expect(clampAudioVolume(Number.NaN)).toBe(0);
    expect(clampAudioVolume(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('resolves effective volume from entry, category, and master volume', () => {
    expect(
      resolveEffectiveVolume(0.5, 0.5, {
        ...defaultAudioSettings,
        masterVolume: 0.5,
      }),
    ).toBe(0.125);
  });

  it('returns zero effective volume when muted', () => {
    expect(
      resolveEffectiveVolume(1, 1, {
        ...defaultAudioSettings,
        isMuted: true,
      }),
    ).toBe(0);
  });
});
