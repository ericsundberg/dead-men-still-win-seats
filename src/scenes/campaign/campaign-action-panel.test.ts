import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignState,
} from '../../game/campaign/campaign-state';
import {
  createCampaignActionPanelModels,
  formatCampaignActionFailureReasons,
} from './campaign-action-panel';

describe(
  'campaign action panel',
  () => {
    it(
      'creates the available fundraiser action model',
      () => {
        const models =
          createCampaignActionPanelModels({
            ...createInitialCampaignState(
              'easy',
            ),

            phase:
              'player-actions',
          });

        expect(
          models.slice(
            0,
            1,
          ),
        ).toEqual([
          {
            id:
              'closed-door-fundraiser',

            title:
              'Closed-Door Fundraiser',

            description:
              [
                'Invite major donors into a private room,',
                'pass the hat, and hope nobody asks why',
                'the Senator never enters.',
              ].join(' '),

            requirementItems: [
              'Requires 1 Action Point',
            ],

            effectItems: [
              '+$25,000 Cash',
              '-1 Action Point',
              '+5 Public Suspicion',
              '-4 Voter Energy',
            ],

            buttonLabel:
              'Hold Fundraiser',

            disabled:
              false,

            unavailableMessage:
              null,
          },
        ]);
      },
    );

    it(
      'creates personnel purchase action models',
      () => {
        const models =
          createCampaignActionPanelModels({
            ...createInitialCampaignState(
              'easy',
            ),

            phase:
              'player-actions',
          });

        expect(
          models.slice(
            1,
          ),
        ).toEqual([
          {
            id:
              'hire-staffer',

            title:
              'Hire Campaign Staffer',

            description:
              [
                'Bring in another operative to manage calls,',
                'schedules, and the increasingly difficult task',
                'of keeping the Senator off the calendar.',
              ].join(' '),

            requirementItems: [
              'Requires $20,000 Cash',
              'Requires 1 Action Point',
            ],

            effectItems: [
              '-$20,000 Cash',
              '-1 Action Point',
              '+1 Staffer',
            ],

            buttonLabel:
              'Hire Staffer',

            disabled:
              false,

            unavailableMessage:
              null,
          },

          {
            id:
              'recruit-surrogate',

            title:
              'Recruit Campaign Surrogate',

            description:
              [
                'Put a trusted ally on the campaign trail',
                'to speak for the Senator and answer questions',
                'he is no longer available to hear.',
              ].join(' '),

            requirementItems: [
              'Requires $15,000 Cash',
              'Requires 1 Action Point',
            ],

            effectItems: [
              '-$15,000 Cash',
              '-1 Action Point',
              '+1 Surrogate',
            ],

            buttonLabel:
              'Recruit Surrogate',

            disabled:
              false,

            unavailableMessage:
              null,
          },
        ]);
      },
    );

    it(
      'disables the fundraiser when no action points remain',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,

          resources: {
            cash:
              100_000,

            favors:
              3,

            actionPoints:
              0,
          },
        };

        const [
          fundraiser,
        ] =
          createCampaignActionPanelModels(
            campaignState,
          );

        expect(
          fundraiser.disabled,
        ).toBe(true);

        expect(
          fundraiser
            .unavailableMessage,
        ).toBe(
          'Not enough action points.',
        );
      },
    );

    it(
      'disables actions outside the player action phase',
      () => {
        const campaignState =
          createInitialCampaignState(
            'easy',
          );

        const [
          fundraiser,
        ] =
          createCampaignActionPanelModels(
            campaignState,
          );

        expect(
          fundraiser.disabled,
        ).toBe(true);

        expect(
          fundraiser
            .unavailableMessage,
        ).toBe(
          'Actions are unavailable right now.',
        );
      },
    );

    it(
      'formats multiple rejection reasons in their supplied order',
      () => {
        expect(
          formatCampaignActionFailureReasons([
            'not-player-actions',
            'insufficient-cash',
            'insufficient-favors',
            'insufficient-action-points',
          ]),
        ).toBe(
          [
            'Actions are unavailable right now.',
            'Not enough cash.',
            'Not enough favors.',
            'Not enough action points.',
          ].join(' '),
        );

        expect(
          formatCampaignActionFailureReasons(
            [],
          ),
        ).toBeNull();
      },
    );
  },
);