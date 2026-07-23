import { musicManifest, type MusicTrackId } from '../content/music-manifest';
import {
  defaultAudioSettings,
  mergeAudioSettings,
  resolveEffectiveVolume,
} from './audio-settings';
import type { AudioSettings, MusicManifest, MusicManifestEntry } from './types';

export interface MusicPlayOptions {
  readonly restart?: boolean;
}

export class MusicManager {
  private settings: AudioSettings;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;

  public constructor(
    private readonly manifest: MusicManifest = musicManifest,
    initialSettings: AudioSettings = defaultAudioSettings,
  ) {
    this.settings = initialSettings;
  }

  public play(trackId: MusicTrackId | string, options: MusicPlayOptions = {}): void {
    const entry = this.getEntry(trackId);

    if (!entry) {
      console.warn(`[audio:music] missing asset id: ${trackId}`);
      return;
    }

    if (!options.restart && this.currentTrackId === trackId) {
      return;
    }

    if (typeof Audio === 'undefined') {
      console.warn(`[audio:music] browser Audio API unavailable for: ${trackId}`);
      return;
    }

    this.stop();

    const audio = new Audio(entry.path);

    audio.loop = entry.loop;
    audio.volume = resolveEffectiveVolume(
      entry.volume,
      this.settings.musicVolume,
      this.settings,
    );

    audio.addEventListener(
      'error',
      () => {
        console.warn(`[audio:music] failed to load asset: ${trackId}`);
      },
      { once: true },
    );

    this.currentAudio = audio;
    this.currentTrackId = trackId;

    const playResult = audio.play();

    if (playResult instanceof Promise) {
      playResult.catch((error: unknown) => {
        console.warn(`[audio:music] failed to play asset: ${trackId}`, error);
      });
    }
  }

  public stop(): void {
    if (!this.currentAudio) {
      this.currentTrackId = null;
      return;
    }

    this.currentAudio.pause();
    this.currentAudio.currentTime = 0;
    this.currentAudio.removeAttribute('src');
    this.currentAudio.load();

    this.currentAudio = null;
    this.currentTrackId = null;
  }

  public pause(): void {
    this.currentAudio?.pause();
  }

  public resume(): void {
    if (!this.currentAudio || !this.currentTrackId) {
      return;
    }

    const playResult = this.currentAudio.play();

    if (playResult instanceof Promise) {
      playResult.catch((error: unknown) => {
        console.warn(
          `[audio:music] failed to resume asset: ${this.currentTrackId}`,
          error,
        );
      });
    }
  }

  public setVolume(volume: number): void {
    this.updateSettings({ musicVolume: volume });
  }

  public updateSettings(partialSettings: Partial<AudioSettings>): void {
    this.settings = mergeAudioSettings(this.settings, partialSettings);

    if (this.currentAudio && this.currentTrackId) {
      const entry = this.getEntry(this.currentTrackId);

      if (entry) {
        this.currentAudio.volume = resolveEffectiveVolume(
          entry.volume,
          this.settings.musicVolume,
          this.settings,
        );
      }
    }
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public has(trackId: MusicTrackId | string): boolean {
    return this.getEntry(trackId) !== undefined;
  }

  public getIds(): readonly string[] {
    return Object.keys(this.manifest);
  }

  private getEntry(trackId: MusicTrackId | string): MusicManifestEntry | undefined {
    return this.manifest[trackId];
  }
}
