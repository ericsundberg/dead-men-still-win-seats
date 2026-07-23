import type { SfxManifest } from '../audio/types';

export const sfxManifest = {
  'button-click': {
    id: 'button-click',
    label: 'Button Click',
    path: '/assets/audio/sfx/button-click.ogg',
    volume: 0.8,
    allowOverlap: true,
  },

  'button-cancel': {
    id: 'button-cancel',
    label: 'Button Cancel',
    path: '/assets/audio/sfx/button-cancel.ogg',
    volume: 0.8,
    allowOverlap: true,
  },

  disaster: {
    id: 'disaster',
    label: 'Disaster',
    path: '/assets/audio/sfx/disaster.ogg',
    volume: 0.9,
    allowOverlap: true,
  },

  harvest: {
    id: 'harvest',
    label: 'Harvest',
    path: '/assets/audio/sfx/harvest.ogg',
    volume: 0.75,
    allowOverlap: true,
  },

  error: {
    id: 'error',
    label: 'Error',
    path: '/assets/audio/sfx/error.ogg',
    volume: 0.7,
    allowOverlap: false,
  },
} as const satisfies SfxManifest;

export type SfxId = keyof typeof sfxManifest;
