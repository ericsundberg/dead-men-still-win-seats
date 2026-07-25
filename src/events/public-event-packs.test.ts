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
  parseEventPackManifest,
} from './event-pack-loader';
import type {
  EventPackDefinition,
} from './event-types';
import {
  parseEventPackDefinition,
  validateEventPackDefinition,
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
  const source =
    readFileSync(
      filePath,
      'utf8',
    );

  return JSON.parse(
    source,
  ) as unknown;
}

function loadPublicEventPacks():
  readonly EventPackDefinition[] {
  const manifestInput =
    readJsonFile(
      join(
        publicEventRootPath,
        'manifest.json',
      ),
    );

  const manifest =
    parseEventPackManifest(
      manifestInput,
    );

  return manifest.eventPacks.map(
    (eventPackPath) =>
      parseEventPackDefinition(
        readJsonFile(
          join(
            publicEventRootPath,
            ...eventPackPath
              .split('/'),
          ),
        ),
      ),
  );
}

describe(
  'public event packs',
  () => {
    it(
      'lists the media event pack in the generated manifest',
      () => {
        const manifest =
          parseEventPackManifest(
            readJsonFile(
              join(
                publicEventRootPath,
                'manifest.json',
              ),
            ),
          );

        expect(
          manifest.eventPacks,
        ).toEqual([
          'media/media-events.json',
        ]);
      },
    );

    it(
      'validates and registers every public event pack',
      () => {
        const eventPacks =
          loadPublicEventPacks();

        for (
          const eventPack
          of eventPacks
        ) {
          expect(
            validateEventPackDefinition(
              eventPack,
            ),
          ).toEqual([]);
        }

        const registry =
          createEventRegistry(
            eventPacks,
          );

        expect(
          registry.getEventPackIds(),
        ).toEqual([
          'events_media',
        ]);

        expect(
          registry.getEventIds(),
        ).toEqual([
          'event_media_01',
        ]);
      },
    );

    it(
      'defines the interviewer ambush as the first mandatory event',
      () => {
        const eventPacks =
          loadPublicEventPacks();

        const registry =
          createEventRegistry(
            eventPacks,
          );

        const event =
          registry.getEvent(
            'event_media_01',
          );

        expect(
          event,
        ).not.toBeNull();

        expect(
          event?.title,
        ).toBe(
          'The Camera Is Already Rolling',
        );

        expect(
          event?.trigger,
        ).toEqual({
          type:
            'turn',

          turn:
            1,
        });

        expect(
          event?.repeatable,
        ).toBe(false);
      },
    );

    it(
      'provides all four medical-record responses',
      () => {
        const eventPacks =
          loadPublicEventPacks();

        const registry =
          createEventRegistry(
            eventPacks,
          );

        const event =
          registry.getEvent(
            'event_media_01',
          );

        expect(
          event?.decisions.map(
            (decision) =>
              decision.id,
          ),
        ).toEqual([
          'decision_release_old_records',
          'decision_bribe_doctor',
          'decision_declare_records_unconstitutional',
          'decision_no_comment',
        ]);

        expect(
          event?.decisions.map(
            (decision) =>
              decision.label,
          ),
        ).toEqual([
          'Release last year’s records with the date cropped out.',
          'Bribe a doctor to say the Senator is “strong as an ox.”',
          'Declare that medical records are an unconstitutional invasion of privacy.',
          'No comment.',
        ]);
      },
    );
  },
);