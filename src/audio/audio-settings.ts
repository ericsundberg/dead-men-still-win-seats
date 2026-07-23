import type { AudioSettings, AudioVolume } from './types';

export const defaultAudioSettings: AudioSettings = {
  masterVolume: 1,
  musicVolume: 1,
  sfxVolume: 1,
  isMuted: false,
};

export function clampAudioVolume(volume: number): AudioVolume {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.min(1, Math.max(0, volume));
}

export function resolveEffectiveVolume(
  entryVolume: number,
  categoryVolume: number,
  settings: AudioSettings,
): AudioVolume {
  if (settings.isMuted) {
    return 0;
  }

  return clampAudioVolume(entryVolume)
    * clampAudioVolume(categoryVolume)
    * clampAudioVolume(settings.masterVolume);
}

export function mergeAudioSettings(
  currentSettings: AudioSettings,
  partialSettings: Partial<AudioSettings>,
): AudioSettings {
  return {
    masterVolume: partialSettings.masterVolume ?? currentSettings.masterVolume,
    musicVolume: partialSettings.musicVolume ?? currentSettings.musicVolume,
    sfxVolume: partialSettings.sfxVolume ?? currentSettings.sfxVolume,
    isMuted: partialSettings.isMuted ?? currentSettings.isMuted,
  };
}
