import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  calculateGameViewportScale,
  gameViewportLogicalHeight,
  gameViewportLogicalWidth,
} from './game-viewport';

describe(
  'game viewport',
  () => {
    it(
      'uses a 1600 by 900 logical game surface',
      () => {
        expect(
          gameViewportLogicalWidth,
        ).toBe(
          1_600,
        );

        expect(
          gameViewportLogicalHeight,
        ).toBe(
          900,
        );
      },
    );

    it(
      'uses native scale at the logical resolution',
      () => {
        expect(
          calculateGameViewportScale(
            1_600,
            900,
          ),
        ).toBe(
          1,
        );
      },
    );

    it(
      'scales the logical surface to the itch viewport',
      () => {
        expect(
          calculateGameViewportScale(
            1_280,
            720,
          ),
        ).toBe(
          0.8,
        );
      },
    );

    it(
      'scales to the minimum 600p 16 by 9 target',
      () => {
        expect(
          calculateGameViewportScale(
            1_067,
            600,
          ),
        ).toBeCloseTo(
          2 / 3,
        );
      },
    );

    it(
      'uses the limiting dimension on non-widescreen displays',
      () => {
        expect(
          calculateGameViewportScale(
            1_024,
            768,
          ),
        ).toBe(
          0.64,
        );
      },
    );

    it(
      'allows proportional enlargement on larger displays',
      () => {
        expect(
          calculateGameViewportScale(
            1_920,
            1_080,
          ),
        ).toBe(
          1.2,
        );
      },
    );

    it(
      'uses native scale when viewport dimensions are unusable',
      () => {
        expect(
          calculateGameViewportScale(
            0,
            720,
          ),
        ).toBe(
          1,
        );

        expect(
          calculateGameViewportScale(
            Number.NaN,
            720,
          ),
        ).toBe(
          1,
        );
      },
    );
  },
);