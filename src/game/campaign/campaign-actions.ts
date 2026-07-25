import {
  applyCampaignEffects,
  type CampaignEffects,
} from './campaign-effects';
import type {
  CampaignState,
} from './campaign-state';

export type CampaignActionId =
  | 'closed-door-fundraiser';

export interface CampaignActionRequirements {
  readonly minimumCash?:
    number;

  readonly minimumFavors?:
    number;

  readonly minimumActionPoints?:
    number;
}

export interface CampaignActionDefinition {
  readonly id:
    CampaignActionId;

  readonly requirements:
    CampaignActionRequirements;

  readonly effects:
    CampaignEffects;
}

export type CampaignActionFailureReason =
  | 'not-player-actions'
  | 'insufficient-cash'
  | 'insufficient-favors'
  | 'insufficient-action-points';

export interface CampaignActionAvailability {
  readonly canPerform:
    boolean;

  readonly failureReasons:
    readonly CampaignActionFailureReason[];
}

export interface CampaignActionResult {
  readonly action:
    CampaignActionDefinition;

  readonly performed:
    boolean;

  readonly previousState:
    CampaignState;

  readonly nextState:
    CampaignState;

  readonly failureReasons:
    readonly CampaignActionFailureReason[];
}

export const campaignActionIds = [
  'closed-door-fundraiser',
] as const satisfies readonly CampaignActionId[];

const campaignActionDefinitions = {
  'closed-door-fundraiser': {
    id:
      'closed-door-fundraiser',

    requirements: {
      minimumActionPoints:
        1,
    },

    effects: {
      cash:
        25_000,

      actionPoints:
        -1,

      publicSuspicion:
        5,

      voterEnergy:
        -4,
    },
  },
} as const satisfies Record<
  CampaignActionId,
  CampaignActionDefinition
>;

export function getCampaignActionDefinition(
  actionId:
    CampaignActionId,
): CampaignActionDefinition {
  return campaignActionDefinitions[
    actionId
  ];
}

export function getCampaignActionDefinitions():
  readonly CampaignActionDefinition[] {
  return campaignActionIds.map(
    (actionId) =>
      getCampaignActionDefinition(
        actionId,
      ),
  );
}

/**
 * Determines whether an action may be performed in the supplied
 * campaign state.
 *
 * All unmet requirements are returned so the eventual interface
 * can explain every reason an action is unavailable.
 */
export function evaluateCampaignActionAvailability(
  campaignState:
    CampaignState,

  action:
    CampaignActionDefinition,
): CampaignActionAvailability {
  const failureReasons:
    CampaignActionFailureReason[] = [];

  if (
    campaignState.phase
    !== 'player-actions'
  ) {
    failureReasons.push(
      'not-player-actions',
    );
  }

  const minimumCash =
    action.requirements
      .minimumCash
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
    action.requirements
      .minimumFavors
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
    action.requirements
      .minimumActionPoints
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

  return {
    canPerform:
      failureReasons.length
      === 0,

    failureReasons,
  };
}

/**
 * Resolves one campaign action without mutating the supplied
 * state.
 *
 * This function performs no session work and sends no
 * notifications. CampaignSession will own those responsibilities
 * when actions are connected to the runtime.
 */
export function performCampaignAction(
  campaignState:
    CampaignState,

  action:
    CampaignActionDefinition,
): CampaignActionResult {
  const availability =
    evaluateCampaignActionAvailability(
      campaignState,
      action,
    );

  if (
    !availability.canPerform
  ) {
    return {
      action,

      performed:
        false,

      previousState:
        campaignState,

      nextState:
        campaignState,

      failureReasons:
        availability
          .failureReasons,
    };
  }

  const nextState =
    applyCampaignEffects(
      campaignState,
      action.effects,
    );

  return {
    action,

    performed:
      true,

    previousState:
      campaignState,

    nextState,

    failureReasons:
      [],
  };
}