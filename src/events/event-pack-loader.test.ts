import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createPublicEventRootUrl,
  loadPublicEventRegistry,
  parseEventPackManifest,
} from './event-pack-loader';

interface MockFetchRoute {
  readonly body:
    string;

  readonly status?:
    number;
}

function createJsonRoute(
  value:
    unknown,

  status =
    200,
): MockFetchRoute {
  return {
    body:
      JSON.stringify(
        value,
      ),

    status,
  };
}

function createMockFetch(
  routes:
    Readonly<
      Record<
        string,
        MockFetchRoute
      >
    >,

  requestedUrls:
    string[] = [],
): typeof fetch {
  const mockFetch =
    async (
      input:
        RequestInfo | URL,
    ): Promise<Response> => {
      const url =
        String(
          input,
        );

      requestedUrls.push(
        url,
      );

      const route =
        routes[url];

      if (!route) {
        return new Response(
          'Not found.',
          {
            status:
              404,
          },
        );
      }

      return new Response(
        route.body,
        {
          status:
            route.status
            ?? 200,

          headers: {
            'content-type':
              'application/json',
          },
        },
      );
    };

    return mockFetch as typeof fetch;
}

const mediaEventPack = {
  eventPackId:
    'events_media',

  events: [
    {
      id:
        'event_media_01',

      title:
        'The Camera Is Already Rolling',

      description:
        'A reporter asks for the Senator’s medical records.',

      trigger: {
        type:
          'turn',

        turn:
          1,
      },

      repeatable:
        false,

      decisions: [
        {
          id:
            'decision_no_comment',

          label:
            'No comment.',
        },
      ],
    },
  ],
};

const festivalEventPack = {
  eventPackId:
    'events_festivals',

  events: [
    {
      id:
        'event_festivals_01',

      title:
        'The County Fair',

      description:
        'The campaign is expected to appear at the county fair.',

      trigger: {
        type:
          'turn',

        turn:
          4,
      },

      repeatable:
        false,

      decisions: [
        {
          id:
            'decision_send_surrogate',

          label:
            'Send a campaign surrogate.',
        },
      ],
    },
  ],
};

describe(
  'event pack loader',
  () => {
    it(
      'normalizes valid nested JSON paths from the manifest',
      () => {
        expect(
          parseEventPackManifest({
            eventPacks: [
              ' media/routine-press.json ',
              'festivals/FESTIVAL-EVENTS.JSON',
            ],
          }),
        ).toEqual({
          eventPacks: [
            'media/routine-press.json',
            'festivals/FESTIVAL-EVENTS.JSON',
          ],
        });
      },
    );

    it(
      'rejects malformed unsafe and duplicate manifest paths',
      () => {
        expect(
          () =>
            parseEventPackManifest({
              eventPacks:
                'media.json',
            }),
        ).toThrow(
          /eventPacks must be an array/,
        );

        expect(
          () =>
            parseEventPackManifest({
              eventPacks: [
                '../private/events.json',
              ],
            }),
        ).toThrow(
          /invalid event manifest path/,
        );

        expect(
          () =>
            parseEventPackManifest({
              eventPacks: [
                'media/events.json',
                'media/events.json',
              ],
            }),
        ).toThrow(
          /duplicate event manifest path/,
        );

        expect(
          () =>
            parseEventPackManifest({
              eventPacks: [
                'media/events.ts',
              ],
            }),
        ).toThrow(
          /invalid event manifest path/,
        );
      },
    );

    it(
      'constructs the public event root from a deployment base URL',
      () => {
        expect(
          createPublicEventRootUrl(
            '/',
          ),
        ).toBe(
          '/assets/common/events/',
        );

        expect(
          createPublicEventRootUrl(
            '/dead-men-still-win-seats',
          ),
        ).toBe(
          [
            '/dead-men-still-win-seats/',
            'assets/common/events/',
          ].join(''),
        );
      },
    );

    it(
      'loads an empty manifest into an empty registry',
      async () => {
        const requestedUrls:
          string[] = [];

        const fetcher =
          createMockFetch(
            {
              '/assets/common/events/manifest.json':
                createJsonRoute({
                  eventPacks:
                    [],
                }),
            },

            requestedUrls,
          );

        const registry =
          await loadPublicEventRegistry({
            fetcher,
          });

        expect(
          registry.getEventPackIds(),
        ).toEqual([]);

        expect(
          registry.getEventIds(),
        ).toEqual([]);

        expect(
          requestedUrls,
        ).toEqual([
          '/assets/common/events/manifest.json',
        ]);
      },
    );

    it(
      'loads validates and registers every listed event pack',
      async () => {
        const requestedUrls:
          string[] = [];

        const fetcher =
          createMockFetch(
            {
              '/game/assets/common/events/manifest.json':
                createJsonRoute({
                  eventPacks: [
                    'media/media events.json',
                    'festivals/festival-events.json',
                  ],
                }),

              '/game/assets/common/events/media/media%20events.json':
                createJsonRoute(
                  mediaEventPack,
                ),

              '/game/assets/common/events/festivals/festival-events.json':
                createJsonRoute(
                  festivalEventPack,
                ),
            },

            requestedUrls,
          );

        const registry =
          await loadPublicEventRegistry({
            baseUrl:
              '/game/',

            fetcher,
          });

        expect(
          registry.getEventPackIds(),
        ).toEqual([
          'events_media',
          'events_festivals',
        ]);

        expect(
          registry.getEventIds(),
        ).toEqual([
          'event_media_01',
          'event_festivals_01',
        ]);

        expect(
          registry.getEvent(
            'event_media_01',
          )?.title,
        ).toBe(
          'The Camera Is Already Rolling',
        );

        expect(
          requestedUrls,
        ).toEqual([
          '/game/assets/common/events/manifest.json',
          '/game/assets/common/events/media/media%20events.json',
          '/game/assets/common/events/festivals/festival-events.json',
        ]);
      },
    );

    it(
      'reports failed HTTP responses with the requested document',
      async () => {
        const fetcher =
          createMockFetch({
            '/assets/common/events/manifest.json': {
              body:
                'Unavailable.',

              status:
                503,
            },
          });

        await expect(
          loadPublicEventRegistry({
            fetcher,
          }),
        ).rejects.toThrow(
          [
            '[events] failed to load event manifest:',
            '/assets/common/events/manifest.json',
            '(HTTP 503)',
          ].join(' '),
        );
      },
    );

    it(
      'rejects malformed JSON and invalid event-pack schemas',
      async () => {
        const malformedJsonFetcher =
          createMockFetch({
            '/assets/common/events/manifest.json':
              createJsonRoute({
                eventPacks: [
                  'media.json',
                ],
              }),

            '/assets/common/events/media.json': {
              body:
                '{"eventPackId":',
            },
          });

        await expect(
          loadPublicEventRegistry({
            fetcher:
              malformedJsonFetcher,
          }),
        ).rejects.toThrow(
          [
            '[events] invalid JSON in event pack',
            'media.json:',
            '/assets/common/events/media.json',
          ].join(' '),
        );

        const invalidPackFetcher =
          createMockFetch({
            '/assets/common/events/manifest.json':
              createJsonRoute({
                eventPacks: [
                  'media.json',
                ],
              }),

            '/assets/common/events/media.json':
              createJsonRoute({
                eventPackId:
                  'not-a-valid-pack-id',

                events:
                  [],
              }),
          });

        await expect(
          loadPublicEventRegistry({
            fetcher:
              invalidPackFetcher,
          }),
        ).rejects.toThrow(
          [
            '[events] invalid event pack:',
            'media.json',
          ].join(' '),
        );
      },
    );
  },
);