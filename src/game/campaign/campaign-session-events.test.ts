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
} from '../../events/event-types';
import {
  createCampaignSession,
} from './campaign-session';

const runtimeEventPack:
  EventPackDefinition = {
    eventPackId:
      'events_test_runtime',

    events: [
      {
        id:
          'event_test_runtime_01',

        title:
          'Runtime Event',

        description:
          'An event loaded into the campaign runtime.',

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
      },
    ],
  };

describe(
  'CampaignSession event registry',
  () => {
    it(
      'uses an empty event registry by default',
      () => {
        const session =
          createCampaignSession();

        expect(
          session.getRegisteredEventIds(),
        ).toEqual([]);

        expect(
          session.getEventDefinition(
            'event_test_runtime_01',
          ),
        ).toBeNull();
      },
    );

    it(
      'retains events supplied by the application startup loader',
      () => {
        const registry =
          createEventRegistry([
            runtimeEventPack,
          ]);

        const session =
          createCampaignSession(
            registry,
          );

        expect(
          session.getRegisteredEventIds(),
        ).toEqual([
          'event_test_runtime_01',
        ]);

        expect(
          session.getEventDefinition(
            'event_test_runtime_01',
          ),
        ).toBe(
          runtimeEventPack.events[0],
        );
      },
    );
  },
);