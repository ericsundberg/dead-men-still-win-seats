import {
  applyCampaignEffects,
  type CampaignEffects,
} from './campaign-effects';
import type {
  CampaignState,
} from './campaign-state';

export type CampaignActionId =
  | 'closed-door-fundraiser'
  | 'hire-staffer'
  | 'recruit-surrogate';

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

  /*
   * Headlines added to the persistent campaign news feed after
   * the action succeeds.
   */
  readonly newsItems?:
    readonly string[];
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
  'hire-staffer',
  'recruit-surrogate',
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

    newsItems: [
      'Buster Campaign Holds Closed-Door Fundraiser; Senator Not Seen',
    ],
  },

  'hire-staffer': {
    id:
      'hire-staffer',

    requirements: {
      minimumCash:
        20_000,

      minimumActionPoints:
        1,
    },

    effects: {
      cash:
        -20_000,

      actionPoints:
        -1,

      staffers:
        1,
    },

    newsItems: [
      'Buster Campaign Expands Staff as Senator Remains Out of Sight',
    ],
  },

  'recruit-surrogate': {
    id:
      'recruit-surrogate',

    requirements: {
      minimumCash:
        15_000,

      minimumActionPoints:
        1,
    },

    effects: {
      cash:
        -15_000,

      actionPoints:
        -1,

      surrogates:
        1,
    },

    newsItems: [
      'Prominent Ally Campaigns in Senator Buster’s Place',
    ],
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
 * All unmet requirements are returned so the interface can
 * explain every reason an action is unavailable.
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
 * Successful actions apply their numerical effects and place
 * their headlines at the front of the persistent campaign news
 * feed.
 *
 * Duplicate headlines are removed so repeating one action does
 * not fill the ticker with identical stories.
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

  const affectedState =
    applyCampaignEffects(
      campaignState,
      action.effects,
    );

  const nextState:
    CampaignState = {
      ...affectedState,

      newsFeed:
        mergeCampaignNewsItems(
          campaignState
            .newsFeed,

          action.newsItems
          ?? [],
        ),
  };

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

/**
 * Places newly generated headlines before older stories while
 * retaining only one copy of each usable headline.
 */
function mergeCampaignNewsItems(
  currentNewsItems:
    readonly string[],

  newNewsItems:
    readonly string[],
): readonly string[] {
  const normalizedNewItems =
    newNewsItems
      .map(
        (newsItem) =>
          newsItem.trim(),
      )
      .filter(
        (newsItem) =>
          newsItem.length > 0,
      );

  if (
    normalizedNewItems.length
    === 0
  ) {
    return currentNewsItems;
  }

  const mergedNewsItems:
    string[] = [];

  const seenNewsItems =
    new Set<string>();

  for (
    const newsItem
    of [
      ...normalizedNewItems,
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