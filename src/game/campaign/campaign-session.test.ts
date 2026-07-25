import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createCampaignSession,
} from './campaign-session';

describe(
  'CampaignSession',
  () => {
    it(
      'starts without an active campaign',
      () => {
        const session =
          createCampaignSession();

        expect(
          session.hasActiveCampaign(),
        ).toBe(false);

        expect(
          session.getState(),
        ).toBeNull();

        expect(
          session.getDifficultyId(),
        ).toBeNull();

        expect(
          session.getCurrentTurn(),
        ).toBeNull();

        expect(
          session.getTotalTurns(),
        ).toBeNull();

        expect(
          session.isGameOver(),
        ).toBe(false);
      },
    );

    it(
      'starts the selected campaign',
      () => {
        const session =
          createCampaignSession();

        const state =
          session.startCampaign(
            'moderate',
          );

        expect(
          session.hasActiveCampaign(),
        ).toBe(true);

        expect(
          state.difficultyId,
        ).toBe('moderate');

        expect(
          state.currentTurn,
        ).toBe(1);

        expect(
          state.totalTurns,
        ).toBe(26);

        expect(
          state.phase,
        ).toBe(
          'player-actions',
        );

        expect(
          session.getState(),
        ).toBe(state);
      },
    );

    it(
      'advances to the next campaign turn',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        const nextState =
          session.endTurn();

        expect(
          nextState?.currentTurn,
        ).toBe(2);

        expect(
          nextState?.phase,
        ).toBe(
          'player-actions',
        );

        expect(
          nextState?.resources
            .actionPoints,
        ).toBe(3);

        expect(
          nextState?.endGameState,
        ).toBeNull();
      },
    );

    it(
      'resolves the election after the final turn',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        /*
         * Easy mode contains thirteen total turns:
         *
         * - Turns 1 through 12 are campaign weeks.
         * - Turn 13 resolves Election Day.
         */
        for (
          let completedTurns = 0;
          completedTurns < 12;
          completedTurns += 1
        ) {
          session.endTurn();
        }

        expect(
          session.getCurrentTurn(),
        ).toBe(13);

        expect(
          session.isGameOver(),
        ).toBe(false);

        const finalState =
          session.endTurn();

        expect(
          finalState?.currentTurn,
        ).toBe(13);

        expect(
          finalState?.phase,
        ).toBe(
          'game-over',
        );

        expect(
          finalState?.endGameState,
        ).toEqual({
          type:
            'win-reelection',

          triggeredOnTurn:
            13,
        });

        expect(
          session.isGameOver(),
        ).toBe(true);
      },
    );

    it(
      'does not advance after game over',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        for (
          let completedTurns = 0;
          completedTurns < 13;
          completedTurns += 1
        ) {
          session.endTurn();
        }

        const completedState =
          session.getState();

        expect(
          session.endTurn(),
        ).toBeNull();

        expect(
          session.getState(),
        ).toBe(
          completedState,
        );

        expect(
          session.getCurrentTurn(),
        ).toBe(13);
      },
    );

    it(
      'notifies subscribers when campaign state changes',
      () => {
        const session =
          createCampaignSession();

        const listener =
          vi.fn();

        const unsubscribe =
          session.subscribe(
            listener,
          );

        /*
         * Subscribing immediately reports the current null state.
         */
        expect(
          listener,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          listener,
        ).toHaveBeenLastCalledWith(
          null,
        );

        const startedState =
          session.startCampaign(
            'easy',
          );

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          2,
        );

        expect(
          listener,
        ).toHaveBeenLastCalledWith(
          startedState,
        );

        unsubscribe();

        session.endTurn();

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );
  },
);