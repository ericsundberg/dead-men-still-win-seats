import type {
  EventDecisionDefinition,
  EventDecisionId,
  GameEventDefinition,
} from '../../events/event-types';
import {
  evaluateCampaignEventDecisionAvailability,
  type CampaignEventDecisionFailureReason,
} from '../../game/campaign/campaign-event-decisions';
import type {
  CampaignState,
} from '../../game/campaign/campaign-state';

export interface CampaignEventDecisionModel {
  readonly id:
    EventDecisionId;

  readonly label:
    string;

  readonly disabled:
    boolean;

  readonly unavailableMessage:
    string | null;
}

export interface CampaignEventPanelModel {
  readonly eventId:
    GameEventDefinition['id'];

  readonly title:
    string;

  readonly description:
    string;

  readonly imageUrl:
    string | null;

  readonly decisions:
    readonly CampaignEventDecisionModel[];
}

export function createCampaignEventPanelModel(
  campaignState:
    CampaignState,

  event:
    GameEventDefinition,

  baseUrl:
    string =
      import.meta.env.BASE_URL,
): CampaignEventPanelModel {
  return {
    eventId:
      event.id,

    title:
      event.title,

    description:
      event.description,

    imageUrl:
      resolveCampaignEventImageUrl(
        event.imagePath,
        baseUrl,
      ),

    decisions:
      event.decisions.map(
        (
          decision,
        ) =>
          createCampaignEventDecisionModel(
            campaignState,
            decision,
          ),
      ),
  };
}

export function resolveCampaignEventImageUrl(
  imagePath:
    string | undefined,

  baseUrl:
    string =
      import.meta.env.BASE_URL,
): string | null {
  if (
    imagePath
    === undefined
  ) {
    return null;
  }

  const trimmedPath =
    imagePath.trim();

  if (
    trimmedPath.length
    === 0
  ) {
    return null;
  }

  const normalizedPath =
    trimmedPath.replace(
      /\\/g,
      '/',
    );

  const pathSegments =
    normalizedPath.split(
      '/',
    );

  if (
    normalizedPath.startsWith(
      '/',
    )
    || pathSegments.some(
      (
        pathSegment,
      ) =>
        pathSegment.length
          === 0
        || pathSegment === '.'
        || pathSegment === '..',
    )
  ) {
    return null;
  }

  const normalizedBaseUrl =
    baseUrl.length === 0
      ? ''
      : baseUrl.endsWith(
          '/',
        )
        ? baseUrl
        : `${baseUrl}/`;

  return [
    normalizedBaseUrl,
    'assets/art/events/',
    normalizedPath,
  ].join(
    '',
  );
}

export function formatCampaignEventDecisionFailureReasons(
  failureReasons:
    readonly CampaignEventDecisionFailureReason[],
): string | null {
  if (
    failureReasons.length
    === 0
  ) {
    return null;
  }

  return failureReasons
    .map(
      (
        failureReason,
      ) => {
        switch (
          failureReason
        ) {
          case 'unknown-decision':
            return 'This decision is no longer available.';

          case 'not-resolving-events':
            return 'There is no event awaiting a decision.';

          case 'insufficient-cash':
            return 'Not enough cash.';

          case 'insufficient-favors':
            return 'Not enough favors.';

          case 'insufficient-action-points':
            return 'Not enough action points.';

          case 'missing-required-flags':
            return 'Required campaign conditions have not been met.';

          case 'excluded-flags-present':
            return 'Current campaign conditions block this decision.';
        }
      },
    )
    .join(
      ' ',
    );
}

function createCampaignEventDecisionModel(
  campaignState:
    CampaignState,

  decision:
    EventDecisionDefinition,
): CampaignEventDecisionModel {
  const availability =
    evaluateCampaignEventDecisionAvailability(
      campaignState,
      decision,
    );

  return {
    id:
      decision.id,

    label:
      decision.label,

    disabled:
      !availability.canChoose,

    unavailableMessage:
      formatCampaignEventDecisionFailureReasons(
        availability.failureReasons,
      ),
  };
}