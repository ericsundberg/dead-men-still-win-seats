import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  defaultGameConfig,
} from '../content/default-game-config';
import {
  GameEngine,
} from './game-engine';

describe(
  'GameEngine',
  () => {
    it(
      'creates a new game with the temporary migration population',
      () => {
        const engine =
          new GameEngine(
            defaultGameConfig,
            'Tester',
          );

        expect(
          engine.getState(),
        ).toEqual({
          year:
            1,

          playerName:
            'Tester',

          population:
            999_999_999,

          acres:
            1_000,

          grain:
            2_800,
        });
      },
    );

    it(
      'preserves the temporary population floor during a turn',
      () => {
        const engine =
          new GameEngine(
            defaultGameConfig,
            'Tester',
          );

        const outcome =
          engine.processTurn({
            acresToBuy:
              0,

            acresToSell:
              0,

            grainToFeed:
              2_000,

            acresToPlant:
              500,
          });

        expect(
          outcome.nextState,
        ).toEqual({
          year:
            2,

          playerName:
            'Tester',

          population:
            999_999_999,

          acres:
            1_000,

          grain:
            1_800,
        });

        expect(
          outcome.events,
        ).toContain(
          'No one starved.',
        );

        expect(
          outcome.events,
        ).toContain(
          [
            'Harvested 1500 grain',
            'from 500 planted acres.',
          ].join(' '),
        );
      },
    );
  },
);