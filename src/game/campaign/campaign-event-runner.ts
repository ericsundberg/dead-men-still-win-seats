import type {
  EventRegistry,
} from '../../events/event-registry';
import type {
  EventId,
  GameEventDefinition,
} from '../../events/event-types';
import type {
  CampaignState,
} from './campaign-state';

export type CampaignEventEligibilityFailureReason =
  | 'already-completed'
  | 'insufficient-cash'
  | 'insufficient-favors'
  | 'insufficient-action-points'
  | 'missing-required-flags'
  | 'excluded-flags-present';

export type CampaignEventActivationSource =
  | 'queued'
  | 'turn'
  | 'chance';

export interface CampaignEventEligibility {
  readonly isEligible:
    boolean;

  readonly failureReasons:
    readonly CampaignEventEligibilityFailureReason[];

  readonly missingRequiredFlags:
    readonly string[];

  readonly presentExcludedFlags:
    readonly string[];
}

export interface CampaignEventActivationResult {
  readonly activated:
    boolean;

  readonly event:
    GameEventDefinition | null;

  readonly source:
    CampaignEventActivationSource | null;

  readonly previousState:
    CampaignState;

  readonly nextState:
    CampaignState;
}

/**
 * Checks whether an event can currently be activated.
 *
 * Trigger timing is handled separately by
 * activateNextCampaignEvent().
 */
export function evaluateCampaignEventEligibility(
  campaignState:
    CampaignState,

  event:
    GameEventDefinition,
): CampaignEventEligibility {
  const failureReasons:
    CampaignEventEligibilityFailureReason[] = [];

  if (
    !event.repeatable
    && campaignState
      .completedEventIds
      .includes(
        event.id,
      )
  ) {
    failureReasons.push(
      'already-completed',
    );
  }

  const requirements =
    event.requirements;

  if (
    campaignState.resources.cash
    < (
      requirements?.minimumCash
      ?? 0
    )
  ) {
    failureReasons.push(
      'insufficient-cash',
    );
  }

  if (
    campaignState.resources.favors
    < (
      requirements?.minimumFavors
      ?? 0
    )
  ) {
    failureReasons.push(
      'insufficient-favors',
    );
  }

  if (
    campaignState
      .resources
      .actionPoints
    < (
      requirements
        ?.minimumActionPoints
      ?? 0
    )
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
    isEligible:
      failureReasons.length
      === 0,

    failureReasons,

    missingRequiredFlags,

    presentExcludedFlags,
  };
}

/**
 * Finds and activates the next event at turn start.
 *
 * Selection priority:
 *
 * 1. Queued events.
 * 2. Events scheduled for the current turn.
 * 3. Chance events.
 *
 * Manual events activate only when they have been queued.
 */
export function activateNextCampaignEvent(
  campaignState:
    CampaignState,

  eventRegistry:
    EventRegistry,

  random:
    () => number =
      Math.random,
): CampaignEventActivationResult {
  if (
    campaignState.phase
    !== 'turn-start'
    || campaignState
      .activeEventInstanceId
      !== null
  ) {
    return createUnchangedResult(
      campaignState,
    );
  }

  const queuedEvent =
    findEligibleQueuedEvent(
      campaignState,
      eventRegistry,
    );

  if (queuedEvent) {
    return activateEvent(
      campaignState,
      queuedEvent,
      'queued',
    );
  }

  const turnEvent =
    eventRegistry
      .getEvents()
      .find(
        (event) =>
          event.trigger.type
            === 'turn'
          && event.trigger.turn
            === campaignState
              .currentTurn
          && evaluateCampaignEventEligibility(
            campaignState,
            event,
          ).isEligible,
      );

  if (turnEvent) {
    return activateEvent(
      campaignState,
      turnEvent,
      'turn',
    );
  }

  for (
    const event
    of eventRegistry.getEvents()
  ) {
    if (
      event.trigger.type
      !== 'chance'
    ) {
      continue;
    }

    const eligibility =
      evaluateCampaignEventEligibility(
        campaignState,
        event,
      );

    if (
      !eligibility.isEligible
    ) {
      continue;
    }

    const randomPercent =
      normalizeRandomValue(
        random(),
      )
      * 100;

    if (
      randomPercent
      < event.trigger
        .chancePercent
    ) {
      return activateEvent(
        campaignState,
        event,
        'chance',
      );
    }
  }

  const playerActionsState:
    CampaignState = {
      ...campaignState,

      phase:
        'player-actions',

      activeEventInstanceId:
        null,
    };

  return {
    activated:
      false,

    event:
      null,

    source:
      null,

    previousState:
      campaignState,

    nextState:
      playerActionsState,
  };
}

function findEligibleQueuedEvent(
  campaignState:
    CampaignState,

  eventRegistry:
    EventRegistry,
): GameEventDefinition | null {
  for (
    const queuedEventId
    of campaignState.queuedEventIds
  ) {
    const event =
      eventRegistry.getEvent(
        queuedEventId as EventId,
      );

    if (!event) {
      continue;
    }

    if (
      evaluateCampaignEventEligibility(
        campaignState,
        event,
      ).isEligible
    ) {
      return event;
    }
  }

  return null;
}

function activateEvent(
  campaignState:
    CampaignState,

  event:
    GameEventDefinition,

  source:
    CampaignEventActivationSource,
): CampaignEventActivationResult {
  const nextQueuedEventIds =
    source === 'queued'
      ? removeFirstValue(
          campaignState
            .queuedEventIds,
          event.id,
        )
      : campaignState
          .queuedEventIds;

  const nextState:
    CampaignState = {
      ...campaignState,

      phase:
        'resolving-events',

      activeEventInstanceId:
        event.id,

      queuedEventIds:
        nextQueuedEventIds,
    };

  return {
    activated:
      true,

    event,

    source,

    previousState:
      campaignState,

    nextState,
  };
}

function createUnchangedResult(
  campaignState:
    CampaignState,
): CampaignEventActivationResult {
  return {
    activated:
      false,

    event:
      null,

    source:
      null,

    previousState:
      campaignState,

    nextState:
      campaignState,
  };
}

function removeFirstValue(
  values:
    readonly string[],

  valueToRemove:
    string,
): readonly string[] {
  const valueIndex =
    values.indexOf(
      valueToRemove,
    );

  if (
    valueIndex
    < 0
  ) {
    return values;
  }

  return [
    ...values.slice(
      0,
      valueIndex,
    ),

    ...values.slice(
      valueIndex
      + 1,
    ),
  ];
}

function normalizeRandomValue(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 1;
  }

  return Math.min(
    0.999_999_999,
    Math.max(
      0,
      value,
    ),
  );
}