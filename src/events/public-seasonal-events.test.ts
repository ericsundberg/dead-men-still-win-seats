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
  createEventRegistry,
} from './event-registry';
import {
  parseEventPackDefinition,
} from './event-validation';
import {
  activateNextCampaignEvent,
} from '../game/campaign/campaign-event-runner';
import {
  createInitialCampaignState,
} from '../game/campaign/campaign-state';

const seasonalEventPack =
  parseEventPackDefinition(
    JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          'public',
          'assets',
          'common',
          'events',
          'seasonal',
          'seasonal-events.json',
        ),
        'utf8',
      ),
    ) as unknown,
  );

const seasonalRegistry =
  createEventRegistry([
    seasonalEventPack,
  ]);

describe(
  'public seasonal events',
  () => {
    it(
      'makes the State Fair valid during both early-September turns',
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
              {
                ...createInitialCampaignState(
                  'easy',
                ),

                currentTurn,
              },
              seasonalRegistry,
              () => 0.999,
            );

          expect(
            result.event?.id,
          ).toBe(
            'event_seasonal_01',
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
      'defines the State Fair as a non-repeatable September window event',
      () => {
        const stateFair =
          seasonalRegistry.getEvent(
            'event_seasonal_01',
          );

        expect(
          stateFair?.trigger,
        ).toEqual({
          type:
            'turn-window',

          startTurn:
            4,

          endTurn:
            5,
        });

        expect(
          stateFair?.repeatable,
        ).toBe(false);

        expect(
          stateFair?.imagePath,
        ).toBe(
          'locations/statefair.webp',
        );
      },
    );

    it(
      'provides three repeatable fallback events',
      () => {
        const fallbackEvents =
          seasonalEventPack
            .events
            .filter(
              (event) =>
                event.trigger.type
                === 'fallback',
            );

        expect(
          fallbackEvents.map(
            (event) =>
              event.id,
          ),
        ).toEqual([
          'event_seasonal_02',
          'event_seasonal_03',
          'event_seasonal_04',
        ]);

        expect(
          fallbackEvents.every(
            (event) =>
              event.repeatable
              === true,
          ),
        ).toBe(true);
      },
    );

    it(
      'guarantees a fallback after the State Fair window',
      () => {
        const result =
          activateNextCampaignEvent(
            {
              ...createInitialCampaignState(
                'easy',
              ),

              currentTurn:
                6,

              completedEventIds: [
                'event_seasonal_01',
                'event_seasonal_02',
                'event_seasonal_03',
                'event_seasonal_04',
              ],
            },
            seasonalRegistry,
            () => 0.999,
          );

        expect(
          result.activated,
        ).toBe(true);

        expect(
          result.source,
        ).toBe(
          'fallback',
        );

        expect(
          result.event
            ?.trigger
            .type,
        ).toBe(
          'fallback',
        );
      },
    );

    it(
      'keeps a no-cost decision on every seasonal event',
      () => {
        expect(
          seasonalEventPack.events.every(
            (event) =>
              event.decisions.some(
                (decision) =>
                  decision.requirements
                  === undefined,
              ),
          ),
        ).toBe(true);
      },
    );
  },
);
