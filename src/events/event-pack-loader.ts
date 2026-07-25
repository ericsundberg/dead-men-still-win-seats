import {
  createEventRegistry,
  type EventRegistry,
} from './event-registry';
import {
  parseEventPackDefinition,
} from './event-validation';

export const publicEventAssetRootPath =
  'assets/common/events';

export const publicEventManifestFileName =
  'manifest.json';

export interface EventPackManifest {
  readonly eventPacks:
    readonly string[];
}

export interface LoadPublicEventRegistryOptions {
  /**
   * Base URL from which public assets are served.
   *
   * The application startup code will eventually pass
   * import.meta.env.BASE_URL here. The root path is suitable for
   * tests and normal root-hosted development.
   */
  readonly baseUrl?:
    string;

  /**
   * Injectable fetch implementation for tests and non-browser
   * environments.
   */
  readonly fetcher?:
    typeof fetch;
}

export class EventPackLoadError
  extends Error {
  public constructor(
    message:
      string,

    options:
      ErrorOptions = {},
  ) {
    super(
      message,
      options,
    );

    this.name =
      'EventPackLoadError';
  }
}

/**
 * Validates and normalizes the generated public event manifest.
 *
 * Manifest paths must:
 *
 * - Be non-empty relative paths.
 * - End in .json, case-insensitively.
 * - Use forward slashes.
 * - Remain inside the public event root.
 * - Be unique.
 */
export function parseEventPackManifest(
  input:
    unknown,
): EventPackManifest {
  if (
    !isRecord(
      input,
    )
    || !Array.isArray(
      input.eventPacks,
    )
  ) {
    throw new EventPackLoadError(
      [
        '[events] invalid event manifest:',
        'eventPacks must be an array',
      ].join(' '),
    );
  }

  const eventPackPaths:
    string[] = [];

  const seenPaths =
    new Set<string>();

  input.eventPacks.forEach(
    (
      value,
      index,
    ) => {
      if (
        typeof value
        !== 'string'
      ) {
        throw new EventPackLoadError(
          [
            '[events] invalid event manifest:',
            `eventPacks[${index}] must be a string`,
          ].join(' '),
        );
      }

      const normalizedPath =
        value.trim();

      if (
        !isValidEventPackManifestPath(
          normalizedPath,
        )
      ) {
        throw new EventPackLoadError(
          [
            '[events] invalid event manifest path:',
            normalizedPath
            || `(empty path at index ${index})`,
          ].join(' '),
        );
      }

      if (
        seenPaths.has(
          normalizedPath,
        )
      ) {
        throw new EventPackLoadError(
          [
            '[events] duplicate event manifest path:',
            normalizedPath,
          ].join(' '),
        );
      }

      seenPaths.add(
        normalizedPath,
      );

      eventPackPaths.push(
        normalizedPath,
      );
    },
  );

  return {
    eventPacks:
      eventPackPaths,
  };
}

/**
 * Creates the browser-facing URL for the public event directory.
 */
export function createPublicEventRootUrl(
  baseUrl =
    '/',
): string {
  const normalizedBaseUrl =
    normalizeBaseUrl(
      baseUrl,
    );

  return [
    normalizedBaseUrl,
    publicEventAssetRootPath,
    '/',
  ].join('');
}

/**
 * Loads and validates every public event pack listed in the
 * generated manifest.
 *
 * A rejected load does not expose a partially populated registry.
 */
export async function loadPublicEventRegistry(
  options:
    LoadPublicEventRegistryOptions = {},
): Promise<EventRegistry> {
  const fetcher =
    options.fetcher
    ?? globalThis.fetch;

  if (
    typeof fetcher
    !== 'function'
  ) {
    throw new EventPackLoadError(
      '[events] no fetch implementation is available',
    );
  }

  const eventRootUrl =
    createPublicEventRootUrl(
      options.baseUrl,
    );

  const manifestUrl = [
    eventRootUrl,
    publicEventManifestFileName,
  ].join('');

  const manifestInput =
    await fetchJsonDocument(
      fetcher,
      manifestUrl,
      'event manifest',
    );

  const manifest =
    parseEventPackManifest(
      manifestInput,
    );

  const registry =
    createEventRegistry();

  for (
    const eventPackPath
    of manifest.eventPacks
  ) {
    const eventPackUrl = [
      eventRootUrl,
      encodeEventPackPath(
        eventPackPath,
      ),
    ].join('');

    const eventPackInput =
      await fetchJsonDocument(
        fetcher,
        eventPackUrl,
        `event pack ${eventPackPath}`,
      );

    try {
      const eventPack =
        parseEventPackDefinition(
          eventPackInput,
        );

      registry.registerPack(
        eventPack,
      );
    } catch (error) {
      throw new EventPackLoadError(
        [
          '[events] invalid event pack:',
          eventPackPath,
        ].join(' '),
        {
          cause:
            error,
        },
      );
    }
  }

  return registry;
}

function isValidEventPackManifestPath(
  path:
    string,
): boolean {
  if (
    path.length
      === 0
    || path.startsWith(
      '/',
    )
    || path.includes(
      '\\',
    )
    || path.includes(
      '?',
    )
    || path.includes(
      '#',
    )
    || !path
      .toLowerCase()
      .endsWith(
        '.json',
      )
  ) {
    return false;
  }

  let decodedPath:
    string;

  try {
    decodedPath =
      decodeURIComponent(
        path,
      );
  } catch {
    return false;
  }

  if (
    decodedPath.startsWith(
      '/',
    )
    || decodedPath.includes(
      '\\',
    )
  ) {
    return false;
  }

  const pathSegments =
    decodedPath.split(
      '/',
    );

  return pathSegments.every(
    (pathSegment) =>
      pathSegment.length
        > 0
      && pathSegment
        !== '.'
      && pathSegment
        !== '..',
  );
}

async function fetchJsonDocument(
  fetcher:
    typeof fetch,

  url:
    string,

  documentLabel:
    string,
): Promise<unknown> {
  let response:
    Response;

  try {
    response =
      await fetcher(
        url,
      );
  } catch (error) {
    throw new EventPackLoadError(
      [
        '[events] request failed for',
        `${documentLabel}:`,
        url,
      ].join(' '),
      {
        cause:
          error,
      },
    );
  }

  if (
    !response.ok
  ) {
    throw new EventPackLoadError(
      [
        '[events] failed to load',
        `${documentLabel}:`,
        url,
        `(HTTP ${response.status})`,
      ].join(' '),
    );
  }

  let source:
    string;

  try {
    source =
      await response.text();
  } catch (error) {
    throw new EventPackLoadError(
      [
        '[events] failed to read',
        `${documentLabel}:`,
        url,
      ].join(' '),
      {
        cause:
          error,
      },
    );
  }

  try {
    return JSON.parse(
      source,
    );
  } catch (error) {
    throw new EventPackLoadError(
      [
        '[events] invalid JSON in',
        `${documentLabel}:`,
        url,
      ].join(' '),
      {
        cause:
          error,
      },
    );
  }
}

function normalizeBaseUrl(
  baseUrl:
    string,
): string {
  const trimmedBaseUrl =
    baseUrl.trim();

  const usableBaseUrl =
    trimmedBaseUrl.length
      > 0
      ? trimmedBaseUrl
      : '/';

  return usableBaseUrl
    .endsWith('/')
      ? usableBaseUrl
      : `${usableBaseUrl}/`;
}

/**
 * Encode path segments individually so nested directories remain
 * intact while spaces and other URL-sensitive filename characters
 * are safe.
 */
function encodeEventPackPath(
  eventPackPath:
    string,
): string {
  return eventPackPath
    .split('/')
    .map(
      (pathSegment) =>
        encodeURIComponent(
          pathSegment,
        ),
    )
    .join('/');
}

function isRecord(
  input:
    unknown,
): input is Record<
  string,
  unknown
> {
  return (
    typeof input
      === 'object'
    && input
      !== null
    && !Array.isArray(
      input,
    )
  );
}