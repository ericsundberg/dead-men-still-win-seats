import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  defaultAudioSettings,
} from './audio-settings';
import {
  createAudioServices,
} from './audio-services';

describe(
  'audio services',
  () => {
    it(
      'creates shared audio services',
      () => {
        const audio =
          createAudioServices();

        expect(
          audio.music.has(
            'main-menu-theme',
          ),
        ).toBe(true);

        expect(
          audio.sfx.has(
            'button-brush',
          ),
        ).toBe(true);

        expect(
          audio.sfx.has(
            'button-click',
          ),
        ).toBe(true);

        expect(
          audio.sfx.has(
            'button-cancel',
          ),
        ).toBe(true);

        expect(
          audio.unlocker
            .getIsUnlocked(),
        ).toBe(false);
      },
    );

    it(
      'provides one shared set of audio settings',
      () => {
        const audio =
          createAudioServices({
            ...defaultAudioSettings,

            masterVolume:
              0.75,

            musicVolume:
              0.5,

            sfxVolume:
              0.25,
          });

        expect(
          audio.getSettings(),
        ).toEqual({
          masterVolume:
            0.75,

          musicVolume:
            0.5,

          sfxVolume:
            0.25,

          isMuted:
            false,
        });
      },
    );

    it(
      'updates and normalizes shared settings',
      () => {
        const audio =
          createAudioServices();

        const updatedSettings =
          audio.updateSettings({
            masterVolume:
              0.6,

            musicVolume:
              0.4,

            sfxVolume:
              2,
          });

        expect(
          updatedSettings,
        ).toEqual({
          masterVolume:
            0.6,

          musicVolume:
            0.4,

          sfxVolume:
            1,

          isMuted:
            false,
        });

        expect(
          audio.getSettings(),
        ).toEqual(
          updatedSettings,
        );
      },
    );

    it(
      'returns settings as defensive copies',
      () => {
        const audio =
          createAudioServices();

        expect(
          audio.getSettings(),
        ).not.toBe(
          audio.getSettings(),
        );
      },
    );
  },
);