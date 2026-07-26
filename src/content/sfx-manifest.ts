import type { SfxManifest } from '../audio/types';

function getSfxPath(filename: string): string {
  return `${import.meta.env.BASE_URL}assets/audio/sfx/${filename}`;
}

export const sfxManifest = {
  'button-brush': {
    id: 'button-brush',
    label: 'Button Brush',
    path: getSfxPath('button-brush.ogg'),
    volume: 0.8,
    allowOverlap: true,
  },

  'button-click': {
    id: 'button-click',
    label: 'Button Click',
    path: getSfxPath('button-click.ogg'),
    volume: 0.8,
    allowOverlap: true,
  },

  'button-cancel': {
    id: 'button-cancel',
    label: 'Button Cancel',
    path: getSfxPath('button-cancel.ogg'),
    volume: 0.8,
    allowOverlap: true,
  },

  'hi-im-buster': {
    id: 'hi-im-buster',
    label: 'Hi, I’m Buster',
    path: getSfxPath('hi-im-buster.ogg'),
    volume: 0.9,
    allowOverlap: false,
  },

  disaster: {
    id: 'disaster',
    label: 'Disaster',
    path: getSfxPath('disaster.ogg'),
    volume: 0.9,
    allowOverlap: true,
  },

  harvest: {
    id: 'harvest',
    label: 'Harvest',
    path: getSfxPath('harvest.ogg'),
    volume: 0.75,
    allowOverlap: true,
  },

  error: {
    id: 'error',
    label: 'Error',
    path: getSfxPath('error.ogg'),
    volume: 0.7,
    allowOverlap: false,
  },
} as const satisfies SfxManifest;

export type SfxId = keyof typeof sfxManifest;