import {
  musicManifest,
  type MusicTrackId,
} from '../content/music-manifest';
import {
  defaultAudioSettings,
  mergeAudioSettings,
  resolveEffectiveVolume,
} from './audio-settings';
import {
  GameplayMusicPlaylist,
} from './gameplay-music-playlist';
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

export interface MusicPlaybackState {
  readonly trackId: string | null;
  readonly trackLabel: string | null;
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
}

export type MusicPlaybackListener = (
  state: MusicPlaybackState,
) => void;

export type MusicTrackLoopListener = (
  trackId: string,
) => void;

const defaultCrossfadeDurationMs = 2_000;
const crossfadeUpdateIntervalMs = 50;

export class MusicManager {
  private settings: AudioSettings;

  private currentAudio:
    HTMLAudioElement | null = null;

  private currentTrackId:
    string | null = null;

  private currentTargetVolume = 0;

  private outgoingAudio:
    HTMLAudioElement | null = null;

  private crossfadeIntervalId:
    ReturnType<
      typeof globalThis.setInterval
    > | null = null;

  private readonly playbackListeners =
    new Set<MusicPlaybackListener>();

  private readonly trackLoopListeners =
    new Set<MusicTrackLoopListener>();

  private readonly loopingAudioCleanup =
    new WeakMap<
      HTMLAudioElement,
      () => void
    >();

  public constructor(
    private readonly manifest:
      MusicManifest = musicManifest,

    initialSettings:
      AudioSettings = defaultAudioSettings,

    private readonly gameplayPlaylist =
      new GameplayMusicPlaylist(),
  ) {
    this.settings = initialSettings;
  }

  /**
   * Plays one standalone music track.
   *
   * Standalone playback cancels the gameplay playlist, while
   * still allowing the new track to crossfade from the current
   * gameplay song.
   */
  public play(
    trackId: MusicTrackId | string,
    options: MusicPlayOptions = {},
  ): void {
    this.gameplayPlaylist.stop();

    this.playTrack(
      trackId,
      options,
    );
  }

  /**
   * Starts a continuous randomized gameplay playlist.
   *
   * Songs played during the previous five selections are
   * excluded from the next random choice.
   */
  public playGameplayPlaylist(
    fadeDurationMs =
      defaultCrossfadeDurationMs,
  ): void {
    const normalizedFadeDuration =
      normalizeFadeDuration(
        fadeDurationMs,
      );

    const playlistGeneration =
      this.gameplayPlaylist.start(
        normalizedFadeDuration,
      );

    this.playNextGameplayTrack(
      playlistGeneration,
      normalizedFadeDuration,
    );
  }

  /**
   * Skips directly to another randomly selected eligible
   * gameplay song.
   */
  public skipGameplayTrack(): boolean {
    if (
      !this.gameplayPlaylist
        .getIsActive()
    ) {
      return false;
    }

    this.playNextGameplayTrack(
      this.gameplayPlaylist
        .getGeneration(),

      this.gameplayPlaylist
        .getFadeDurationMs(),
    );

    return true;
  }

  /**
   * Stops all current music and prevents an old playlist
   * callback from starting another song.
   */
  public stop(): void {
    this.gameplayPlaylist.stop();
    this.cancelCrossfade(true);

    if (this.currentAudio) {
      this.disposeAudio(
        this.currentAudio,
      );
    }

    this.currentAudio = null;
    this.currentTrackId = null;
    this.currentTargetVolume = 0;

    this.notifyPlaybackStateChanged();
  }

  public pause(): void {
    this.currentAudio?.pause();
    this.outgoingAudio?.pause();

    this.notifyPlaybackStateChanged();
  }

  public resume(): void {
    if (
      !this.currentAudio
      || !this.currentTrackId
    ) {
      return;
    }

    const audio = this.currentAudio;
    const trackId = this.currentTrackId;

    audio.play()
      .then(() => {
        if (
          this.currentAudio
          !== audio
        ) {
          return;
        }

        this.notifyPlaybackStateChanged();
      })
      .catch(
        (error: unknown) => {
          console.warn(
            `[audio:music] failed to resume asset: ${trackId}`,
            error,
          );

          this.notifyPlaybackStateChanged();
        },
      );
  }

  /**
   * Restarts the current song from the beginning.
   *
   * Restarting a paused song also resumes it.
   */
  public restartCurrentTrack(): boolean {
    if (!this.currentAudio) {
      return false;
    }

    try {
      this.currentAudio.currentTime = 0;
    } catch (error) {
      console.warn(
        '[audio:music] failed to restart current track',
        error,
      );

      return false;
    }

    if (this.currentAudio.paused) {
      this.resume();
    } else {
      this.notifyPlaybackStateChanged();
    }

    return true;
  }

  /**
   * Toggles the current pause state.
   *
   * Returns the new paused state.
   */
  public togglePause(): boolean {
    if (!this.currentAudio) {
      return true;
    }

    if (this.currentAudio.paused) {
      this.resume();
      return false;
    }

    this.pause();
    return true;
  }

  public setVolume(
    volume: number,
  ): void {
    this.updateSettings({
      musicVolume: volume,
    });
  }

  public updateSettings(
    partialSettings:
      Partial<AudioSettings>,
  ): void {
    this.settings =
      mergeAudioSettings(
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
     * The crossfade timer updates the incoming volume while a
     * transition is active. Outside a transition, update the
     * audio element immediately.
     */
    if (
      this.crossfadeIntervalId
      === null
    ) {
      this.currentAudio.volume =
        this.currentTargetVolume;
    }
  }

  public getCurrentTrackId():
    string | null {
    return this.currentTrackId;
  }

  public getCurrentTrackLabel():
    string | null {
    if (!this.currentTrackId) {
      return null;
    }

    return this.getEntry(
      this.currentTrackId,
    )?.label ?? null;
  }

  public getIsPaused(): boolean {
    return (
      this.currentAudio?.paused
      ?? true
    );
  }

  public getPlaybackState():
    MusicPlaybackState {
    const isPaused =
      this.getIsPaused();

    return {
      trackId:
        this.currentTrackId,

      trackLabel:
        this.getCurrentTrackLabel(),

      isPlaying:
        this.currentAudio !== null
        && !isPaused,

      isPaused,
    };
  }

  /**
   * Allows the future campaign HUD to update immediately when
   * playback changes, rather than polling the manager.
   */
  public subscribe(
    listener: MusicPlaybackListener,
  ): () => void {
    this.playbackListeners.add(
      listener,
    );

    listener(
      this.getPlaybackState(),
    );

    return () => {
      this.playbackListeners.delete(
        listener,
      );
    };
  }

  /**
   * Subscribes to completed loops of standalone looping tracks.
   *
   * The callback receives the ID of the track that completed a
   * full playback cycle.
   */
  public subscribeTrackLoops(
    listener:
      MusicTrackLoopListener,
  ): () => void {
    this.trackLoopListeners.add(
      listener,
    );

    return () => {
      this.trackLoopListeners.delete(
        listener,
      );
    };
  }

  public has(
    trackId: MusicTrackId | string,
  ): boolean {
    return (
      this.getEntry(trackId)
      !== undefined
    );
  }

  public getIds():
    readonly string[] {
    return Object.keys(
      this.manifest,
    );
  }

  /**
   * Chooses, remembers, and starts the next gameplay song.
   */
  private playNextGameplayTrack(
    playlistGeneration: number,
    fadeDurationMs: number,
  ): void {
    if (
      !this.gameplayPlaylist
        .isCurrentGeneration(
          playlistGeneration,
        )
    ) {
      return;
    }

    const nextTrackId =
      this.gameplayPlaylist
        .selectNextTrackId();

    this.playTrack(
      nextTrackId,
      {
        restart: true,
        fadeDurationMs,

        onApproachingEnd: () => {
          this.playNextGameplayTrack(
            playlistGeneration,
            fadeDurationMs,
          );
        },
      },
    );
  }

  /**
   * Plays one track without automatically cancelling the
   * gameplay playlist.
   *
   * Public standalone playback cancels the playlist before
   * calling this method. Playlist advancement calls it directly.
   */
  private playTrack(
    trackId:
      MusicTrackId | string,

    options:
      InternalMusicPlayOptions = {},
  ): void {
    const entry =
      this.getEntry(trackId);

    if (!entry) {
      console.warn(
        `[audio:music] missing asset id: ${trackId}`,
      );

      return;
    }

    if (
      !options.restart
      && this.currentTrackId
        === trackId
    ) {
      return;
    }

    if (
      typeof Audio
      === 'undefined'
    ) {
      console.warn(
        `[audio:music] browser Audio API unavailable for: ${trackId}`,
      );

      return;
    }

    /*
     * Dispose the oldest outgoing track if another crossfade
     * was still active. The current incoming track remains
     * available to become this transition's outgoing track.
     */
    this.cancelCrossfade(true);

    const previousAudio =
      this.currentAudio;

    const previousTrackId =
      this.currentTrackId;

    const previousTargetVolume =
      this.currentTargetVolume;

    const audio =
      new Audio(entry.path);

    const targetVolume =
      this.getEntryVolume(entry);

    const fadeDurationMs =
      normalizeFadeDuration(
        options.fadeDurationMs
        ?? defaultCrossfadeDurationMs,
      );

    /*
     * Looping tracks are restarted from their ended event rather
     * than using the native loop flag. This gives the game an exact
     * notification for every completed playback cycle.
     */
    audio.loop =
      false;

    if (entry.loop) {
      this.bindLoopingTrack(
        audio,
        trackId,
      );
    }

    /*
     * The first song starts at its target volume. Replacement
     * songs start silently and are raised by the crossfade.
     */
    audio.volume =
      previousAudio
        ? 0
        : targetVolume;

    audio.addEventListener(
      'error',
      () => {
        console.warn(
          `[audio:music] failed to load asset: ${trackId}`,
        );
      },
      {
        once: true,
      },
    );

    const onApproachingEnd =
      options.onApproachingEnd;

    if (
      !entry.loop
      && onApproachingEnd
    ) {
      this.bindApproachingEnd(
        audio,
        fadeDurationMs,
        () => {
          /*
           * A manually skipped song may still exist as the
           * outgoing side of a crossfade. It must not advance
           * the playlist after it stops being the active track.
           */
          if (
            this.currentAudio
            !== audio
          ) {
            return;
          }

          onApproachingEnd();
        },
      );
    }

    this.currentAudio = audio;
    this.currentTrackId = trackId;
    this.currentTargetVolume =
      targetVolume;

    const beginTransition =
      (): void => {
        /*
         * Another song may have replaced this one before its
         * play promise resolved.
         */
        if (
          this.currentAudio
          !== audio
        ) {
          this.disposeAudio(audio);
          return;
        }

        if (!previousAudio) {
          audio.volume =
            this.currentTargetVolume;
        } else {
          this.startCrossfade(
            previousAudio,
            audio,
            fadeDurationMs,
          );
        }

        this.notifyPlaybackStateChanged();
      };

    audio.play()
      .then(beginTransition)
      .catch(
        (error: unknown) => {
          console.warn(
            `[audio:music] failed to play asset: ${trackId}`,
            error,
          );

          this.disposeAudio(audio);

          if (
            this.currentAudio
            === audio
          ) {
            this.currentAudio =
              previousAudio;

            this.currentTrackId =
              previousTrackId;

            this.currentTargetVolume =
              previousTargetVolume;
          }

          /*
           * Do not automatically select another song here.
           * Doing so would create a rapid recursive failure loop
           * when the server or media assets are unavailable.
           */
          this.notifyPlaybackStateChanged();
        },
      );
  }

  /**
   * Restarts a looping track after each complete playback cycle
   * and informs any loop subscribers.
   */
  private bindLoopingTrack(
    audio:
      HTMLAudioElement,

    trackId:
      string,
  ): void {
    const handleEnded =
      (): void => {
        if (
          this.currentAudio
            !== audio
          || this.currentTrackId
            !== trackId
        ) {
          return;
        }

        this.notifyTrackLoopCompleted(
          trackId,
        );

        /*
         * A loop listener may stop the track or navigate away.
         * Do not restart audio after that state change.
         */
        if (
          this.currentAudio
            !== audio
          || this.currentTrackId
            !== trackId
        ) {
          return;
        }

        try {
          audio.currentTime =
            0;
        } catch {
          /*
           * Some browsers reject currentTime changes while media
           * state is changing. Calling play remains a safe fallback.
           */
        }

        audio.play()
          .then(
            () => {
              if (
                this.currentAudio
                  === audio
              ) {
                this.notifyPlaybackStateChanged();
              }
            },
          )
          .catch(
            (
              error:
                unknown,
            ) => {
              if (
                this.currentAudio
                  !== audio
              ) {
                return;
              }

              console.warn(
                [
                  '[audio:music]',
                  'failed to restart looping asset:',
                  trackId,
                ].join(' '),
                error,
              );

              this.notifyPlaybackStateChanged();
            },
          );
      };

    audio.addEventListener(
      'ended',
      handleEnded,
    );

    this.loopingAudioCleanup.set(
      audio,
      () => {
        audio.removeEventListener(
          'ended',
          handleEnded,
        );
      },
    );
  }

  /**
   * Calls the supplied callback when a non-looping track enters
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

    const advanceOnce =
      (): void => {
        if (hasAdvanced) {
          return;
        }

        hasAdvanced = true;
        cleanup();
        onApproachingEnd();
      };

    const handleTimeUpdate =
      (): void => {
        if (
          !Number.isFinite(
            audio.duration,
          )
          || audio.duration <= 0
        ) {
          return;
        }

        const remainingDurationMs =
          Math.max(
            0,
            audio.duration
              - audio.currentTime,
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
     * Also handles tracks whose total duration is shorter
     * than the requested crossfade window.
     */
    audio.addEventListener(
      'loadedmetadata',
      handleTimeUpdate,
    );

    /*
     * Fallback if the browser misses the final useful
     * timeupdate event.
     */
    audio.addEventListener(
      'ended',
      advanceOnce,
      {
        once: true,
      },
    );
  }

  private startCrossfade(
    outgoingAudio:
      HTMLAudioElement,

    incomingAudio:
      HTMLAudioElement,

    fadeDurationMs: number,
  ): void {
    if (fadeDurationMs === 0) {
      this.disposeAudio(
        outgoingAudio,
      );

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

    const updateCrossfade =
      (): void => {
        /*
         * Stop the transition if another song has already
         * replaced the incoming track.
         */
        if (
          this.currentAudio
          !== incomingAudio
        ) {
          this.cancelCrossfade(
            true,
          );

          return;
        }

        const elapsedTime =
          getCurrentTimestamp()
          - transitionStartTime;

        const progress =
          Math.min(
            1,
            Math.max(
              0,
              elapsedTime
                / fadeDurationMs,
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

        this.notifyPlaybackStateChanged();
      };

    updateCrossfade();

    if (
      this.outgoingAudio
      !== outgoingAudio
    ) {
      return;
    }

    this.crossfadeIntervalId =
      globalThis.setInterval(
        updateCrossfade,
        crossfadeUpdateIntervalMs,
      );
  }

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

      this.crossfadeIntervalId =
        null;
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
    this.loopingAudioCleanup
      .get(
        audio,
      )
      ?.();

    this.loopingAudioCleanup.delete(
      audio,
    );

    audio.pause();

    try {
      audio.currentTime = 0;
    } catch {
      /*
       * Some browsers reject currentTime changes when the
       * media element did not finish loading.
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
    trackId:
      MusicTrackId | string,
  ): MusicManifestEntry | undefined {
    return this.manifest[
      trackId
    ];
  }

  private notifyTrackLoopCompleted(
    trackId:
      string,
  ): void {
    for (
      const listener
      of this.trackLoopListeners
    ) {
      listener(
        trackId,
      );
    }
  }

  private notifyPlaybackStateChanged():
    void {
    const state =
      this.getPlaybackState();

    for (
      const listener
      of this.playbackListeners
    ) {
      listener(state);
    }
  }
}

function normalizeFadeDuration(
  durationMs: number,
): number {
  if (
    !Number.isFinite(durationMs)
  ) {
    return defaultCrossfadeDurationMs;
  }

  return Math.max(
    0,
    durationMs,
  );
}

function getCurrentTimestamp():
  number {
  return (
    globalThis.performance?.now()
    ?? Date.now()
  );
}