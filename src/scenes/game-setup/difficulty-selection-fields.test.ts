import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  defaultGameDifficultyId,
  gameDifficultyIds,
} from '../../game/difficulty';
import {
  availableGameDifficultyIds,
  isGameDifficultyAvailable,
  normalizeAvailableDifficultyId,
  unavailableDifficultyMessage,
} from './difficulty-selection-fields';

describe(
  'difficulty selection availability',
  () => {
    it(
      'makes only the 13-week difficulty available',
      () => {
        expect(
          availableGameDifficultyIds,
        ).toEqual([
          'easy',
        ]);

        expect(
          gameDifficultyIds.filter(
            isGameDifficultyAvailable,
          ),
        ).toEqual([
          'easy',
        ]);
      },
    );

    it.each([
      'moderate',
      'hardliner',
      'far-gone',
    ] as const)(
      'disables %s until a future update',
      (
        difficultyId,
      ) => {
        expect(
          isGameDifficultyAvailable(
            difficultyId,
          ),
        ).toBe(false);
      },
    );

    it(
      'keeps the default difficulty available',
      () => {
        expect(
          isGameDifficultyAvailable(
            defaultGameDifficultyId,
          ),
        ).toBe(true);
      },
    );

    it.each([
      'moderate',
      'hardliner',
      'far-gone',
    ] as const)(
      'normalizes unavailable difficulty %s to Easy',
      (
        difficultyId,
      ) => {
        expect(
          normalizeAvailableDifficultyId(
            difficultyId,
          ),
        ).toBe(
          defaultGameDifficultyId,
        );
      },
    );

    it(
      'preserves the requested available difficulty',
      () => {
        expect(
          normalizeAvailableDifficultyId(
            'easy',
          ),
        ).toBe(
          'easy',
        );
      },
    );

    it(
      'uses the requested development-time explanation',
      () => {
        expect(
          unavailableDifficultyMessage,
        ).toBe(
          'sorry, this one needs more dev time! maybe in a future update!',
        );
      },
    );
  },
);