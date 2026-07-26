import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  MusicManager,
} from './music-manager';

class FakeAudio
  extends EventTarget {
  public static instances:
    FakeAudio[] = [];

  public loop =
    false;

  public volume =
    1;

  public currentTime =
    0;

  public duration =
    60;

  public paused =
    true;

  public readonly play =
    vi.fn(
      async () => {
        this.paused =
          false;
      },
    );

  public readonly pause =
    vi.fn(
      () => {
        this.paused =
          true;
      },
    );

  public readonly load =
    vi.fn();

  public constructor(
    public src:
      string,
  ) {
    super();

    FakeAudio.instances.push(
      this,
    );
  }

  public removeAttribute(
    attributeName:
      string,
  ): void {
    if (
      attributeName
      === 'src'
    ) {
      this.src =
        '';
    }
  }
}

afterEach(
  () => {
    FakeAudio.instances =
      [];

    vi.unstubAllGlobals();
  },
);

describe(
  'music manager looping tracks',
  () => {
    it(
      'reports and restarts each completed loop',
      async () => {
        vi.stubGlobal(
          'Audio',
          FakeAudio,
        );

        const manager =
          new MusicManager();

        const loopListener =
          vi.fn();

        manager.subscribeTrackLoops(
          loopListener,
        );

        manager.play(
          'main-menu-theme',
        );

        await Promise.resolve();

        const audio =
          FakeAudio.instances[0];

        expect(
          audio,
        ).toBeDefined();

        expect(
          audio.loop,
        ).toBe(false);

        audio.dispatchEvent(
          new Event(
            'ended',
          ),
        );

        await Promise.resolve();

        expect(
          loopListener,
        ).toHaveBeenCalledOnce();

        expect(
          loopListener,
        ).toHaveBeenCalledWith(
          'main-menu-theme',
        );

        expect(
          audio.currentTime,
        ).toBe(0);

        expect(
          audio.play,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );

    it(
      'removes loop handling when the track is stopped',
      async () => {
        vi.stubGlobal(
          'Audio',
          FakeAudio,
        );

        const manager =
          new MusicManager();

        const loopListener =
          vi.fn();

        manager.subscribeTrackLoops(
          loopListener,
        );

        manager.play(
          'main-menu-theme',
        );

        await Promise.resolve();

        const audio =
          FakeAudio.instances[0];

        manager.stop();

        audio.dispatchEvent(
          new Event(
            'ended',
          ),
        );

        await Promise.resolve();

        expect(
          loopListener,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
