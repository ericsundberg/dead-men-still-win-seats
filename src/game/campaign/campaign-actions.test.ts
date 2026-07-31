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

const fundraiserHeadline =
  'Buster Campaign Holds Closed-Door Fundraiser; Senator Not Seen';

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

          newsItems: [
            fundraiserHeadline,
          ],
        });

        expect(
          getCampaignActionDefinitions(),
        ).toEqual([
          action,
          getCampaignActionDefinition(
            'hire-staffer',
          ),
          getCampaignActionDefinition(
            'recruit-surrogate',
          ),
        ]);
      },
    );

    it(
      'purchases staffers and surrogates with cash and action points',
      () => {
        const campaignState =
          createPlayerActionState();

        const stafferAction =
          getCampaignActionDefinition(
            'hire-staffer',
          );

        expect(
          stafferAction,
        ).toEqual({
          id:
            'hire-staffer',

          requirements: {
            minimumCash:
              20_000,

            minimumActionPoints:
              1,
          },

          effects: {
            cash:
              -20_000,

            actionPoints:
              -1,

            staffers:
              1,
          },

          newsItems: [
            'Buster Campaign Expands Staff as Senator Remains Out of Sight',
          ],
        });

        const hiredStaffer =
          performCampaignAction(
            campaignState,
            stafferAction,
          );

        expect(
          hiredStaffer.performed,
        ).toBe(true);

        expect(
          hiredStaffer.nextState
            .resources,
        ).toEqual({
          cash:
            80_000,

          favors:
            3,

          actionPoints:
            2,
        });

        expect(
          hiredStaffer.nextState
            .personnel,
        ).toEqual({
          staffers:
            4,

          surrogates:
            0,
        });

        const surrogateAction =
          getCampaignActionDefinition(
            'recruit-surrogate',
          );

        expect(
          surrogateAction,
        ).toEqual({
          id:
            'recruit-surrogate',

          requirements: {
            minimumCash:
              15_000,

            minimumActionPoints:
              1,
          },

          effects: {
            cash:
              -15_000,

            actionPoints:
              -1,

            surrogates:
              1,
          },

          newsItems: [
            'Prominent Ally Campaigns in Senator Buster’s Place',
          ],
        });

        const recruitedSurrogate =
          performCampaignAction(
            hiredStaffer.nextState,
            surrogateAction,
          );

        expect(
          recruitedSurrogate.performed,
        ).toBe(true);

        expect(
          recruitedSurrogate.nextState
            .resources,
        ).toEqual({
          cash:
            65_000,

          favors:
            3,

          actionPoints:
            1,
        });

        expect(
          recruitedSurrogate.nextState
            .personnel,
        ).toEqual({
          staffers:
            4,

          surrogates:
            1,
        });

        expect(
          recruitedSurrogate.nextState
            .newsFeed,
        ).toEqual([
          'Prominent Ally Campaigns in Senator Buster’s Place',
          'Buster Campaign Expands Staff as Senator Remains Out of Sight',
        ]);

        expect(
          campaignState.personnel,
        ).toEqual({
          staffers:
            3,

          surrogates:
            0,
        });
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
      'applies fundraiser effects and news without mutating the original state',
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

        expect(
          result.nextState
            .newsFeed,
        ).toEqual([
          fundraiserHeadline,
        ]);

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

        expect(
          campaignState.newsFeed,
        ).toEqual([]);
      },
    );

    it(
      'places newly generated action news before older headlines',
      () => {
        const campaignState = {
          ...createPlayerActionState(),

          newsFeed: [
            'Statesyltucky County Fair Opens Friday',
          ],
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
          result.nextState
            .newsFeed,
        ).toEqual([
          fundraiserHeadline,
          'Statesyltucky County Fair Opens Friday',
        ]);
      },
    );

    it(
      'does not duplicate a headline when an action is repeated',
      () => {
        const campaignState =
          createPlayerActionState();

        const action =
          getCampaignActionDefinition(
            'closed-door-fundraiser',
          );

        const firstResult =
          performCampaignAction(
            campaignState,
            action,
          );

        const secondResult =
          performCampaignAction(
            firstResult.nextState,
            action,
          );

        expect(
          secondResult.performed,
        ).toBe(true);

        expect(
          secondResult.nextState
            .newsFeed,
        ).toEqual([
          fundraiserHeadline,
        ]);
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