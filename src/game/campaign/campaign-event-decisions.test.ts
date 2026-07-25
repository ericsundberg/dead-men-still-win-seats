import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  EventDecisionDefinition,
  GameEventDefinition,
} from '../../events/event-types';
import {
  createInitialCampaignState,
  type CampaignState,
} from './campaign-state';
import {
  evaluateCampaignEventDecisionAvailability,
  resolveCampaignEventDecision,
} from './campaign-event-decisions';

const governorHeadline =
  'Governor Demands Proof That Senator Remains Available';

const governorEvent:
  GameEventDefinition = {
    id:
      'event_governor_01',

    title:
      'The Governor Calls',

    description:
      [
        'The Governor would like proof that the Senator',
        'remains available for official business.',
      ].join(' '),

    trigger: {
      type:
        'manual',
    },

    decisions: [
      {
        id:
          'decision_fake_phone_call',

        label:
          'Fake a phone call.',

        requirements: {
          minimumCash:
            5_000,

          minimumFavors:
            1,

          minimumActionPoints:
            1,

          requiredFlags: [
            'staff-loyal',
          ],

          excludedFlags: [
            'governor-suspicious',
          ],
        },

        effects: {
          cash:
            -5_000,

          favors:
            -1,

          actionPoints:
            -1,

          publicSuspicion:
            8,

          partyConfidence:
            -4,
        },

        addFlags: [
          'governor-deceived',
        ],

        removeFlags: [
          'governor-calling',
        ],

        queueEventIds: [
          'event_governor_02',
        ],

        newsItems: [
          {
            headline:
              governorHeadline,

            category:
              'politics',
          },
        ],
      },
    ],
  };

function createResolvingEventState():
  CampaignState {
  return {
    ...createInitialCampaignState(
      'easy',
    ),

    phase:
      'resolving-events',

    flags: [
      'staff-loyal',
      'governor-calling',
    ],

    activeEventInstanceId:
      'event-instance-governor-01',
  };
}

describe(
  'campaign event decisions',
  () => {
    it(
      'allows an available decision while resolving events',
      () => {
        const campaignState =
          createResolvingEventState();

        const [
          decision,
        ] =
          governorEvent
            .decisions;

        expect(
          evaluateCampaignEventDecisionAvailability(
            campaignState,
            decision,
          ),
        ).toEqual({
          canChoose:
            true,

          failureReasons:
            [],

          missingRequiredFlags:
            [],

          presentExcludedFlags:
            [],
        });
      },
    );

    it(
      'rejects decisions outside the event-resolution phase',
      () => {
        const campaignState = {
          ...createResolvingEventState(),

          phase:
            'player-actions' as const,
        };

        const [
          decision,
        ] =
          governorEvent
            .decisions;

        expect(
          evaluateCampaignEventDecisionAvailability(
            campaignState,
            decision,
          ),
        ).toEqual({
          canChoose:
            false,

          failureReasons: [
            'not-resolving-events',
          ],

          missingRequiredFlags:
            [],

          presentExcludedFlags:
            [],
        });
      },
    );

    it(
      'reports all unmet resources and flag requirements',
      () => {
        const campaignState = {
          ...createResolvingEventState(),

          resources: {
            cash:
              100,

            favors:
              0,

            actionPoints:
              0,
          },

          flags: [
            'governor-suspicious',
          ],
        };

        const decision:
          EventDecisionDefinition = {
            id:
              'decision_fake_phone_call',

            label:
              'Fake a phone call.',

            requirements: {
              minimumCash:
                5_000,

              minimumFavors:
                1,

              minimumActionPoints:
                1,

              requiredFlags: [
                'staff-loyal',
                'audio-equipment-ready',
              ],

              excludedFlags: [
                'governor-suspicious',
                'press-listening',
              ],
            },
          };

        expect(
          evaluateCampaignEventDecisionAvailability(
            campaignState,
            decision,
          ),
        ).toEqual({
          canChoose:
            false,

          failureReasons: [
            'insufficient-cash',
            'insufficient-favors',
            'insufficient-action-points',
            'missing-required-flags',
            'excluded-flags-present',
          ],

          missingRequiredFlags: [
            'staff-loyal',
            'audio-equipment-ready',
          ],

          presentExcludedFlags: [
            'governor-suspicious',
          ],
        });
      },
    );

    it(
      'resolves effects flags queued events news and completion',
      () => {
        const campaignState = {
          ...createResolvingEventState(),

          queuedEventIds: [
            'event_governor_03',
          ],

          newsFeed: [
            'County Fair Opens Friday',
          ],
        };

        const result =
          resolveCampaignEventDecision(
            campaignState,
            governorEvent,
            'decision_fake_phone_call',
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
          result.nextState.phase,
        ).toBe(
          'player-actions',
        );

        expect(
          result.nextState
            .resources,
        ).toEqual({
          cash:
            95_000,

          favors:
            2,

          actionPoints:
            2,
        });

        expect(
          result.nextState
            .metrics,
        ).toEqual({
          publicSuspicion:
            8,

          partyConfidence:
            96,

          voterEnergy:
            100,
        });

        expect(
          result.nextState.flags,
        ).toEqual([
          'staff-loyal',
          'governor-deceived',
        ]);

        expect(
          result.nextState
            .activeEventInstanceId,
        ).toBeNull();

        expect(
          result.nextState
            .queuedEventIds,
        ).toEqual([
          'event_governor_03',
          'event_governor_02',
        ]);

        expect(
          result.nextState
            .completedEventIds,
        ).toEqual([
          'event_governor_01',
        ]);

        expect(
          result.nextState
            .newsFeed,
        ).toEqual([
          governorHeadline,
          'County Fair Opens Friday',
        ]);

        /*
         * The supplied state remains unchanged.
         */
        expect(
          campaignState.flags,
        ).toEqual([
          'staff-loyal',
          'governor-calling',
        ]);

        expect(
          campaignState
            .activeEventInstanceId,
        ).toBe(
          'event-instance-governor-01',
        );
      },
    );

    it(
      'deduplicates flags events and headlines',
      () => {
        const campaignState = {
          ...createResolvingEventState(),

          flags: [
            'staff-loyal',
            'governor-calling',
            'governor-deceived',
          ],

          queuedEventIds: [
            'event_governor_02',
          ],

          completedEventIds: [
            'event_governor_01',
          ],

          newsFeed: [
            governorHeadline,
          ],
        };

        const result =
          resolveCampaignEventDecision(
            campaignState,
            governorEvent,
            'decision_fake_phone_call',
          );

        expect(
          result.performed,
        ).toBe(true);

        expect(
          result.nextState.flags,
        ).toEqual([
          'staff-loyal',
          'governor-deceived',
        ]);

        expect(
          result.nextState
            .queuedEventIds,
        ).toEqual([
          'event_governor_02',
        ]);

        expect(
          result.nextState
            .completedEventIds,
        ).toEqual([
          'event_governor_01',
        ]);

        expect(
          result.nextState
            .newsFeed,
        ).toEqual([
          governorHeadline,
        ]);
      },
    );

    it(
      'returns unchanged state for an unknown decision',
      () => {
        const campaignState =
          createResolvingEventState();

        const result =
          resolveCampaignEventDecision(
            campaignState,
            governorEvent,
            'decision_missing',
          );

        expect(
          result.performed,
        ).toBe(false);

        expect(
          result.decision,
        ).toBeNull();

        expect(
          result.failureReasons,
        ).toEqual([
          'unknown-decision',
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