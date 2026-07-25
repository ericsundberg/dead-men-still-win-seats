import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';
import {
    mkdir,
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from 'node:fs/promises';
import {
    join,
} from 'node:path';
import {
    tmpdir,
} from 'node:os';
import {
    buildEventManifest,
    discoverEventPackJsonFiles,
} from './build_event_manifest.mjs';

let temporaryDirectoryPath =
null;

afterEach(
    async () => {
        if (
            !temporaryDirectoryPath
        ) {
            return;
        }

        await rm(
            temporaryDirectoryPath,
            {
                recursive:
                true,

                force:
                    true,
            },
        );

        temporaryDirectoryPath =
        null;
    },
);

async function createTemporaryEventRoot() {
    temporaryDirectoryPath =
    await mkdtemp(
        join(
            tmpdir(),
             'dead-men-events-',
        ),
    );

    const eventRootPath =
    join(
        temporaryDirectoryPath,
         'public',
         'assets',
         'common',
         'events',
    );

    await mkdir(
        eventRootPath,
        {
            recursive:
            true,
        },
    );

    return eventRootPath;
}

async function writeJsonFile(
    filePath,
    value,
) {
    await mkdir(
        join(
            filePath,
             '..',
        ),
        {
            recursive:
            true,
        },
    );

    await writeFile(
        filePath,
        [
            JSON.stringify(
                value,
                null,
                2,
            ),
            '',
        ].join('\n'),
                    'utf8',
    );
}

describe(
    'event manifest generator',
    () => {
        it(
            'recursively discovers every valid JSON file except the generated manifest',
           async () => {
               const eventRootPath =
               await createTemporaryEventRoot();

               await writeJsonFile(
                   join(
                       eventRootPath,
                        'manifest.json',
                   ),
                   {
                       eventPacks: [],
                   },
               );

               await writeJsonFile(
                   join(
                       eventRootPath,
                        'media',
                        'routine-press.json',
                   ),
                   {
                       eventPackId:
                       'events_media_routine',
                   },
               );

               await writeJsonFile(
                   join(
                       eventRootPath,
                        'audits',
                        'state-audit.JSON',
                   ),
                   {
                       eventPackId:
                       'events_audits_state',
                   },
               );

               await writeFile(
                   join(
                       eventRootPath,
                        'README.txt',
                   ),
                   'Not an event pack.',
                   'utf8',
               );

               await expect(
                   discoverEventPackJsonFiles(
                       eventRootPath,
                   ),
               ).resolves.toEqual([
                   'audits/state-audit.JSON',
                   'media/routine-press.json',
               ]);
           },
        );

        it(
            'rejects a discovered file containing malformed JSON',
           async () => {
               const eventRootPath =
               await createTemporaryEventRoot();

               await writeFile(
                   join(
                       eventRootPath,
                        'broken.json',
                   ),
                   '{"eventPackId":',
                   'utf8',
               );

               await expect(
                   discoverEventPackJsonFiles(
                       eventRootPath,
                   ),
               ).rejects.toThrow(
                   [
                       '[events] invalid JSON file:',
                       'broken.json',
                   ].join(' '),
               );
           },
        );

        it(
            'writes a deterministic manifest only when its contents change',
           async () => {
               const eventRootPath =
               await createTemporaryEventRoot();

               await writeJsonFile(
                   join(
                       eventRootPath,
                        'media',
                        'media-events.json',
                   ),
                   {
                       eventPackId:
                       'events_media',
                   },
               );

               await writeJsonFile(
                   join(
                       eventRootPath,
                        'festivals',
                        'festival-events.json',
                   ),
                   {
                       eventPackId:
                       'events_festivals',
                   },
               );

               const firstResult =
               await buildEventManifest(
                   eventRootPath,
               );

               expect(
                   firstResult.changed,
               ).toBe(true);

               expect(
                   firstResult.eventPackPaths,
               ).toEqual([
                   'festivals/festival-events.json',
                   'media/media-events.json',
               ]);

               await expect(
                   readFile(
                       join(
                           eventRootPath,
                            'manifest.json',
                       ),
                       'utf8',
                   ),
               ).resolves.toBe(
                   [
                       '{',
                       '  "eventPacks": [',
                       '    "festivals/festival-events.json",',
                       '    "media/media-events.json"',
                       '  ]',
                       '}',
                       '',
                   ].join('\n'),
               );

               const secondResult =
               await buildEventManifest(
                   eventRootPath,
               );

               expect(
                   secondResult.changed,
               ).toBe(false);

               expect(
                   secondResult.eventPackPaths,
               ).toEqual(
                   firstResult
                   .eventPackPaths,
               );
           },
        );
    },
);
