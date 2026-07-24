import {
  musicManifest,
  rememberGameplayMusicTrack,
  selectGameplayMusicTrackId,
  type GameplayMusicTrackId,
  type MusicTrackId,
} from '../content/music-manifest';
import {
  defaultAudioSettings,
  mergeAudioSettings,
  resolveEffectiveVolume,
} from './audio-settings';
import type {
  AudioSettings,
  MusicManifest,
  MusicManifestEntry,
} from './types';

export interface MusicPlayOptions {
  readonly restart?: boolean;
  readonly fadeDurationMs?: number;
}

interface InternalMusicPlayOptions
  extends MusicPlayOptions {
  readonly onApproachingEnd?: () => void;
}

const defaultCrossfadeDurationMs = 2_000;
const crossfadeUpdateIntervalMs = 50;

export class MusicManager {
  private settings: AudioSettings;

  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private currentTargetVolume = 0;

  private outgoingAudio: HTMLAudioElement | null = null;

  private crossfadeIntervalId:
    ReturnType<typeof globalThis.setInterval> | null = null;

  /*
   * Incrementing this value invalidates callbacks belonging to
   * an older gameplay playlist.
   */
  private gameplayPlaylistGeneration = 0;

  /*
   * This history persists between tracks and is limited to the
   * five most recently selected gameplay songs.
   */
  private recentGameplayTrackIds:
    readonly GameplayMusicTrackId[] = [];

  public constructor(
    private readonly manifest: MusicManifest = musicManifest,
    initialSettings: AudioSettings = defaultAudioSettings,
  ) {
    this.settings = initialSettings;
  }

  /**
   * Plays a standalone music track.
   *
   * Starting standalone music cancels any active gameplay
   * playlist, but it still crossfades from the current track.
   */
  public play(
    trackId: MusicTrackId | string,
    options: MusicPlayOptions = {},
  ): void {
    this.gameplayPlaylistGeneration += 1;
    this.recentGameplayTrackIds = [];

    this.playTrack(trackId, options);
  }

  /**
   * Begins continuous gameplay music.
   *
   * Each track is selected randomly. Tracks heard during the
   * previous five selections are excluded from the next choice.
   */
  public playGameplayPlaylist(
    fadeDurationMs = defaultCrossfadeDurationMs,
  ): void {
    this.gameplayPlaylistGeneration += 1;
    this.recentGameplayTrackIds = [];

    const playlistGeneration =
      this.gameplayPlaylistGeneration;

    this.playNextGameplayTrack(
      playlistGeneration,
      normalizeFadeDuration(fadeDurationMs),
    );
  }

  /**
   * Stops all current music and invalidates any playlist
   * callbacks that could otherwise start another track.
   */
  public stop(): void {
    this.gameplayPlaylistGeneration += 1;
    this.recentGameplayTrackIds = [];

    this.cancelCrossfade(true);

    if (this.currentAudio) {
      this.disposeAudio(this.currentAudio);
    }

    this.currentAudio = null;
    this.currentTrackId = null;
    this.currentTargetVolume = 0;
  }

  public pause(): void {
    this.currentAudio?.pause();
    this.outgoingAudio?.pause();
  }

  public resume(): void {
    if (
      !this.currentAudio
      || !this.currentTrackId
    ) {
      return;
    }

    const playResult = this.currentAudio.play();

    playResult.catch((error: unknown) => {
      console.warn(
        `[audio:music] failed to resume asset: ${this.currentTrackId}`,
        error,
      );
    });
  }

  public setVolume(volume: number): void {
    this.updateSettings({
      musicVolume: volume,
    });
  }

  public updateSettings(
    partialSettings: Partial<AudioSettings>,
  ): void {
    this.settings = mergeAudioSettings(
      this.settings,
      partialSettings,
    );

    if (
      !this.currentAudio
      || !this.currentTrackId
    ) {
      return;
    }

    const entry = this.getEntry(
      this.currentTrackId,
    );

    if (!entry) {
      return;
    }

    this.currentTargetVolume =
      this.getEntryVolume(entry);

    /*
     * During a crossfade, the transition timer applies the
     * current target volume to the incoming track.
     */
    if (this.crossfadeIntervalId === null) {
      this.currentAudio.volume =
        this.currentTargetVolume;
    }
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public has(
    trackId: MusicTrackId | string,
  ): boolean {
    return this.getEntry(trackId) !== undefined;
  }

  public getIds(): readonly string[] {
    return Object.keys(this.manifest);
  }

  /**
   * Chooses, remembers, and starts the next gameplay song.
   */
  private playNextGameplayTrack(
    playlistGeneration: number,
    fadeDurationMs: number,
  ): void {
    if (
      playlistGeneration
      !== this.gameplayPlaylistGeneration
    ) {
      return;
    }

    const nextTrackId =
      selectGameplayMusicTrackId(
        this.recentGameplayTrackIds,
      );

    this.recentGameplayTrackIds =
      rememberGameplayMusicTrack(
        this.recentGameplayTrackIds,
        nextTrackId,
      );

    this.playTrack(nextTrackId, {
      restart: true,
      fadeDurationMs,

      onApproachingEnd: () => {
        this.playNextGameplayTrack(
          playlistGeneration,
          fadeDurationMs,
        );
      },
    });
  }

  /**
   * Plays one track without automatically cancelling playlist
   * state. Public standalone playback calls this after cancelling
   * the playlist; playlist advancement calls it directly.
   */
  private playTrack(
    trackId: MusicTrackId | string,
    options: InternalMusicPlayOptions = {},
  ): void {
    const entry = this.getEntry(trackId);

    if (!entry) {
      console.warn(
        `[audio:music] missing asset id: ${trackId}`,
      );
      return;
    }

    if (
      !options.restart
      && this.currentTrackId === trackId
    ) {
      return;
    }

    if (typeof Audio === 'undefined') {
      console.warn(
        `[audio:music] browser Audio API unavailable for: ${trackId}`,
      );
      return;
    }

    /*
     * If another crossfade was still running, dispose its oldest
     * outgoing track. The currently active incoming track remains
     * available to become the outgoing side of this transition.
     */
    this.cancelCrossfade(true);

    const previousAudio =
      this.currentAudio;

    const previousTrackId =
      this.currentTrackId;

    const previousTargetVolume =
      this.currentTargetVolume;

    const audio = new Audio(entry.path);

    const targetVolume =
      this.getEntryVolume(entry);

    const fadeDurationMs =
      normalizeFadeDuration(
        options.fadeDurationMs
        ?? defaultCrossfadeDurationMs,
      );

    audio.loop = entry.loop;

    /*
     * With no previous song, begin at normal volume. Otherwise
     * begin silently and let the crossfade raise the volume.
     */
    audio.volume = previousAudio
      ? 0
      : targetVolume;

    audio.addEventListener(
      'error',
      () => {
        console.warn(
          `[audio:music] failed to load asset: ${trackId}`,
        );
      },
      { once: true },
    );

    if (
      !entry.loop
      && options.onApproachingEnd
    ) {
      this.bindApproachingEnd(
        audio,
        fadeDurationMs,
        options.onApproachingEnd,
      );
    }

    this.currentAudio = audio;
    this.currentTrackId = trackId;
    this.currentTargetVolume = targetVolume;

    const beginTransition = (): void => {
      /*
       * Another track may have replaced this one before its
       * playback promise resolved.
       */
      if (this.currentAudio !== audio) {
        this.disposeAudio(audio);
        return;
      }

      if (!previousAudio) {
        audio.volume =
          this.currentTargetVolume;

        return;
      }

      this.startCrossfade(
        previousAudio,
        audio,
        fadeDurationMs,
      );
    };

    const playResult = audio.play();

    playResult
      .then(beginTransition)
      .catch((error: unknown) => {
        console.warn(
          `[audio:music] failed to play asset: ${trackId}`,
          error,
        );

        this.disposeAudio(audio);

        if (this.currentAudio === audio) {
          this.currentAudio =
            previousAudio;

          this.currentTrackId =
            previousTrackId;

          this.currentTargetVolume =
            previousTargetVolume;
        }

        /*
         * If this was a gameplay playlist track, try another
         * selection rather than leaving gameplay silent.
         */
        options.onApproachingEnd?.();
      });
  }

  /**
   * Calls the supplied callback when a non-looping track reaches
   * the beginning of its crossfade window.
   */
  private bindApproachingEnd(
    audio: HTMLAudioElement,
    fadeDurationMs: number,
    onApproachingEnd: () => void,
  ): void {
    let hasAdvanced = false;

    const cleanup = (): void => {
      audio.removeEventListener(
        'timeupdate',
        handleTimeUpdate,
      );

      audio.removeEventListener(
        'loadedmetadata',
        handleTimeUpdate,
      );

      audio.removeEventListener(
        'ended',
        advanceOnce,
      );
    };

    const advanceOnce = (): void => {
      if (hasAdvanced) {
        return;
      }

      hasAdvanced = true;
      cleanup();
      onApproachingEnd();
    };

    const handleTimeUpdate = (): void => {
      if (
        !Number.isFinite(audio.duration)
        || audio.duration <= 0
      ) {
        return;
      }

      const remainingDurationMs =
        Math.max(
          0,
          audio.duration - audio.currentTime,
        ) * 1_000;

      if (
        remainingDurationMs
        <= fadeDurationMs
      ) {
        advanceOnce();
      }
    };

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate,
    );

    /*
     * This also handles unusually short tracks whose total
     * duration is shorter than the requested crossfade.
     */
    audio.addEventListener(
      'loadedmetadata',
      handleTimeUpdate,
    );

    /*
     * Fallback if the browser does not emit a sufficiently
     * precise timeupdate event near the ending.
     */
    audio.addEventListener(
      'ended',
      advanceOnce,
      { once: true },
    );
  }

  private startCrossfade(
    outgoingAudio: HTMLAudioElement,
    incomingAudio: HTMLAudioElement,
    fadeDurationMs: number,
  ): void {
    if (fadeDurationMs === 0) {
      this.disposeAudio(outgoingAudio);

      incomingAudio.volume =
        this.currentTargetVolume;

      return;
    }

    this.outgoingAudio =
      outgoingAudio;

    const outgoingStartVolume =
      outgoingAudio.volume;

    const transitionStartTime =
      getCurrentTimestamp();

    const updateCrossfade = (): void => {
      /*
       * Stop this transition if another track has already
       * replaced the incoming track.
       */
      if (
        this.currentAudio
        !== incomingAudio
      ) {
        this.cancelCrossfade(true);
        return;
      }

      const elapsedTime =
        getCurrentTimestamp()
        - transitionStartTime;

      const progress = Math.min(
        1,
        Math.max(
          0,
          elapsedTime / fadeDurationMs,
        ),
      );

      outgoingAudio.volume =
        outgoingStartVolume
        * (1 - progress);

      incomingAudio.volume =
        this.currentTargetVolume
        * progress;

      if (progress < 1) {
        return;
      }

      this.cancelCrossfade(true);

      incomingAudio.volume =
        this.currentTargetVolume;
    };

    updateCrossfade();

    if (this.outgoingAudio !== outgoingAudio) {
      return;
    }

    this.crossfadeIntervalId =
      globalThis.setInterval(
        updateCrossfade,
        crossfadeUpdateIntervalMs,
      );
  }

  /**
   * Cancels the active transition.
   *
   * The outgoing track is normally disposed because it is no
   * longer the current active music track.
   */
  private cancelCrossfade(
    disposeOutgoingAudio: boolean,
  ): void {
    if (
      this.crossfadeIntervalId
      !== null
    ) {
      globalThis.clearInterval(
        this.crossfadeIntervalId,
      );

      this.crossfadeIntervalId = null;
    }

    if (
      disposeOutgoingAudio
      && this.outgoingAudio
    ) {
      this.disposeAudio(
        this.outgoingAudio,
      );
    }

    this.outgoingAudio = null;
  }

  private disposeAudio(
    audio: HTMLAudioElement,
  ): void {
    audio.pause();

    try {
      audio.currentTime = 0;
    } catch {
      /*
       * Some browsers reject currentTime changes when an audio
       * element never loaded successfully.
       */
    }

    audio.removeAttribute('src');
    audio.load();
  }

  private getEntryVolume(
    entry: MusicManifestEntry,
  ): number {
    return resolveEffectiveVolume(
      entry.volume,
      this.settings.musicVolume,
      this.settings,
    );
  }

  private getEntry(
    trackId: MusicTrackId | string,
  ): MusicManifestEntry | undefined {
    return this.manifest[trackId];
  }
}

function normalizeFadeDuration(
  durationMs: number,
): number {
  if (!Number.isFinite(durationMs)) {
    return defaultCrossfadeDurationMs;
  }

  return Math.max(0, durationMs);
}

function getCurrentTimestamp(): number {
  return globalThis.performance?.now()
    ?? Date.now();
}