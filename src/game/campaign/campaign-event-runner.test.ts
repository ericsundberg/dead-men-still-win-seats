import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createEventRegistry,
} from '../../events/event-registry';
import type {
  EventPackDefinition,
  GameEventDefinition,
} from '../../events/event-types';
import {
  activateNextCampaignEvent,
  evaluateCampaignEventEligibility,
} from './campaign-event-runner';
import {
  createInitialCampaignState,
  type CampaignState,
} from './campaign-state';

const manualEvent:
  GameEventDefinition = {
    id:
      'event_runner_01',

    title:
      'Queued Manual Event',

    description:
      'A manually queued event.',

    imagePath:
      'media/queued-event.webp',

    trigger: {
      type:
        'manual',
    },

    decisions: [
      {
        id:
          'decision_continue',

        label:
          'Continue.',
      },
    ],
  };

const turnEvent:
  GameEventDefinition = {
    id:
      'event_runner_02',

    title:
      'Turn Event',

    description:
      'An event scheduled for turn one.',

    trigger: {
      type:
        'turn',

      turn:
        1,
    },

    decisions: [
      {
        id:
          'decision_continue',

        label:
          'Continue.',
      },
    ],
  };

const chanceEvent:
  GameEventDefinition = {
    id:
      'event_runner_03',

    title:
      'Chance Event',

    description:
      'An event with a twenty-five percent chance.',

    trigger: {
      type:
        'chance',

      chancePercent:
        25,
    },

    decisions: [
      {
        id:
          'decision_continue',

        label:
          'Continue.',
      },
    ],
  };

const repeatableChanceEvent:
  GameEventDefinition = {
    id:
      'event_runner_04',

    title:
      'Repeatable Chance Event',

    description:
      'A repeatable event.',

    trigger: {
      type:
        'chance',

      chancePercent:
        100,
    },

    repeatable:
      true,

    decisions: [
      {
        id:
          'decision_continue',

        label:
          'Continue.',
      },
    ],
  };

const turnWindowEvent:
  GameEventDefinition = {
    id:
      'event_runner_05',

    title:
      'Turn Window Event',

    description:
      'An event available during turns four and five.',

    trigger: {
      type:
        'turn-window',

      startTurn:
        4,

      endTurn:
        5,
    },

    decisions: [
      {
        id:
          'decision_continue',

        label:
          'Continue.',
      },
    ],
  };

const fallbackEvent:
  GameEventDefinition = {
    id:
      'event_runner_06',

    title:
      'Fallback Event',

    description:
      'A repeatable fallback event.',

    trigger: {
      type:
        'fallback',
    },

    repeatable:
      true,

    decisions: [
      {
        id:
          'decision_continue',

        label:
          'Continue.',
      },
    ],
  };

function createRegistry(
  events:
    readonly GameEventDefinition[],
) {
  const eventPack:
    EventPackDefinition = {
      eventPackId:
        'events_runner',

      events,
    };

  return createEventRegistry([
    eventPack,
  ]);
}

function createTurnStartState(
  overrides:
    Partial<CampaignState> = {},
): CampaignState {
  return {
    ...createInitialCampaignState(
      'easy',
    ),

    ...overrides,
  };
}

describe(
  'campaign event runner',
  () => {
    it(
      'reports every unmet event requirement',
      () => {
        const restrictedEvent:
          GameEventDefinition = {
            ...turnEvent,

            requirements: {
              minimumCash:
                200_000,

              minimumFavors:
                5,

              minimumActionPoints:
                4,

              requiredFlags: [
                'flag_staff_loyal',
              ],

              excludedFlags: [
                'flag_reporter_alerted',
              ],
            },
          };

        const state =
          createTurnStartState({
            flags: [
              'flag_reporter_alerted',
            ],

            completedEventIds: [
              restrictedEvent.id,
            ],
          });

        expect(
          evaluateCampaignEventEligibility(
            state,
            restrictedEvent,
          ),
        ).toEqual({
          isEligible:
            false,

          failureReasons: [
            'already-completed',
            'insufficient-cash',
            'insufficient-favors',
            'insufficient-action-points',
            'missing-required-flags',
            'excluded-flags-present',
          ],

          missingRequiredFlags: [
            'flag_staff_loyal',
          ],

          presentExcludedFlags: [
            'flag_reporter_alerted',
          ],
        });
      },
    );

    it(
      'activates a queued event before a scheduled event',
      () => {
        const registry =
          createRegistry([
            manualEvent,
            turnEvent,
          ]);

        const state =
          createTurnStartState({
            queuedEventIds: [
              manualEvent.id,
            ],
          });

        const result =
          activateNextCampaignEvent(
            state,
            registry,
          );

        expect(
          result.activated,
        ).toBe(true);

        expect(
          result.event,
        ).toBe(
          manualEvent,
        );

        expect(
          result.event
            ?.imagePath,
        ).toBe(
          'media/queued-event.webp',
        );

        expect(
          result.source,
        ).toBe('queued');

        expect(
          result.nextState.phase,
        ).toBe(
          'resolving-events',
        );

        expect(
          result.nextState
            .activeEventInstanceId,
        ).toBe(
          manualEvent.id,
        );

        expect(
          result.nextState
            .queuedEventIds,
        ).toEqual([]);
      },
    );

    it(
      'activates an event scheduled for the current turn',
      () => {
        const registry =
          createRegistry([
            turnEvent,
          ]);

        const state =
          createTurnStartState();

        const result =
          activateNextCampaignEvent(
            state,
            registry,
          );

        expect(
          result.activated,
        ).toBe(true);

        expect(
          result.event,
        ).toBe(
          turnEvent,
        );

        expect(
          result.source,
        ).toBe('turn');
      },
    );

    it(
      'activates an eligible chance event when its roll succeeds',
      () => {
        const registry =
          createRegistry([
            chanceEvent,
          ]);

        const state =
          createTurnStartState({
            currentTurn:
              2,
          });

        const result =
          activateNextCampaignEvent(
            state,
            registry,
            () => 0.1,
          );

        expect(
          result.activated,
        ).toBe(true);

        expect(
          result.event,
        ).toBe(
          chanceEvent,
        );

        expect(
          result.source,
        ).toBe('chance');
      },
    );

    it(
      'activates a turn-window event throughout its window',
      () => {
        for (
          const currentTurn
          of [
            4,
            5,
          ]
        ) {
          const result =
            activateNextCampaignEvent(
              createTurnStartState({
                currentTurn,
              }),
              createRegistry([
                turnWindowEvent,
              ]),
            );

          expect(
            result.event,
          ).toBe(
            turnWindowEvent,
          );

          expect(
            result.source,
          ).toBe(
            'turn-window',
          );
        }
      },
    );

    it(
      'prefers a successful chance event over a fallback event',
      () => {
        const result =
          activateNextCampaignEvent(
            createTurnStartState({
              currentTurn:
                2,
            }),
            createRegistry([
              chanceEvent,
              fallbackEvent,
            ]),
            () => 0.1,
          );

        expect(
          result.event,
        ).toBe(
          chanceEvent,
        );

        expect(
          result.source,
        ).toBe(
          'chance',
        );
      },
    );

    it(
      'uses a fallback event when chance rolls fail',
      () => {
        const result =
          activateNextCampaignEvent(
            createTurnStartState({
              currentTurn:
                2,
            }),
            createRegistry([
              chanceEvent,
              fallbackEvent,
            ]),
            () => 0.75,
          );

        expect(
          result.event,
        ).toBe(
          fallbackEvent,
        );

        expect(
          result.source,
        ).toBe(
          'fallback',
        );
      },
    );

    it(
      'keeps a repeatable fallback available on every campaign turn',
      () => {
        for (
          let currentTurn = 1;
          currentTurn <= 13;
          currentTurn += 1
        ) {
          const result =
            activateNextCampaignEvent(
              createTurnStartState({
                currentTurn,

                completedEventIds: [
                  fallbackEvent.id,
                ],
              }),
              createRegistry([
                fallbackEvent,
              ]),
              () => 0.5,
            );

          expect(
            result.activated,
          ).toBe(true);

          expect(
            result.event,
          ).toBe(
            fallbackEvent,
          );

          expect(
            result.source,
          ).toBe(
            'fallback',
          );
        }
      },
    );

    it(
      'enters player actions when a chance roll fails',
      () => {
        const registry =
          createRegistry([
            chanceEvent,
          ]);

        const state =
          createTurnStartState({
            currentTurn:
              2,
          });

        const result =
          activateNextCampaignEvent(
            state,
            registry,
            () => 0.75,
          );

        expect(
          result.activated,
        ).toBe(false);

        expect(
          result.event,
        ).toBeNull();

        expect(
          result.nextState.phase,
        ).toBe(
          'player-actions',
        );
      },
    );

    it(
      'does not automatically activate manual events',
      () => {
        const registry =
          createRegistry([
            manualEvent,
          ]);

        const state =
          createTurnStartState({
            currentTurn:
              2,
          });

        const result =
          activateNextCampaignEvent(
            state,
            registry,
          );

        expect(
          result.activated,
        ).toBe(false);

        expect(
          result.nextState.phase,
        ).toBe(
          'player-actions',
        );
      },
    );

    it(
      'allows a completed repeatable event to activate again',
      () => {
        const registry =
          createRegistry([
            repeatableChanceEvent,
          ]);

        const state =
          createTurnStartState({
            currentTurn:
              2,

            completedEventIds: [
              repeatableChanceEvent.id,
            ],
          });

        const result =
          activateNextCampaignEvent(
            state,
            registry,
            () => 0,
          );

        expect(
          result.activated,
        ).toBe(true);

        expect(
          result.event,
        ).toBe(
          repeatableChanceEvent,
        );
      },
    );

    it(
      'leaves campaign state unchanged outside turn start',
      () => {
        const registry =
          createRegistry([
            turnEvent,
          ]);

        const state =
          createTurnStartState({
            phase:
              'player-actions',
          });

        const result =
          activateNextCampaignEvent(
            state,
            registry,
          );

        expect(
          result.activated,
        ).toBe(false);

        expect(
          result.nextState,
        ).toBe(state);
      },
    );
  },
);