import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialTitleIdleIntroState,
  recordTitleIdleMusicLoop,
} from './title-idle-intro';

describe(
  'title idle intro',
  () => {
    it(
      'starts the intro after three completed menu-theme loops',
      () => {
        let state =
          createInitialTitleIdleIntroState();

        state =
          recordTitleIdleMusicLoop(
            state,
            'main-menu-theme',
          );

        expect(
          state,
        ).toEqual({
          completedLoops:
            1,

          shouldStartIntro:
            false,
        });

        state =
          recordTitleIdleMusicLoop(
            state,
            'main-menu-theme',
          );

        expect(
          state.shouldStartIntro,
        ).toBe(false);

        state =
          recordTitleIdleMusicLoop(
            state,
            'main-menu-theme',
          );

        expect(
          state,
        ).toEqual({
          completedLoops:
            3,

          shouldStartIntro:
            true,
        });
      },
    );

    it(
      'ignores loops from other music tracks',
      () => {
        const initialState =
          createInitialTitleIdleIntroState();

        expect(
          recordTitleIdleMusicLoop(
            initialState,
            'country-jam',
          ),
        ).toBe(
          initialState,
        );
      },
    );

    it(
      'remains triggered after reaching the loop target',
      () => {
        let state =
          createInitialTitleIdleIntroState();

        for (
          let loopNumber = 0;
          loopNumber < 3;
          loopNumber += 1
        ) {
          state =
            recordTitleIdleMusicLoop(
              state,
              'main-menu-theme',
            );
        }

        expect(
          recordTitleIdleMusicLoop(
            state,
            'main-menu-theme',
          ),
        ).toBe(
          state,
        );
      },
    );
  },
);
