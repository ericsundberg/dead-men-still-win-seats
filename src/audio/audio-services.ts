import {
  defaultAudioSettings,
  loadAudioSettings,
  mergeAudioSettings,
  saveAudioSettings,
} from './audio-settings';
import {
  BrowserAudioUnlocker,
} from './browser-audio-unlocker';
import {
  MusicManager,
} from './music-manager';
import {
  SfxManager,
} from './sfx-manager';
import type {
  AudioSettings,
} from './types';

export interface AudioServices {
  readonly music:
    MusicManager;

  readonly sfx:
    SfxManager;

  readonly unlocker:
    BrowserAudioUnlocker;

  readonly getSettings:
    () => AudioSettings;

  readonly updateSettings:
    (
      partialSettings:
        Partial<AudioSettings>,
    ) => AudioSettings;
}

export function createAudioServices(
  initialSettings:
    AudioSettings =
      loadAudioSettings(),
): AudioServices {
  let settings =
    mergeAudioSettings(
      defaultAudioSettings,
      initialSettings,
    );

  const music =
    new MusicManager();

  const sfx =
    new SfxManager();

  const unlocker =
    new BrowserAudioUnlocker();

  music.updateSettings(
    settings,
  );

  sfx.updateSettings(
    settings,
  );

  const getSettings =
    (): AudioSettings => ({
      ...settings,
    });

  const updateSettings =
    (
      partialSettings:
        Partial<AudioSettings>,
    ): AudioSettings => {
      settings =
        saveAudioSettings(
          mergeAudioSettings(
            settings,
            partialSettings,
          ),
        );

      music.updateSettings(
        settings,
      );

      sfx.updateSettings(
        settings,
      );

      return getSettings();
    };

  return {
    music,
    sfx,
    unlocker,
    getSettings,
    updateSettings,
  };
}