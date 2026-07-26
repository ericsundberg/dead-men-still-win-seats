import type {
  AudioSettings,
  AudioVolume,
} from './types';

const audioSettingsStorageKey =
  'dead-men-still-win-seats.audio-settings';

export const minimumAudioVolume = 0;
export const maximumAudioVolume = 1;
export const audioVolumeStep = 0.01;

export const defaultAudioSettings:
  AudioSettings = {
    masterVolume:
      maximumAudioVolume,

    musicVolume:
      maximumAudioVolume,

    sfxVolume:
      maximumAudioVolume,

    isMuted:
      false,
  };

export function clampAudioVolume(
  volume:
    number,
): AudioVolume {
  if (
    !Number.isFinite(
      volume,
    )
  ) {
    return minimumAudioVolume;
  }

  return Math.min(
    maximumAudioVolume,
    Math.max(
      minimumAudioVolume,
      volume,
    ),
  );
}

export function resolveEffectiveVolume(
  entryVolume:
    number,

  categoryVolume:
    number,

  settings:
    AudioSettings,
): AudioVolume {
  if (
    settings.isMuted
  ) {
    return minimumAudioVolume;
  }

  return (
    clampAudioVolume(
      entryVolume,
    )
    * clampAudioVolume(
      categoryVolume,
    )
    * clampAudioVolume(
      settings.masterVolume,
    )
  );
}

export function mergeAudioSettings(
  currentSettings:
    AudioSettings,

  partialSettings:
    Partial<AudioSettings>,
): AudioSettings {
  return {
    masterVolume:
      clampAudioVolume(
        partialSettings
          .masterVolume
        ?? currentSettings
          .masterVolume,
      ),

    musicVolume:
      clampAudioVolume(
        partialSettings
          .musicVolume
        ?? currentSettings
          .musicVolume,
      ),

    sfxVolume:
      clampAudioVolume(
        partialSettings
          .sfxVolume
        ?? currentSettings
          .sfxVolume,
      ),

    isMuted:
      partialSettings
        .isMuted
      ?? currentSettings
        .isMuted,
  };
}

export function loadAudioSettings():
  AudioSettings {
  if (
    typeof localStorage
    === 'undefined'
  ) {
    return {
      ...defaultAudioSettings,
    };
  }

  try {
    const storedSettingsText =
      localStorage.getItem(
        audioSettingsStorageKey,
      );

    if (
      storedSettingsText
      === null
    ) {
      return {
        ...defaultAudioSettings,
      };
    }

    const storedSettings =
      parseStoredAudioSettings(
        JSON.parse(
          storedSettingsText,
        ) as unknown,
      );

    return mergeAudioSettings(
      defaultAudioSettings,
      storedSettings,
    );
  } catch {
    return {
      ...defaultAudioSettings,
    };
  }
}

export function saveAudioSettings(
  settings:
    AudioSettings,
): AudioSettings {
  const normalizedSettings =
    mergeAudioSettings(
      defaultAudioSettings,
      settings,
    );

  if (
    typeof localStorage
    === 'undefined'
  ) {
    return normalizedSettings;
  }

  try {
    localStorage.setItem(
      audioSettingsStorageKey,
      JSON.stringify(
        normalizedSettings,
      ),
    );
  } catch {
    /*
     * Audio must continue working when browser storage is blocked
     * or unavailable. The in-memory settings still apply.
     */
  }

  return normalizedSettings;
}

function parseStoredAudioSettings(
  input:
    unknown,
): Partial<AudioSettings> {
  if (
    !isRecord(
      input,
    )
  ) {
    return {};
  }

  const settings:
    {
      masterVolume?: number;
      musicVolume?: number;
      sfxVolume?: number;
      isMuted?: boolean;
    } = {};

  if (
    typeof input.masterVolume
    === 'number'
  ) {
    settings.masterVolume =
      input.masterVolume;
  }

  if (
    typeof input.musicVolume
    === 'number'
  ) {
    settings.musicVolume =
      input.musicVolume;
  }

  if (
    typeof input.sfxVolume
    === 'number'
  ) {
    settings.sfxVolume =
      input.sfxVolume;
  }

  if (
    typeof input.isMuted
    === 'boolean'
  ) {
    settings.isMuted =
      input.isMuted;
  }

  return settings;
}

function isRecord(
  input:
    unknown,
): input is Record<
  string,
  unknown
> {
  return (
    typeof input
      === 'object'
    && input
      !== null
    && !Array.isArray(
      input,
    )
  );
}