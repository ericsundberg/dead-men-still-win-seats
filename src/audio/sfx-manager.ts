import { sfxManifest, type SfxId } from '../content/sfx-manifest';
import {
  defaultAudioSettings,
  mergeAudioSettings,
  resolveEffectiveVolume,
} from './audio-settings';
import type { AudioSettings, SfxManifest, SfxManifestEntry } from './types';

export class SfxManager {
  private settings: AudioSettings;

  public constructor(
    private readonly manifest: SfxManifest = sfxManifest,
    initialSettings: AudioSettings = defaultAudioSettings,
  ) {
    this.settings = initialSettings;
  }

  public play(id: SfxId | string): void {
    const entry = this.getEntry(id);

    if (!entry) {
      console.warn(`[audio:sfx] missing asset id: ${id}`);
      return;
    }

    if (typeof Audio === 'undefined') {
      console.warn(`[audio:sfx] browser Audio API unavailable for: ${id}`);
      return;
    }

    const audio = new Audio(entry.path);

    audio.volume = resolveEffectiveVolume(
      entry.volume,
      this.settings.sfxVolume,
      this.settings,
    );

    audio.addEventListener(
      'error',
      () => {
        console.warn(`[audio:sfx] failed to load asset: ${id}`);
      },
      { once: true },
    );

    const playResult = audio.play();

    if (playResult instanceof Promise) {
      playResult.catch((error: unknown) => {
        console.warn(`[audio:sfx] failed to play asset: ${id}`, error);
      });
    }
  }

  public has(id: SfxId | string): boolean {
    return this.getEntry(id) !== undefined;
  }

  public getIds(): readonly string[] {
    return Object.keys(this.manifest);
  }

  public updateSettings(partialSettings: Partial<AudioSettings>): void {
    this.settings = mergeAudioSettings(this.settings, partialSettings);
  }

  public setVolume(volume: number): void {
    this.updateSettings({ sfxVolume: volume });
  }

  private getEntry(id: SfxId | string): SfxManifestEntry | undefined {
    return this.manifest[id];
  }
}
