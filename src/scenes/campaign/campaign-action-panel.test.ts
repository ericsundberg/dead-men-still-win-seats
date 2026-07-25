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
          models,
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