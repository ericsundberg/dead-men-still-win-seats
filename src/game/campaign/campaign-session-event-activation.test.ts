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
  createCampaignSession,
} from './campaign-session';

const turnOneEvent:
  GameEventDefinition = {
    id:
      'event_session_activation_01',

    title:
      'Turn One Event',

    description:
      'An event scheduled for the first campaign turn.',

    imagePath:
      'media/turn-one-event.webp',

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

const turnTwoEvent:
  GameEventDefinition = {
    id:
      'event_session_activation_02',

    title:
      'Turn Two Event',

    description:
      'An event scheduled for the second campaign turn.',

    trigger: {
      type:
        'turn',

      turn:
        2,
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

const decisionEvent:
  GameEventDefinition = {
    id:
      'event_session_activation_03',

    title:
      'Decision Event',

    description:
      'An event whose decision changes campaign state.',

    trigger: {
      type:
        'turn',

      turn:
        1,
    },

    decisions: [
      {
        id:
          'decision_accept',

        label:
          'Accept the consequences.',

        effects: {
          cash:
            -1_000,

          publicSuspicion:
            5,
        },

        addFlags: [
          'flag_decision_accepted',
        ],

        newsItems: [
          {
            headline:
              'Campaign Accepts the Consequences',
          },
        ],
      },
    ],
  };

function createRegistry(
  events:
    EventPackDefinition['events'],
) {
  const eventPack:
    EventPackDefinition = {
      eventPackId:
        'events_session_activation',

      events,
    };

  return createEventRegistry([
    eventPack,
  ]);
}

describe(
  'CampaignSession event activation',
  () => {
    it(
      'activates a scheduled event when a campaign starts',
      () => {
        const session =
          createCampaignSession(
            createRegistry([
              turnOneEvent,
            ]),
          );

        const state =
          session.startCampaign(
            'easy',
          );

        expect(
          state.phase,
        ).toBe(
          'resolving-events',
        );

        expect(
          state.activeEventInstanceId,
        ).toBe(
          turnOneEvent.id,
        );
      },
    );

    it(
      'exposes optional image metadata from the active event',
      () => {
        const session =
          createCampaignSession(
            createRegistry([
              turnOneEvent,
            ]),
          );

        session.startCampaign(
          'easy',
        );

        expect(
          session
            .getActiveEventDefinition(),
        ).toBe(
          turnOneEvent,
        );

        expect(
          session
            .getActiveEventDefinition()
            ?.imagePath,
        ).toBe(
          'media/turn-one-event.webp',
        );
      },
    );

    it(
      'does not end the turn while an event is unresolved',
      () => {
        const session =
          createCampaignSession(
            createRegistry([
              turnOneEvent,
            ]),
          );

        const startedState =
          session.startCampaign(
            'easy',
          );

        expect(
          session.endTurn(),
        ).toBeNull();

        expect(
          session.getState(),
        ).toBe(
          startedState,
        );
      },
    );

    it(
      'activates a scheduled event after advancing to its turn',
      () => {
        const session =
          createCampaignSession(
            createRegistry([
              turnTwoEvent,
            ]),
          );

        const startedState =
          session.startCampaign(
            'easy',
          );

        expect(
          startedState.phase,
        ).toBe(
          'player-actions',
        );

        const secondTurnState =
          session.endTurn();

        expect(
          secondTurnState
            ?.currentTurn,
        ).toBe(2);

        expect(
          secondTurnState
            ?.phase,
        ).toBe(
          'resolving-events',
        );

        expect(
          secondTurnState
            ?.activeEventInstanceId,
        ).toBe(
          turnTwoEvent.id,
        );
      },
    );

    it(
      'commits a successful active-event decision',
      () => {
        const session =
          createCampaignSession(
            createRegistry([
              decisionEvent,
            ]),
          );

        session.startCampaign(
          'easy',
        );

        const result =
          session.chooseEventDecision(
            'decision_accept',
          );

        expect(
          result?.performed,
        ).toBe(true);

        expect(
          result?.nextState.phase,
        ).toBe(
          'player-actions',
        );

        expect(
          result?.nextState
            .activeEventInstanceId,
        ).toBeNull();

        expect(
          result?.nextState
            .resources
            .cash,
        ).toBe(
          99_000,
        );

        expect(
          result?.nextState
            .metrics
            .publicSuspicion,
        ).toBe(5);

        expect(
          result?.nextState.flags,
        ).toContain(
          'flag_decision_accepted',
        );

        expect(
          result?.nextState
            .completedEventIds,
        ).toContain(
          decisionEvent.id,
        );

        expect(
          result?.nextState.newsFeed,
        ).toContain(
          'Campaign Accepts the Consequences',
        );
      },
    );

    it(
      'leaves state unchanged when an event decision is unknown',
      () => {
        const session =
          createCampaignSession(
            createRegistry([
              decisionEvent,
            ]),
          );

        const startedState =
          session.startCampaign(
            'easy',
          );

        const result =
          session.chooseEventDecision(
            'decision_missing',
          );

        expect(
          result?.performed,
        ).toBe(false);

        expect(
          result?.failureReasons,
        ).toEqual([
          'unknown-decision',
        ]);

        expect(
          session.getState(),
        ).toBe(
          startedState,
        );
      },
    );
  },
);