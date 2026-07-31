import {
  readFileSync,
} from 'node:fs';
import {
  join,
} from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createCampaignSession,
} from '../game/campaign/campaign-session';
import {
  createEventRegistry,
} from './event-registry';
import {
  parseEventPackManifest,
} from './event-pack-loader';
import type {
  EventPackDefinition,
  GameEventDefinition,
} from './event-types';
import {
  parseEventPackDefinition,
} from './event-validation';

const publicEventRootPath =
  join(
    process.cwd(),
    'public',
    'assets',
    'common',
    'events',
  );

function readJsonFile(
  filePath:
    string,
): unknown {
  return JSON.parse(
    readFileSync(
      filePath,
      'utf8',
    ),
  ) as unknown;
}

function loadPublicEventPacks():
  readonly EventPackDefinition[] {
  const manifest =
    parseEventPackManifest(
      readJsonFile(
        join(
          publicEventRootPath,
          'manifest.json',
        ),
      ),
    );

  return manifest.eventPacks.map(
    (
      eventPackPath,
    ) =>
      parseEventPackDefinition(
        readJsonFile(
          join(
            publicEventRootPath,
            ...eventPackPath.split(
              '/',
            ),
          ),
        ),
      ),
  );
}

function findOnlyTurnOneEvent(
  events:
    readonly GameEventDefinition[],
): GameEventDefinition {
  const turnOneEvents =
    events.filter(
      (
        event,
      ) =>
        event.trigger.type
          === 'turn'
        && event.trigger.turn
          === 1,
    );

  expect(
    turnOneEvents,
  ).toHaveLength(
    1,
  );

  const openingEvent =
    turnOneEvents[0];

  if (
    !openingEvent
  ) {
    throw new Error(
      'Public event data does not define a turn-one event.',
    );
  }

  return openingEvent;
}

describe(
  'public campaign opening event',
  () => {
    it(
      'defines exactly one non-repeatable turn-one event',
      () => {
        const registry =
          createEventRegistry(
            loadPublicEventPacks(),
          );

        const openingEvent =
          findOnlyTurnOneEvent(
            registry.getEvents(),
          );

        expect(
          openingEvent.title,
        ).toBe(
          'So, We Heard the Senator Fell',
        );

        expect(
          openingEvent.repeatable,
        ).toBe(false);
      },
    );

    it(
      'selects the JSON-defined turn-one event before every chance event',
      () => {
        const registry =
          createEventRegistry(
            loadPublicEventPacks(),
          );

        const openingEvent =
          findOnlyTurnOneEvent(
            registry.getEvents(),
          );

        /*
         * Zero makes every 25-percent chance roll succeed.
         *
         * The turn-one event must still activate first because
         * exact-turn triggers have higher event-system priority
         * than chance triggers.
         */
        const session =
          createCampaignSession(
            registry,
            () => 0,
          );

        const campaignState =
          session.startCampaign(
            'easy',
          );

        expect(
          campaignState.phase,
        ).toBe(
          'resolving-events',
        );

        expect(
          campaignState
            .activeEventInstanceId,
        ).toBe(
          openingEvent.id,
        );

        expect(
          session
            .getActiveEventDefinition(),
        ).toEqual(
          openingEvent,
        );
      },
    );

    it(
      'queues the JSON-defined follow-up through the normal decision system',
      () => {
        const registry =
          createEventRegistry(
            loadPublicEventPacks(),
          );

        const openingEvent =
          findOnlyTurnOneEvent(
            registry.getEvents(),
          );

        const openingDecision =
          openingEvent.decisions[0];

        const queuedFollowUpId =
          openingDecision
            ?.queueEventIds
            ?.[0];

        if (
          !openingDecision
          || !queuedFollowUpId
        ) {
          throw new Error(
            [
              'The public turn-one event must have',
              'a decision with a queued follow-up.',
            ].join(
              ' ',
            ),
          );
        }

        const session =
          createCampaignSession(
            registry,
            () => 0,
          );

        session.startCampaign(
          'easy',
        );

        const decisionResult =
          session.chooseEventDecision(
            openingDecision.id,
          );

        expect(
          decisionResult?.performed,
        ).toBe(true);

        expect(
          decisionResult
            ?.nextState
            .phase,
        ).toBe(
          'player-actions',
        );

        expect(
          decisionResult
            ?.nextState
            .queuedEventIds,
        ).toContain(
          queuedFollowUpId,
        );

        const nextTurnState =
          session.endTurn();

        expect(
          nextTurnState?.phase,
        ).toBe(
          'resolving-events',
        );

        expect(
          nextTurnState
            ?.activeEventInstanceId,
        ).toBe(
          queuedFollowUpId,
        );
      },
    );

    it(
      'restarts the opening event for every new campaign',
      () => {
        const registry =
          createEventRegistry(
            loadPublicEventPacks(),
          );

        const openingEvent =
          findOnlyTurnOneEvent(
            registry.getEvents(),
          );

        const session =
          createCampaignSession(
            registry,
            () => 0,
          );

        const firstCampaign =
          session.startCampaign(
            'easy',
          );

        expect(
          firstCampaign
            .activeEventInstanceId,
        ).toBe(
          openingEvent.id,
        );

        const secondCampaign =
          session.startCampaign(
            'moderate',
          );

        expect(
          secondCampaign.currentTurn,
        ).toBe(
          1,
        );

        expect(
          secondCampaign
            .activeEventInstanceId,
        ).toBe(
          openingEvent.id,
        );
      },
    );
  },
);