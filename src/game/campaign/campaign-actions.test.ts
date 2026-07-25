import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignState,
  type CampaignState,
} from './campaign-state';
import {
  evaluateCampaignActionAvailability,
  getCampaignActionDefinition,
  getCampaignActionDefinitions,
  performCampaignAction,
  type CampaignActionDefinition,
} from './campaign-actions';

function createPlayerActionState():
  CampaignState {
  return {
    ...createInitialCampaignState(
      'easy',
    ),

    phase:
      'player-actions',
  };
}

describe(
  'campaign actions',
  () => {
    it(
      'registers the closed-door fundraiser action',
      () => {
        const action =
          getCampaignActionDefinition(
            'closed-door-fundraiser',
          );

        expect(
          action,
        ).toEqual({
          id:
            'closed-door-fundraiser',

          requirements: {
            minimumActionPoints:
              1,
          },

          effects: {
            cash:
              25_000,

            actionPoints:
              -1,

            publicSuspicion:
              5,

            voterEnergy:
              -4,
          },
        });

        expect(
          getCampaignActionDefinitions(),
        ).toEqual([
          action,
        ]);
      },
    );

    it(
      'allows the fundraiser during the player action phase',
      () => {
        const campaignState =
          createPlayerActionState();

        const action =
          getCampaignActionDefinition(
            'closed-door-fundraiser',
          );

        expect(
          evaluateCampaignActionAvailability(
            campaignState,
            action,
          ),
        ).toEqual({
          canPerform:
            true,

          failureReasons:
            [],
        });
      },
    );

    it(
      'rejects actions outside the player action phase',
      () => {
        const campaignState =
          createInitialCampaignState(
            'easy',
          );

        const action =
          getCampaignActionDefinition(
            'closed-door-fundraiser',
          );

        expect(
          evaluateCampaignActionAvailability(
            campaignState,
            action,
          ),
        ).toEqual({
          canPerform:
            false,

          failureReasons: [
            'not-player-actions',
          ],
        });
      },
    );

    it(
      'reports every unmet resource requirement',
      () => {
        const campaignState = {
          ...createPlayerActionState(),

          resources: {
            cash:
              100,

            favors:
              0,

            actionPoints:
              0,
          },
        };

        const action:
          CampaignActionDefinition = {
            id:
              'closed-door-fundraiser',

            requirements: {
              minimumCash:
                500,

              minimumFavors:
                1,

              minimumActionPoints:
                1,
            },

            effects: {},
          };

        expect(
          evaluateCampaignActionAvailability(
            campaignState,
            action,
          ),
        ).toEqual({
          canPerform:
            false,

          failureReasons: [
            'insufficient-cash',
            'insufficient-favors',
            'insufficient-action-points',
          ],
        });
      },
    );

    it(
      'applies the fundraiser effects without mutating the original state',
      () => {
        const campaignState =
          createPlayerActionState();

        const action =
          getCampaignActionDefinition(
            'closed-door-fundraiser',
          );

        const result =
          performCampaignAction(
            campaignState,
            action,
          );

        expect(
          result.performed,
        ).toBe(true);

        expect(
          result.failureReasons,
        ).toEqual([]);

        expect(
          result.previousState,
        ).toBe(
          campaignState,
        );

        expect(
          result.nextState,
        ).not.toBe(
          campaignState,
        );

        expect(
          result.nextState
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
          result.nextState
            .metrics,
        ).toEqual({
          publicSuspicion:
            5,

          partyConfidence:
            100,

          voterEnergy:
            96,
        });

        /*
         * Confirm that the original state remains unchanged.
         */
        expect(
          campaignState.resources,
        ).toEqual({
          cash:
            100_000,

          favors:
            3,

          actionPoints:
            3,
        });

        expect(
          campaignState.metrics,
        ).toEqual({
          publicSuspicion:
            0,

          partyConfidence:
            100,

          voterEnergy:
            100,
        });
      },
    );

    it(
      'returns the unchanged state when requirements are not met',
      () => {
        const campaignState = {
          ...createPlayerActionState(),

          resources: {
            cash:
              100_000,

            favors:
              3,

            actionPoints:
              0,
          },
        };

        const action =
          getCampaignActionDefinition(
            'closed-door-fundraiser',
          );

        const result =
          performCampaignAction(
            campaignState,
            action,
          );

        expect(
          result.performed,
        ).toBe(false);

        expect(
          result.failureReasons,
        ).toEqual([
          'insufficient-action-points',
        ]);

        expect(
          result.previousState,
        ).toBe(
          campaignState,
        );

        expect(
          result.nextState,
        ).toBe(
          campaignState,
        );
      },
    );
  },
);