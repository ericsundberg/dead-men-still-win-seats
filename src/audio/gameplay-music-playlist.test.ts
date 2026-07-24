import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  GameplayMusicPlaylist,
} from './gameplay-music-playlist';

describe('GameplayMusicPlaylist', () => {
  it('starts and stops playlist generations', () => {
    const playlist =
      new GameplayMusicPlaylist();

    const generation =
      playlist.start(2_000);

    expect(
      playlist.getIsActive(),
    ).toBe(true);

    expect(
      playlist.getFadeDurationMs(),
    ).toBe(2_000);

    expect(
      playlist.isCurrentGeneration(
        generation,
      ),
    ).toBe(true);

    playlist.stop();

    expect(
      playlist.getIsActive(),
    ).toBe(false);

    expect(
      playlist.isCurrentGeneration(
        generation,
      ),
    ).toBe(false);
  });

  it('does not repeat one of the previous five tracks', () => {
    const playlist =
      new GameplayMusicPlaylist(
        () => 0,
      );

    playlist.start(2_000);

    const selectedTracks =
      Array.from(
        { length: 6 },
        () =>
          playlist.selectNextTrackId(),
      );

    expect(
      new Set(selectedTracks).size,
    ).toBe(6);
  });
});