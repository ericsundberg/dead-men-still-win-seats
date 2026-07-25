import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  createStartedGameSession,
  standardTurnCommand,
} from '../test/game-session-fixtures';
import {
  loadTestLocalization,
} from '../test/test-localization';
import {
  primeCharacterHealth,
} from './character-health';
import {
  defaultCharacterHealth,
} from './game-character';
import {
  createGameSession,
} from './game-session';

describe(
  'GameSession turns',
  () => {
    beforeEach(
      loadTestLocalization,
    );

    it(
      'creates a suggested opening turn command',
      () => {
        const gameSession =
          createStartedGameSession();

        expect(
          defaultCharacterHealth,
        ).toBe(
          primeCharacterHealth,
        );

        expect(
          gameSession
            .getSuggestedTurnCommand(),
        ).toEqual({
          acresToBuy:
            0,

          acresToSell:
            0,

          grainToFeed:
            2_800,

          acresToPlant:
            0,
        });
      },
    );

    it(
      'processes a turn and advances the game',
      () => {
        const gameSession =
          createStartedGameSession();

        const outcome =
          gameSession.processTurn(
            standardTurnCommand,
          );

        expect(
          outcome?.nextState.year,
        ).toBe(2);

        expect(
          gameSession
            .getState()
            ?.year,
        ).toBe(2);

        expect(
          gameSession
            .getLastOutcome(),
        ).toBe(
          outcome,
        );

        expect(
          gameSession.getStatus(),
        ).toBe(
          'active',
        );

        expect(
          gameSession
            .getRulerAge(),
        ).toBe(26);

        expect(
          gameSession
            .getRulerReignYear(),
        ).toBe(2);

        expect(
          gameSession
            .getRulerHealth(),
        ).toBe(5);
      },
    );

    it(
      'applies natural health decline when the roll succeeds',
      () => {
        const gameSession =
          createStartedGameSession({
            random:
              () => 0,
          });

        gameSession.processTurn(
          standardTurnCommand,
        );

        expect(
          gameSession
            .getRulerAge(),
        ).toBe(26);

        expect(
          gameSession
            .getRulerHealth(),
        ).toBe(4.9);
      },
    );

    it(
      'does not apply natural health decline when the roll fails',
      () => {
        const gameSession =
          createStartedGameSession({
            random:
              () => 0.99,
          });

        gameSession.processTurn(
          standardTurnCommand,
        );

        expect(
          gameSession
            .getRulerAge(),
        ).toBe(26);

        expect(
          gameSession
            .getRulerHealth(),
        ).toBe(5);
      },
    );

    it(
      'returns null when processing a turn before the game starts',
      () => {
        const gameSession =
          createGameSession();

        expect(
          gameSession.processTurn(
            standardTurnCommand,
          ),
        ).toBeNull();
      },
    );
  },
);