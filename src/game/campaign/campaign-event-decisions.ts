import type {
  EventDecisionDefinition,
  EventDecisionId,
  GameEventDefinition,
} from '../../events/event-types';
import {
  applyCampaignEffects,
} from './campaign-effects';
import type {
  CampaignState,
} from './campaign-state';

export type CampaignEventDecisionFailureReason =
  | 'unknown-decision'
  | 'not-resolving-events'
  | 'insufficient-cash'
  | 'insufficient-favors'
  | 'insufficient-action-points'
  | 'missing-required-flags'
  | 'excluded-flags-present';

export interface CampaignEventDecisionAvailability {
  readonly canChoose:
    boolean;

  readonly failureReasons:
    readonly CampaignEventDecisionFailureReason[];

  readonly missingRequiredFlags:
    readonly string[];

  readonly presentExcludedFlags:
    readonly string[];
}

export interface CampaignEventDecisionResult {
  readonly event:
    GameEventDefinition;

  readonly decision:
    EventDecisionDefinition | null;

  readonly performed:
    boolean;

  readonly previousState:
    CampaignState;

  readonly nextState:
    CampaignState;

  readonly failureReasons:
    readonly CampaignEventDecisionFailureReason[];

  readonly missingRequiredFlags:
    readonly string[];

  readonly presentExcludedFlags:
    readonly string[];
}

/**
 * Evaluates whether one event decision is currently available.
 *
 * All failures are reported together so the eventual event panel
 * can explain every unmet condition rather than showing only the
 * first failure.
 */
export function evaluateCampaignEventDecisionAvailability(
  campaignState:
    CampaignState,

  decision:
    EventDecisionDefinition,
): CampaignEventDecisionAvailability {
  const failureReasons:
    CampaignEventDecisionFailureReason[] = [];

  if (
    campaignState.phase
    !== 'resolving-events'
  ) {
    failureReasons.push(
      'not-resolving-events',
    );
  }

  const requirements =
    decision.requirements;

  const minimumCash =
    requirements?.minimumCash
    ?? 0;

  if (
    campaignState.resources.cash
    < minimumCash
  ) {
    failureReasons.push(
      'insufficient-cash',
    );
  }

  const minimumFavors =
    requirements?.minimumFavors
    ?? 0;

  if (
    campaignState.resources.favors
    < minimumFavors
  ) {
    failureReasons.push(
      'insufficient-favors',
    );
  }

  const minimumActionPoints =
    requirements?.minimumActionPoints
    ?? 0;

  if (
    campaignState
      .resources
      .actionPoints
    < minimumActionPoints
  ) {
    failureReasons.push(
      'insufficient-action-points',
    );
  }

  const currentFlags =
    new Set(
      campaignState.flags,
    );

  const missingRequiredFlags =
    (
      requirements
        ?.requiredFlags
      ?? []
    ).filter(
      (requiredFlag) =>
        !currentFlags.has(
          requiredFlag,
        ),
    );

  if (
    missingRequiredFlags.length
    > 0
  ) {
    failureReasons.push(
      'missing-required-flags',
    );
  }

  const presentExcludedFlags =
    (
      requirements
        ?.excludedFlags
      ?? []
    ).filter(
      (excludedFlag) =>
        currentFlags.has(
          excludedFlag,
        ),
    );

  if (
    presentExcludedFlags.length
    > 0
  ) {
    failureReasons.push(
      'excluded-flags-present',
    );
  }

  return {
    canChoose:
      failureReasons.length
      === 0,

    failureReasons,

    missingRequiredFlags,

    presentExcludedFlags,
  };
}

/**
 * Resolves a selected decision without mutating the supplied
 * campaign state.
 *
 * Successful decisions:
 *
 * - Apply campaign resource and metric effects.
 * - Add and remove campaign flags.
 * - Queue follow-up events.
 * - Add generated headlines to the news feed.
 * - Mark the current event as completed.
 * - Clear the active event.
 * - Return the campaign to the player-actions phase.
 *
 * CampaignSession will later own committing this result,
 * evaluating immediate end-game conditions, and notifying
 * subscribers.
 */
export function resolveCampaignEventDecision(
  campaignState:
    CampaignState,

  event:
    GameEventDefinition,

  decisionId:
    EventDecisionId,
): CampaignEventDecisionResult {
  const decision =
    event.decisions.find(
      (candidateDecision) =>
        candidateDecision.id
        === decisionId,
    )
    ?? null;

  if (!decision) {
    return {
      event,

      decision:
        null,

      performed:
        false,

      previousState:
        campaignState,

      nextState:
        campaignState,

      failureReasons: [
        'unknown-decision',
      ],

      missingRequiredFlags:
        [],

      presentExcludedFlags:
        [],
    };
  }

  const availability =
    evaluateCampaignEventDecisionAvailability(
      campaignState,
      decision,
    );

  if (
    !availability.canChoose
  ) {
    return {
      event,

      decision,

      performed:
        false,

      previousState:
        campaignState,

      nextState:
        campaignState,

      failureReasons:
        availability
          .failureReasons,

      missingRequiredFlags:
        availability
          .missingRequiredFlags,

      presentExcludedFlags:
        availability
          .presentExcludedFlags,
    };
  }

  const affectedState =
    applyCampaignEffects(
      campaignState,
      decision.effects
      ?? {},
    );

  const nextState:
    CampaignState = {
      ...affectedState,

      phase:
        'player-actions',

      flags:
        applyEventFlagChanges(
          affectedState.flags,
          decision,
        ),

      activeEventInstanceId:
        null,

      queuedEventIds:
        mergeUniqueStrings(
          affectedState
            .queuedEventIds,

          decision.queueEventIds
          ?? [],
        ),

      completedEventIds:
        mergeUniqueStrings(
          affectedState
            .completedEventIds,

          [
            event.id,
          ],
        ),

      newsFeed:
        mergeCampaignNewsItems(
          affectedState.newsFeed,

          (
            decision.newsItems
            ?? []
          ).map(
            (newsItem) =>
              newsItem.headline,
          ),
        ),
    };

  return {
    event,

    decision,

    performed:
      true,

    previousState:
      campaignState,

    nextState,

    failureReasons:
      [],

    missingRequiredFlags:
      [],

    presentExcludedFlags:
      [],
  };
}

function applyEventFlagChanges(
  currentFlags:
    readonly string[],

  decision:
    EventDecisionDefinition,
): readonly string[] {
  const flagsToRemove =
    new Set(
      decision.removeFlags
      ?? [],
    );

  const retainedFlags =
    currentFlags.filter(
      (currentFlag) =>
        !flagsToRemove.has(
          currentFlag,
        ),
    );

  /*
   * Additions are applied after removals. Therefore, when one
   * definition lists the same flag in both arrays, adding wins.
   */
  return mergeUniqueStrings(
    retainedFlags,
    decision.addFlags
    ?? [],
  );
}

function mergeUniqueStrings<
  T extends string,
>(
  currentValues:
    readonly T[],

  newValues:
    readonly T[],
): readonly T[] {
  const mergedValues:
    T[] = [];

  const seenValues =
    new Set<T>();

  for (
    const value
    of [
      ...currentValues,
      ...newValues,
    ]
  ) {
    if (
      seenValues.has(
        value,
      )
    ) {
      continue;
    }

    seenValues.add(
      value,
    );

    mergedValues.push(
      value,
    );
  }

  return mergedValues;
}

/**
 * Places new headlines before older stories and removes blank or
 * duplicate entries.
 */
function mergeCampaignNewsItems(
  currentNewsItems:
    readonly string[],

  newNewsItems:
    readonly string[],
): readonly string[] {
  const mergedNewsItems:
    string[] = [];

  const seenNewsItems =
    new Set<string>();

  for (
    const newsItem
    of [
      ...newNewsItems,
      ...currentNewsItems,
    ]
  ) {
    const normalizedNewsItem =
      newsItem.trim();

    if (
      normalizedNewsItem.length
        === 0
      || seenNewsItems.has(
        normalizedNewsItem,
      )
    ) {
      continue;
    }

    seenNewsItems.add(
      normalizedNewsItem,
    );

    mergedNewsItems.push(
      normalizedNewsItem,
    );
  }

  return mergedNewsItems;
}