import type { MusicManifest } from '../audio/types';

export const musicManifest = {
  'main-menu-theme': {
    id: 'main-menu-theme',
    label: 'Ancient Egypt',
    path: '/assets/audio/music/ancient-egypt.ogg',
    loop: true,
    volume: 0.6,
  },

  'yearly-court-theme': {
    id: 'yearly-court-theme',
    label: 'Another Egyptian Theme',
    path: '/assets/audio/music/another-egyptian-theme.ogg',
    loop: true,
    volume: 0.55,
  },

  'disaster-theme': {
    id: 'disaster-theme',
    label: 'Sand Scar Desert',
    path: '/assets/audio/music/sand-scar-desert.ogg',
    loop: false,
    volume: 0.75,
  },
} as const satisfies MusicManifest;

export type MusicTrackId = keyof typeof musicManifest;
