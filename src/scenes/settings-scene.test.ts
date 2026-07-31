import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  getSettingsTabDefinitions,
  resolveSettingsTabIndex,
} from './settings-scene';

describe(
  'settings scene tabs',
  () => {
    it(
      'defines display and audio tabs in order',
      () => {
        expect(
          getSettingsTabDefinitions(),
        ).toEqual([
          {
            id:
              'display',

            label:
              'Display',
          },

          {
            id:
              'audio',

            label:
              'Audio',
          },
        ]);
      },
    );

    it(
      'moves between adjacent tabs',
      () => {
        expect(
          resolveSettingsTabIndex(
            0,
            'ArrowRight',
            2,
          ),
        ).toBe(
          1,
        );

        expect(
          resolveSettingsTabIndex(
            1,
            'ArrowLeft',
            2,
          ),
        ).toBe(
          0,
        );
      },
    );

    it(
      'wraps around the tab list',
      () => {
        expect(
          resolveSettingsTabIndex(
            0,
            'ArrowLeft',
            2,
          ),
        ).toBe(
          1,
        );

        expect(
          resolveSettingsTabIndex(
            1,
            'ArrowRight',
            2,
          ),
        ).toBe(
          0,
        );
      },
    );

    it(
      'supports Home and End',
      () => {
        expect(
          resolveSettingsTabIndex(
            1,
            'Home',
            2,
          ),
        ).toBe(
          0,
        );

        expect(
          resolveSettingsTabIndex(
            0,
            'End',
            2,
          ),
        ).toBe(
          1,
        );
      },
    );

    it(
      'ignores unrelated keys and invalid tab lists',
      () => {
        expect(
          resolveSettingsTabIndex(
            0,
            'Enter',
            2,
          ),
        ).toBeNull();

        expect(
          resolveSettingsTabIndex(
            0,
            'ArrowRight',
            0,
          ),
        ).toBeNull();
      },
    );
  },
);