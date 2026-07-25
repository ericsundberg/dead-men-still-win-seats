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
  'CampaignSession actions',
  () => {
    it(
      'does not perform actions before a campaign starts',
      () => {
        const session =
          createCampaignSession();

        expect(
          session.performAction(
            'closed-door-fundraiser',
          ),
        ).toBeNull();

        expect(
          session.getState(),
        ).toBeNull();
      },
    );

    it(
      'performs a registered action and commits its effects',
      () => {
        const session =
          createCampaignSession();

        const startingState =
          session.startCampaign(
            'easy',
          );

        const result =
          session.performAction(
            'closed-door-fundraiser',
          );

        expect(
          result?.performed,
        ).toBe(true);

        expect(
          result?.action.id,
        ).toBe(
          'closed-door-fundraiser',
        );

        expect(
          result?.previousState,
        ).toBe(
          startingState,
        );

        expect(
          result?.failureReasons,
        ).toEqual([]);

        expect(
          result?.nextState
            .resources,
        ).toEqual({
          cash:
            125_000,

          favors:
            3,

          actionPoints:
            2,
        });

        expect(
          result?.nextState
            .metrics,
        ).toEqual({
          publicSuspicion:
            5,

          partyConfidence:
            100,

          voterEnergy:
            96,
        });

        expect(
          session.getState(),
        ).toBe(
          result?.nextState,
        );
      },
    );

    it(
      'returns a rejected action without changing session state',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        session.applyEffects({
          actionPoints:
            -3,
        });

        const stateBeforeAction =
          session.getState();

        const result =
          session.performAction(
            'closed-door-fundraiser',
          );

        expect(
          result?.performed,
        ).toBe(false);

        expect(
          result?.failureReasons,
        ).toEqual([
          'insufficient-action-points',
        ]);

        expect(
          result?.previousState,
        ).toBe(
          stateBeforeAction,
        );

        expect(
          result?.nextState,
        ).toBe(
          stateBeforeAction,
        );

        expect(
          session.getState(),
        ).toBe(
          stateBeforeAction,
        );
      },
    );

    it(
      'notifies subscribers only when an action changes state',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        const listener =
          vi.fn();

        session.subscribe(
          listener,
        );

        /*
         * Subscription immediately reports the active state.
         */
        expect(
          listener,
        ).toHaveBeenCalledTimes(
          1,
        );

        session.performAction(
          'closed-door-fundraiser',
        );

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          2,
        );

        session.performAction(
          'closed-door-fundraiser',
        );

        session.performAction(
          'closed-door-fundraiser',
        );

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          4,
        );

        /*
         * The fourth attempt is rejected because all three action
         * points have been spent. Rejection must not notify.
         */
        const rejectedResult =
          session.performAction(
            'closed-door-fundraiser',
          );

        expect(
          rejectedResult?.performed,
        ).toBe(false);

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          4,
        );
      },
    );

    it(
      'evaluates immediate end-game conditions after an action',
      () => {
        const session =
          createCampaignSession();

        session.startCampaign(
          'easy',
        );

        session.applyEffects({
          publicSuspicion:
            95,
        });

        const result =
          session.performAction(
            'closed-door-fundraiser',
          );

        expect(
          result?.performed,
        ).toBe(true);

        expect(
          result?.nextState
            .metrics
            .publicSuspicion,
        ).toBe(100);

        expect(
          result?.nextState
            .phase,
        ).toBe(
          'game-over',
        );

        expect(
          result?.nextState
            .endGameState,
        ).toEqual({
          type:
            'public-discovers-death',

          triggeredOnTurn:
            1,
        });

        expect(
          session.isGameOver(),
        ).toBe(true);

        const completedState =
          session.getState();

        expect(
          session.performAction(
            'closed-door-fundraiser',
          ),
        ).toBeNull();

        expect(
          session.getState(),
        ).toBe(
          completedState,
        );
      },
    );
  },
);