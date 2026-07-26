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
  parseEventPackDefinition,
} from './event-validation';

const characterEventPack =
  parseEventPackDefinition(
    JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          'public',
          'assets',
          'common',
          'events',
          'characters',
          'character-events.json',
        ),
        'utf8',
      ),
    ) as unknown,
  );

describe(
  'public character events',
  () => {
    it(
      'registers six distinct character events',
      () => {
        expect(
          characterEventPack.events.map(
            (event) =>
              event.id,
          ),
        ).toEqual([
          'event_characters_01',
          'event_characters_02',
          'event_characters_03',
          'event_characters_04',
          'event_characters_05',
          'event_characters_06',
        ]);
      },
    );

    it(
      'uses non-repeatable chance triggers',
      () => {
        expect(
          characterEventPack.events.every(
            (event) =>
              event.repeatable
              === false
              && event.trigger.type
              === 'chance'
              && event.trigger
                .chancePercent
              === 25,
          ),
        ).toBe(true);
      },
    );

    it(
      'maps every event to its character illustration',
      () => {
        expect(
          characterEventPack.events.map(
            (event) =>
              event.imagePath,
          ),
        ).toEqual([
          'characters/buster-at-the-podium.webp',
          'characters/judge.webp',
          'characters/odd-staffer.webp',
          'characters/staffer.webp',
          'characters/surrogate.webp',
          'characters/totally-alive-buster.webp',
        ]);
      },
    );

    it(
      'keeps at least one decision available without resources',
      () => {
        expect(
          characterEventPack.events.every(
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
