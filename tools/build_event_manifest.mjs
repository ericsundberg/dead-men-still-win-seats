import {
    mkdir,
    readFile,
    readdir,
    writeFile,
} from 'node:fs/promises';
import {
    extname,
    relative,
    resolve,
    sep,
} from 'node:path';
import {
    fileURLToPath,
} from 'node:url';

export const eventManifestFileName =
'manifest.json';

export function getDefaultEventRootPath() {
    return resolve(
        process.cwd(),
                   'public',
                   'assets',
                   'common',
                   'events',
    );
}

/**
 * Recursively discovers every JSON file beneath the event root.
 *
 * The generated root manifest is excluded from discovery.
 * Every discovered file must contain syntactically valid JSON.
 * Event-pack schema validation remains the browser reader's
 * responsibility.
 */
export async function discoverEventPackJsonFiles(
    eventRootPath =
    getDefaultEventRootPath(),
) {
    const resolvedEventRootPath =
    resolve(
        eventRootPath,
    );

    const manifestPath =
    resolve(
        resolvedEventRootPath,
        eventManifestFileName,
    );

    const discoveredPaths = [];

    await mkdir(
        resolvedEventRootPath,
        {
            recursive:
            true,
        },
    );

    async function visitDirectory(
        directoryPath,
    ) {
        const directoryEntries =
        await readdir(
            directoryPath,
            {
                withFileTypes:
                true,
            },
        );

        for (
            const directoryEntry
            of directoryEntries
        ) {
            const entryPath =
            resolve(
                directoryPath,
                directoryEntry.name,
            );

            if (
                directoryEntry
                .isDirectory()
            ) {
                await visitDirectory(
                    entryPath,
                );

                continue;
            }

            if (
                !directoryEntry
                .isFile()
                || extname(
                    directoryEntry.name,
                ).toLowerCase()
                !== '.json'
                || entryPath
                === manifestPath
            ) {
                continue;
            }

            const relativePath =
            normalizeRelativePath(
                resolvedEventRootPath,
                entryPath,
            );

            const jsonSource =
            await readFile(
                entryPath,
                'utf8',
            );

            try {
                JSON.parse(
                    jsonSource,
                );
            } catch (error) {
                throw new Error(
                    [
                        '[events] invalid JSON file:',
                        relativePath,
                    ].join(' '),
                                {
                                    cause:
                                    error,
                                },
                );
            }

            discoveredPaths.push(
                relativePath,
            );
        }
    }

    await visitDirectory(
        resolvedEventRootPath,
    );

    return discoveredPaths
    .sort();
}

export function createEventManifestDocument(
    eventPackPaths,
) {
    return {
        eventPacks: [
            ...eventPackPaths,
        ],
    };
}

export function serializeEventManifest(
    eventPackPaths,
) {
    return [
        JSON.stringify(
            createEventManifestDocument(
                eventPackPaths,
            ),
            null,
            2,
        ),
        '',
    ].join('\n');
}

/**
 * Regenerates the public event manifest.
 *
 * The file is rewritten only when its contents change. This keeps
 * normal development commands from creating meaningless working
 * tree changes.
 */
export async function buildEventManifest(
    eventRootPath =
    getDefaultEventRootPath(),
) {
    const resolvedEventRootPath =
    resolve(
        eventRootPath,
    );

    const manifestPath =
    resolve(
        resolvedEventRootPath,
        eventManifestFileName,
    );

    const eventPackPaths =
    await discoverEventPackJsonFiles(
        resolvedEventRootPath,
    );

    const nextManifestSource =
    serializeEventManifest(
        eventPackPaths,
    );

    let currentManifestSource =
    null;

    try {
        currentManifestSource =
        await readFile(
            manifestPath,
            'utf8',
        );
    } catch (error) {
        if (
            !isMissingFileError(
                error,
            )
        ) {
            throw error;
        }
    }

    if (
        currentManifestSource
        === nextManifestSource
    ) {
        return {
            changed:
            false,

            eventPackPaths,

            manifestPath,
        };
    }

    await writeFile(
        manifestPath,
        nextManifestSource,
        'utf8',
    );

    return {
        changed:
        true,

        eventPackPaths,

        manifestPath,
    };
}

function normalizeRelativePath(
    rootPath,
    filePath,
) {
    return relative(
        rootPath,
        filePath,
    )
    .split(sep)
    .join('/');
}

function isMissingFileError(
    error,
) {
    return (
        error
        instanceof Error
        && 'code' in error
        && error.code
        === 'ENOENT'
    );
}

function isDirectExecution() {
    const entryPath =
    process.argv[1];

    if (!entryPath) {
        return false;
    }

    return (
        resolve(
            entryPath,
        )
        === fileURLToPath(
            import.meta.url,
        )
    );
}

if (
    isDirectExecution()
) {
    buildEventManifest()
    .then(
        (result) => {
            const status =
            result.changed
            ? 'wrote'
            : 'unchanged';

            console.log(
                [
                    `[events] manifest ${status};`,
                    `${result.eventPackPaths.length}`,
                    result.eventPackPaths.length
                    === 1
                    ? 'event pack file'
                    : 'event pack files',
                ].join(' '),
            );
        },
    )
    .catch(
        (error) => {
            console.error(
                '[events] failed to build event manifest',
                error,
            );

            process.exitCode =
            1;
        },
    );
}
