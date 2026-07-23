import { BrowserAudioUnlocker } from './browser-audio-unlocker';
import { MusicManager } from './music-manager';
import { SfxManager } from './sfx-manager';

export interface AudioServices {
  readonly music: MusicManager;
  readonly sfx: SfxManager;
  readonly unlocker: BrowserAudioUnlocker;
}

export function createAudioServices(): AudioServices {
  return {
    music: new MusicManager(),
    sfx: new SfxManager(),
    unlocker: new BrowserAudioUnlocker(),
  };
}
