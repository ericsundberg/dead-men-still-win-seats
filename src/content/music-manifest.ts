import type { MusicManifest } from '../audio/types';

export const musicManifest = {
  'main-menu-theme': {
    id: 'main-menu-theme',
    label: 'I am Alive',
    path: `${import.meta.env.BASE_URL}assets/audio/music/im-alive.ogg`,
    loop: true,
    volume: 0.6,
  },

  'yearly-court-theme': {
    id: 'yearly-court-theme',
    label: 'Another Egyptian Theme',
    path: `${import.meta.env.BASE_URL}assets/audio/music/another-egyptian-theme.ogg`,
    loop: true,
    volume: 0.55,
  },

  'disaster-theme': {
    id: 'disaster-theme',
    label: 'Sand Scar Desert',
    path: `${import.meta.env.BASE_URL}assets/audio/music/sand-scar-desert.ogg`,
    loop: false,
    volume: 0.75,
  },
} as const satisfies MusicManifest;

export type MusicTrackId = keyof typeof musicManifest;
