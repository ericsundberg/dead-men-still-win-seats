import type { MusicManifest } from '../audio/types';

function getMusicPath(filename: string): string {
  return `${import.meta.env.BASE_URL}assets/audio/music/${filename}`;
}

export const musicManifest = {
  'main-menu-theme': {
    id: 'main-menu-theme',
    label: 'I Am Alive',
    path: getMusicPath('im-alive.ogg'),
    loop: true,
    volume: 0.6,
  },

  'backroads-to-your-door': {
    id: 'backroads-to-your-door',
    label: 'Backroads to Your Door',
    path: getMusicPath('backroads-to-your-door.ogg'),
    loop: false,
    volume: 0.55,
  },

  'calgary-hill': {
    id: 'calgary-hill',
    label: 'Calgary Hill',
    path: getMusicPath('calgary-hill.ogg'),
    loop: false,
    volume: 0.55,
  },

  'campfire-smoke': {
    id: 'campfire-smoke',
    label: 'Campfire Smoke',
    path: getMusicPath('campfire-smoke.ogg'),
    loop: false,
    volume: 0.55,
  },

  'country-all-the-way': {
    id: 'country-all-the-way',
    label: 'Country All the Way',
    path: getMusicPath('country-all-the-way.ogg'),
    loop: false,
    volume: 0.55,
  },

  'country-back-road': {
    id: 'country-back-road',
    label: 'Country Back Road',
    path: getMusicPath('country-back-road.ogg'),
    loop: false,
    volume: 0.55,
  },

  'country-jam': {
    id: 'country-jam',
    label: 'Country Jam',
    path: getMusicPath('country-jam.ogg'),
    loop: false,
    volume: 0.55,
  },

  'daisy-dukes': {
    id: 'daisy-dukes',
    label: 'Daisy Dukes',
    path: getMusicPath('daisy-dukes.ogg'),
    loop: false,
    volume: 0.55,
  },

  'harley-davidson': {
    id: 'harley-davidson',
    label: 'Harley Davidson',
    path: getMusicPath('harley-davidson.ogg'),
    loop: false,
    volume: 0.55,
  },

  humidity: {
    id: 'humidity',
    label: 'Humidity',
    path: getMusicPath('humidity.ogg'),
    loop: false,
    volume: 0.55,
  },

  'lonesome-avenue': {
    id: 'lonesome-avenue',
    label: 'Lonesome Avenue',
    path: getMusicPath('lonesome-avenue.ogg'),
    loop: false,
    volume: 0.55,
  },

  'long-way-home': {
    id: 'long-way-home',
    label: 'Long Way Home',
    path: getMusicPath('long-way-home.ogg'),
    loop: false,
    volume: 0.55,
  },

  'moonshine-town': {
    id: 'moonshine-town',
    label: 'Moonshine Town',
    path: getMusicPath('moonshine-town.ogg'),
    loop: false,
    volume: 0.55,
  },
} as const satisfies MusicManifest;

export type MusicTrackId =
  keyof typeof musicManifest;

export const gameplayMusicTrackIds = [
  'backroads-to-your-door',
  'calgary-hill',
  'campfire-smoke',
  'country-all-the-way',
  'country-back-road',
  'country-jam',
  'daisy-dukes',
  'harley-davidson',
  'humidity',
  'lonesome-avenue',
  'long-way-home',
  'moonshine-town',
] as const satisfies readonly MusicTrackId[];

export type GameplayMusicTrackId =
  typeof gameplayMusicTrackIds[number];

/**
 * The number of recently played gameplay tracks that cannot
 * immediately be selected again.
 */
export const gameplayMusicHistorySize = 5;

/**
 * Selects a random gameplay track while excluding anything
 * played during the previous five gameplay selections.
 *
 * The eligible pool is created before random selection, rather
 * than repeatedly rerolling the same blocked result. This
 * guarantees that selection completes while producing the same
 * intended result: a blocked track is skipped and another random
 * track is selected.
 */
export function selectGameplayMusicTrackId(
  recentTrackIds: readonly GameplayMusicTrackId[] = [],
  random: () => number = Math.random,
): GameplayMusicTrackId {
  const blockedTrackIds = new Set(
    recentTrackIds.slice(
      -gameplayMusicHistorySize,
    ),
  );

  const eligibleTrackIds =
    gameplayMusicTrackIds.filter(
      (trackId) => !blockedTrackIds.has(trackId),
    );

  /*
   * With 12 gameplay tracks and a five-track history, this
   * fallback should never be required. It keeps the function
   * safe if the pool or history settings change later.
   */
  const selectionPool =
    eligibleTrackIds.length > 0
      ? eligibleTrackIds
      : gameplayMusicTrackIds;

  const randomValue =
    normalizeRandomValue(random());

  const selectedIndex = Math.floor(
    randomValue * selectionPool.length,
  );

  return selectionPool[selectedIndex];
}

/**
 * Records a selected gameplay track and retains only the five
 * most recent tracks needed by the repeat-prevention rule.
 */
export function rememberGameplayMusicTrack(
  recentTrackIds: readonly GameplayMusicTrackId[],
  trackId: GameplayMusicTrackId,
): readonly GameplayMusicTrackId[] {
  return [
    ...recentTrackIds,
    trackId,
  ].slice(-gameplayMusicHistorySize);
}

function normalizeRandomValue(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  /*
   * Math.random normally returns values from 0 inclusive to
   * 1 exclusive. Clamping also makes injected test randomizers
   * safe when they return 1 or an out-of-range value.
   */
  return Math.min(
    0.999999999,
    Math.max(0, value),
  );
}