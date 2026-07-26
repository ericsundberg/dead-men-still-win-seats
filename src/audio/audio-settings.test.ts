import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  clampAudioVolume,
  defaultAudioSettings,
  mergeAudioSettings,
  resolveEffectiveVolume,
} from './audio-settings';

describe(
  'audio settings',
  () => {
    it(
      'clamps volume to the 0 to 1 range',
      () => {
        expect(
          clampAudioVolume(
            -1,
          ),
        ).toBe(0);

        expect(
          clampAudioVolume(
            0.5,
          ),
        ).toBe(0.5);

        expect(
          clampAudioVolume(
            2,
          ),
        ).toBe(1);
      },
    );

    it(
      'treats non-finite volume as silent',
      () => {
        expect(
          clampAudioVolume(
            Number.NaN,
          ),
        ).toBe(0);

        expect(
          clampAudioVolume(
            Number.POSITIVE_INFINITY,
          ),
        ).toBe(0);
      },
    );

    it(
      'normalizes volume values while merging settings',
      () => {
        expect(
          mergeAudioSettings(
            defaultAudioSettings,
            {
              masterVolume:
                1.5,

              musicVolume:
                -0.5,

              sfxVolume:
                0.35,
            },
          ),
        ).toEqual({
          masterVolume:
            1,

          musicVolume:
            0,

          sfxVolume:
            0.35,

          isMuted:
            false,
        });
      },
    );

    it(
      'preserves settings omitted from a partial update',
      () => {
        expect(
          mergeAudioSettings(
            {
              masterVolume:
                0.75,

              musicVolume:
                0.5,

              sfxVolume:
                0.25,

              isMuted:
                true,
            },
            {
              musicVolume:
                0.8,
            },
          ),
        ).toEqual({
          masterVolume:
            0.75,

          musicVolume:
            0.8,

          sfxVolume:
            0.25,

          isMuted:
            true,
        });
      },
    );

    it(
      'resolves effective volume from entry, category, and master volume',
      () => {
        expect(
          resolveEffectiveVolume(
            0.5,
            0.5,
            {
              ...defaultAudioSettings,

              masterVolume:
                0.5,
            },
          ),
        ).toBe(0.125);
      },
    );

    it(
      'returns zero effective volume when muted',
      () => {
        expect(
          resolveEffectiveVolume(
            1,
            1,
            {
              ...defaultAudioSettings,

              isMuted:
                true,
            },
          ),
        ).toBe(0);
      },
    );
  },
);