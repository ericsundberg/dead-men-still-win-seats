import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  TurnCommand,
  TurnOutcome,
} from '../../core/types';
import {
  createInitialCampaignState,
} from '../../game/campaign/campaign-state';
import {
  processSynchronizedTurn,
} from './yearly-command-form';

const testCommand:
  TurnCommand = {
    acresToBuy: 0,
    acresToSell: 0,
    grainToFeed: 2_000,
    acresToPlant: 500,
  };

function createTestTurnOutcome():
  TurnOutcome {
  return {
    previousState: {
      year: 1,
      playerName:
        'Test Campaign',
      population: 100,
      acres: 1_000,
      grain: 2_800,
    },

    command:
      testCommand,

    nextState: {
      year: 2,
      playerName:
        'Test Campaign',
      population: 100,
      acres: 1_000,
      grain: 1_800,
    },

    events: [
      'No one starved.',
    ],
  };
}

describe(
  'yearly command form runtime synchronization',
  () => {
    it(
      'advances both runtimes when the legacy turn succeeds',
      () => {
        const gameOutcome =
          createTestTurnOutcome();

        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          currentTurn:
            2,

          phase:
            'player-actions' as const,
        };

        const gameSession = {
          processTurn:
            vi.fn()
              .mockReturnValue(
                gameOutcome,
              ),
        };

        const campaignSession = {
          endTurn:
            vi.fn()
              .mockReturnValue(
                campaignState,
              ),
        };

        const result =
          processSynchronizedTurn(
            gameSession,
            campaignSession,
            testCommand,
          );

        expect(
          gameSession.processTurn,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          gameSession.processTurn,
        ).toHaveBeenCalledWith(
          testCommand,
        );

        expect(
          campaignSession.endTurn,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          result,
        ).toEqual({
          gameOutcome,
          campaignState,
        });
      },
    );

    it(
      'does not advance the campaign when the legacy turn fails',
      () => {
        const gameSession = {
          processTurn:
            vi.fn()
              .mockReturnValue(
                null,
              ),
        };

        const campaignSession = {
          endTurn:
            vi.fn(),
        };

        const result =
          processSynchronizedTurn(
            gameSession,
            campaignSession,
            testCommand,
          );

        expect(
          gameSession.processTurn,
        ).toHaveBeenCalledWith(
          testCommand,
        );

        expect(
          campaignSession.endTurn,
        ).not.toHaveBeenCalled();

        expect(
          result,
        ).toEqual({
          gameOutcome:
            null,

          campaignState:
            null,
        });
      },
    );

    it(
      'reports when the campaign runtime cannot advance',
      () => {
        const gameOutcome =
          createTestTurnOutcome();

        const gameSession = {
          processTurn:
            vi.fn()
              .mockReturnValue(
                gameOutcome,
              ),
        };

        const campaignSession = {
          endTurn:
            vi.fn()
              .mockReturnValue(
                null,
              ),
        };

        const result =
          processSynchronizedTurn(
            gameSession,
            campaignSession,
            testCommand,
          );

        expect(
          campaignSession.endTurn,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          result,
        ).toEqual({
          gameOutcome,

          campaignState:
            null,
        });
      },
    );
  },
);