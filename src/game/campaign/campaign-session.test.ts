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
      'applies campaign resource and metric effects',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        const nextState =
          session.applyEffects({
            cash:
              -2_500,

            actionPoints:
              -1,

            publicSuspicion:
              12,

            partyConfidence:
              -7,

            voterEnergy:
              -9,
          });

        expect(
          nextState?.resources,
        ).toEqual({
          cash:
            97_500,

          favors:
            3,

          actionPoints:
            2,
        });

        expect(
          nextState?.metrics,
        ).toEqual({
          publicSuspicion:
            12,

          partyConfidence:
            93,

          voterEnergy:
            91,
        });

        expect(
          nextState?.phase,
        ).toBe(
          'player-actions',
        );

        expect(
          nextState?.endGameState,
        ).toBeNull();

        expect(
          session.getState(),
        ).toBe(
          nextState,
        );
      },
    );

    it(
      'does not apply effects before a campaign starts',
      () => {
        const session =
          createCampaignSession();

        expect(
          session.applyEffects({
            cash:
              -1_000,

            publicSuspicion:
              10,
          }),
        ).toBeNull();

        expect(
          session.getState(),
        ).toBeNull();
      },
    );

    it(
      'ends the campaign immediately when effects trigger a loss condition',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        const completedState =
          session.applyEffects({
            publicSuspicion:
              100,
          });

        expect(
          completedState?.metrics
            .publicSuspicion,
        ).toBe(100);

        expect(
          completedState?.phase,
        ).toBe(
          'game-over',
        );

        expect(
          completedState?.endGameState,
        ).toEqual({
          type:
            'public-discovers-death',

          triggeredOnTurn:
            1,
        });

        expect(
          session.isGameOver(),
        ).toBe(true);
      },
    );

    it(
      'does not apply additional effects after game over',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        session.applyEffects({
          publicSuspicion:
            100,
        });

        const completedState =
          session.getState();

        expect(
          session.applyEffects({
            cash:
              -50_000,

            voterEnergy:
              -50,
          }),
        ).toBeNull();

        expect(
          session.getState(),
        ).toBe(
          completedState,
        );

        expect(
          session.getState()
            ?.resources
            .cash,
        ).toBe(
          100_000,
        );
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
      'replenishes action points while preserving other effects at turn end',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        session.applyEffects({
          cash:
            -5_000,

          favors:
            2,

          actionPoints:
            -2,

          publicSuspicion:
            15,
        });

        const nextState =
          session.endTurn();

        expect(
          nextState?.resources,
        ).toEqual({
          cash:
            95_000,

          favors:
            5,

          actionPoints:
            3,
        });

        expect(
          nextState?.metrics
            .publicSuspicion,
        ).toBe(15);
      },
    );

    it(
      'adds one replenished action point per staffer',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        session.applyEffects({
          actionPoints:
            -3,

          staffers:
            2,
        });

        const nextState =
          session.endTurn();

        expect(
          nextState?.personnel
            .staffers,
        ).toBe(2);

        expect(
          nextState?.resources
            .actionPoints,
        ).toBe(5);
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

        const affectedState =
          session.applyEffects({
            actionPoints:
              -1,
          });

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          3,
        );

        expect(
          listener,
        ).toHaveBeenLastCalledWith(
          affectedState,
        );

        unsubscribe();

        session.endTurn();

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          3,
        );
      },
    );
  },
);