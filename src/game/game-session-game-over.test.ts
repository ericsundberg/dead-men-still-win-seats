import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  defaultGameConfig,
} from '../content/default-game-config';
import {
  populationCollapseTurnCommand,
} from '../test/game-session-fixtures';
import {
  loadTestLocalization,
} from '../test/test-localization';
import {
  GameSession,
} from './game-session';

function createCollapsibleGameSession():
  GameSession {
  const gameSession =
    new GameSession({
      ...defaultGameConfig,

      startingPopulation:
        100,

      minimumPopulation:
        0,
    });

  gameSession.startNewGame();

  return gameSession;
}

describe(
  'GameSession game over',
  () => {
    beforeEach(
      loadTestLocalization,
    );

    it(
      'ends an unprotected legacy game when population reaches zero',
      () => {
        const gameSession =
          createCollapsibleGameSession();

        const outcome =
          gameSession.processTurn(
            populationCollapseTurnCommand,
          );

        expect(
          outcome?.nextState
            .population,
        ).toBe(0);

        expect(
          gameSession.getStatus(),
        ).toBe('ended');

        expect(
          gameSession.isGameOver(),
        ).toBe(true);

        expect(
          gameSession
            .getGameOverState(),
        ).toEqual({
          reason:
            'population-collapse',

          title:
            'Dynasty Collapsed',

          message:
            [
              'There are no people left to rule.',
              'Your reign has ended.',
            ].join(' '),
        });

        expect(
          gameSession
            .getSuggestedTurnCommand(),
        ).toBeNull();
      },
    );

    it(
      'does not process turns after an unprotected legacy game ends',
      () => {
        const gameSession =
          createCollapsibleGameSession();

        gameSession.processTurn(
          populationCollapseTurnCommand,
        );

        const stateAfterGameOver =
          gameSession.getState();

        expect(
          gameSession.processTurn(
            populationCollapseTurnCommand,
          ),
        ).toBeNull();

        expect(
          gameSession.getState(),
        ).toEqual(
          stateAfterGameOver,
        );
      },
    );
  },
);