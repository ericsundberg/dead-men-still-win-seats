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
  activateNextCampaignEvent,
} from '../game/campaign/campaign-event-runner';
import {
  createInitialCampaignState,
  type CampaignState,
} from '../game/campaign/campaign-state';
import {
  createEventRegistry,
  type EventRegistry,
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

function loadPublicEventRegistry():
  EventRegistry {
  return createEventRegistry(
    loadPublicEventPacks(),
  );
}

function createTurnThreeCampaignState(
  flags:
    readonly string[],
): CampaignState {
  return {
    ...createInitialCampaignState(
      'easy',
    ),

    currentTurn:
      3,

    phase:
      'turn-start',

    flags,

    completedEventIds: [
      'event_media_01',
      'event_media_02',
    ],
  };
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
          'event_media_02',
          'event_media_03',
          'event_media_04',
          'event_media_05',
        ]);
      },
    );

    it(
      'defines the interviewer ambush as the first mandatory event',
      () => {
        const registry =
          loadPublicEventRegistry();

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
        const registry =
          loadPublicEventRegistry();

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

    it(
      'queues the voicemail follow-up from every opening response',
      () => {
        const registry =
          loadPublicEventRegistry();

        const event =
          registry.getEvent(
            'event_media_01',
          );

        expect(
          event?.decisions.map(
            (decision) =>
              decision.queueEventIds,
          ),
        ).toEqual([
          [
            'event_media_02',
          ],
          [
            'event_media_02',
          ],
          [
            'event_media_02',
          ],
          [
            'event_media_02',
          ],
        ]);
      },
    );

    it(
      'defines the voicemail event as a queued manual follow-up',
      () => {
        const registry =
          loadPublicEventRegistry();

        const event =
          registry.getEvent(
            'event_media_02',
          );

        expect(
          event,
        ).not.toBeNull();

        expect(
          event?.title,
        ).toBe(
          'The Voicemail That Shouldn’t Exist',
        );

        expect(
          event?.trigger,
        ).toEqual({
          type:
            'manual',
        });

        expect(
          event?.repeatable,
        ).toBe(false);

        expect(
          event?.decisions.map(
            (decision) =>
              decision.id,
          ),
        ).toEqual([
          'decision_call_it_deepfake',
          'decision_buy_the_recording',
          'decision_blame_staffer',
          'decision_release_audio_splice',
        ]);
      },
    );

    it(
      'defines specific debate variants before the general fallback',
      () => {
        const registry =
          loadPublicEventRegistry();

        const debateEvents = [
          registry.getEvent(
            'event_media_03',
          ),
          registry.getEvent(
            'event_media_04',
          ),
          registry.getEvent(
            'event_media_05',
          ),
        ];

        expect(
          debateEvents.map(
            (event) =>
              event?.trigger,
          ),
        ).toEqual([
          {
            type:
              'turn',

            turn:
              3,
          },
          {
            type:
              'turn',

            turn:
              3,
          },
          {
            type:
              'turn',

            turn:
              3,
          },
        ]);

        expect(
          debateEvents.map(
            (event) =>
              event?.requirements
                ?.requiredFlags
              ?? [],
          ),
        ).toEqual([
          [
            'flag_doctor_bribed',
            'flag_voicemail_buried',
          ],
          [
            'flag_reporter_stonewalled',
            'flag_voicemail_deepfake_claim',
          ],
          [],
        ]);
      },
    );

    it(
      'selects the doctor-coverup debate from both prior flags',
      () => {
        const result =
          activateNextCampaignEvent(
            createTurnThreeCampaignState([
              'flag_doctor_bribed',
              'flag_voicemail_buried',
            ]),
            loadPublicEventRegistry(),
            () => 1,
          );

        expect(
          result.event?.id,
        ).toBe(
          'event_media_03',
        );

        expect(
          result.source,
        ).toBe(
          'turn',
        );
      },
    );

    it(
      'selects the original-audio debate from both prior flags',
      () => {
        const result =
          activateNextCampaignEvent(
            createTurnThreeCampaignState([
              'flag_reporter_stonewalled',
              'flag_voicemail_deepfake_claim',
            ]),
            loadPublicEventRegistry(),
            () => 1,
          );

        expect(
          result.event?.id,
        ).toBe(
          'event_media_04',
        );

        expect(
          result.source,
        ).toBe(
          'turn',
        );
      },
    );

    it(
      'uses the general debate for every other flag combination',
      () => {
        const result =
          activateNextCampaignEvent(
            createTurnThreeCampaignState([
              'flag_medical_records_recycled',
              'flag_staffer_scapegoated',
            ]),
            loadPublicEventRegistry(),
            () => 1,
          );

        expect(
          result.event?.id,
        ).toBe(
          'event_media_05',
        );

        expect(
          result.source,
        ).toBe(
          'turn',
        );
      },
    );
  },
);