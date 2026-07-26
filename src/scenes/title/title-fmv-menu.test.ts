import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  isCampaignEndingFmvSelection,
  titleFmvMenuItems,
} from './title-fmv-menu';

describe(
  'title FMV menu',
  () => {
    it(
      'lists the intro and all three campaign endings',
      () => {
        expect(
          titleFmvMenuItems,
        ).toEqual([
          {
            id:
              'intro',

            label:
              'Intro',
          },

          {
            id:
              'win',

            label:
              'Win Ending',
          },

          {
            id:
              'draw',

            label:
              'Draw Ending',
          },

          {
            id:
              'lose',

            label:
              'Lose Ending',
          },
        ]);
      },
    );

    it(
      'distinguishes the intro from campaign ending FMVs',
      () => {
        expect(
          isCampaignEndingFmvSelection(
            'intro',
          ),
        ).toBe(false);

        expect(
          [
            'win',
            'draw',
            'lose',
          ].every(
            (
              selectionId,
            ) =>
              isCampaignEndingFmvSelection(
                selectionId as
                  | 'win'
                  | 'draw'
                  | 'lose',
              ),
          ),
        ).toBe(true);
      },
    );
  },
);
