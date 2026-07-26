import {
  existsSync,
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
  parseEventPackManifest,
} from './event-pack-loader';
import {
  parseEventPackDefinition,
} from './event-validation';

const publicRootPath =
  join(
    process.cwd(),
    'public',
  );

const publicEventRootPath =
  join(
    publicRootPath,
    'assets',
    'common',
    'events',
  );

const publicEventArtRootPath =
  join(
    publicRootPath,
    'assets',
    'art',
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

describe(
  'public event art',
  () => {
    it(
      'ships every image referenced by public event data',
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

        const imagePaths =
          manifest.eventPacks
            .flatMap(
              (eventPackPath) =>
                parseEventPackDefinition(
                  readJsonFile(
                    join(
                      publicEventRootPath,
                      ...eventPackPath.split('/'),
                    ),
                  ),
                ).events,
            )
            .flatMap(
              (event) =>
                event.imagePath
                  ? [event.imagePath]
                  : [],
            );

        expect(
          imagePaths,
        ).toEqual([
          'media/newscast.webp',
          'media/podcast.webp',
          'medical/hospital.webp',
          'media/newscast.webp',
          'locations/rotunda.webp',
        ]);

        for (
          const imagePath
          of imagePaths
        ) {
          expect(
            existsSync(
              join(
                publicEventArtRootPath,
                ...imagePath.split('/'),
              ),
            ),
            imagePath,
          ).toBe(true);
        }
      },
    );
  },
);
