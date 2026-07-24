import {
  rememberGameplayMusicTrack,
  selectGameplayMusicTrackId,
  type GameplayMusicTrackId,
} from '../content/music-manifest';

/**
 * Maintains the state used by the continuous gameplay
 * music playlist.
 *
 * Actual browser audio playback remains the responsibility
 * of MusicManager.
 */
export class GameplayMusicPlaylist {
  private generation = 0;
  private isActive = false;
  private fadeDurationMs = 0;

  private recentTrackIds:
    readonly GameplayMusicTrackId[] = [];

  public constructor(
    private readonly random: () => number = Math.random,
  ) {}

  /**
   * Starts a fresh gameplay playlist and returns its generation.
   *
   * The generation lets MusicManager reject callbacks belonging
   * to an older or cancelled playlist.
   */
  public start(
    fadeDurationMs: number,
  ): number {
    this.generation += 1;
    this.isActive = true;
    this.fadeDurationMs = fadeDurationMs;
    this.recentTrackIds = [];

    return this.generation;
  }

  /**
   * Cancels the current playlist and invalidates its callbacks.
   */
  public stop(): void {
    this.generation += 1;
    this.isActive = false;
    this.recentTrackIds = [];
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getGeneration(): number {
    return this.generation;
  }

  public getFadeDurationMs(): number {
    return this.fadeDurationMs;
  }

  public isCurrentGeneration(
    generation: number,
  ): boolean {
    return this.isActive
      && generation === this.generation;
  }

  /**
   * Selects and records the next eligible gameplay song.
   *
   * The music-manifest helpers prevent any of the previous
   * five songs from being selected.
   */
  public selectNextTrackId():
    GameplayMusicTrackId {
    const trackId =
      selectGameplayMusicTrackId(
        this.recentTrackIds,
        this.random,
      );

    this.recentTrackIds =
      rememberGameplayMusicTrack(
        this.recentTrackIds,
        trackId,
      );

    return trackId;
  }
}