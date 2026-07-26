import type {
  SceneContext,
} from '../../app/scene-router';
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
import {
  makeButton,
  makeElement,
} from '../../ui/dom-helpers';

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

/**
 * Converts an active event definition into the presentation model
 * used by the campaign event panel.
 */
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
        (decision) =>
          createCampaignEventDecisionModel(
            campaignState,
            decision,
          ),
      ),
  };
}

/**
 * Resolves an optional event image beneath:
 *
 * public/assets/art/events/
 *
 * The JSON path is relative to that directory. For example:
 *
 * "media/interviewer-ambush.webp"
 */
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
    normalizedPath.split('/');

  if (
    normalizedPath.startsWith('/')
    || pathSegments.some(
      (pathSegment) =>
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
      : baseUrl.endsWith('/')
        ? baseUrl
        : `${baseUrl}/`;

  return [
    normalizedBaseUrl,
    'assets/art/events/',
    normalizedPath,
  ].join('');
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
      (failureReason) => {
        switch (failureReason) {
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
    .join(' ');
}

export function makeCampaignEventPanel(
  context:
    SceneContext,

  campaignState:
    CampaignState,

  event:
    GameEventDefinition,
): HTMLElement {
  const model =
    createCampaignEventPanelModel(
      campaignState,
      event,
    );

  const panel =
    makeElement(
      'article',
      {
        className:
          'campaign-event-panel',
      },
    );

  const titleId =
    [
      'campaign-event-title',
      model.eventId,
    ].join('-');

  const descriptionId =
    [
      'campaign-event-description',
      model.eventId,
    ].join('-');

  panel.setAttribute(
    'aria-labelledby',
    titleId,
  );

  panel.setAttribute(
    'aria-describedby',
    descriptionId,
  );

  if (
    model.imageUrl
  ) {
    panel.append(
      makeCampaignEventImage(
        model,
      ),
    );
  } else if (
    event.imagePath
  ) {
    console.warn(
      [
        '[campaign] event image path was rejected',
        `event: ${event.id}`,
        `image: ${event.imagePath}`,
      ].join('; '),
    );
  }

  const body =
    makeElement(
      'div',
      {
        className:
          'campaign-event-body',
      },
    );

  const heading =
    makeElement(
      'h2',
      {
        className:
          'campaign-event-title',

        textContent:
          model.title,
      },
    );

  heading.id =
    titleId;

  const description =
    makeElement(
      'p',
      {
        className:
          'campaign-event-description',

        textContent:
          model.description,
      },
    );

  description.id =
    descriptionId;

  const decisionHeading =
    makeElement(
      'h3',
      {
        className:
          'campaign-event-decision-heading',

        textContent:
          'What do you do?',
      },
    );

  const decisionList =
    makeElement(
      'div',
      {
        className:
          'campaign-event-decision-list',
      },
    );

  for (
    const decision
    of model.decisions
  ) {
    decisionList.append(
      makeCampaignEventDecision(
        context,
        model.eventId,
        decision,
      ),
    );
  }

  body.append(
    heading,
    description,
    decisionHeading,
    decisionList,
  );

  panel.append(
    body,
  );

  return panel;
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

function makeCampaignEventImage(
  model:
    CampaignEventPanelModel,
): HTMLElement {
  const imageFrame =
    makeElement(
      'figure',
      {
        className:
          'campaign-event-image-frame',
      },
    );

  const image =
    makeElement(
      'img',
      {
        className:
          'campaign-event-image',
      },
    );

  image.src =
    model.imageUrl
    ?? '';

  image.alt =
    `Illustration for ${model.title}`;

  image.decoding =
    'async';

  image.addEventListener(
    'error',
    () => {
      /*
       * A missing image must not leave an empty image region in
       * the event window.
       */
      imageFrame.remove();
    },
    {
      once:
        true,
    },
  );

  imageFrame.append(
    image,
  );

  return imageFrame;
}

function makeCampaignEventDecision(
  context:
    SceneContext,

  eventId:
    GameEventDefinition['id'],

  decision:
    CampaignEventDecisionModel,
): HTMLElement {
  const wrapper =
    makeElement(
      'div',
      {
        className:
          'campaign-event-decision',
      },
    );

  const unavailableId =
    [
      'campaign-event-decision-unavailable',
      eventId,
      decision.id,
    ].join('-');

  const button =
    makeButton(
      decision.label,

      () => {
        const result =
          context.campaign
            .chooseEventDecision(
              decision.id,
            );

        if (!result) {
          console.warn(
            [
              '[campaign] event decision could not be resolved',
              `event: ${eventId}`,
              `decision: ${decision.id}`,
            ].join('; '),
          );

          return;
        }

        if (
          !result.performed
        ) {
          console.warn(
            [
              '[campaign] event decision rejected',
              `event: ${eventId}`,
              `decision: ${decision.id}`,
              `reasons: ${result.failureReasons.join(', ')}`,
            ].join('; '),
          );

          return;
        }

        console.log(
          [
            '[campaign] event decision resolved',
            `event: ${eventId}`,
            `decision: ${decision.id}`,
            `turn: ${result.nextState.currentTurn}`,
          ].join('; '),
        );

        context.navigate(
          'campaign',
        );
      },

      [
        'menu-button',
        'campaign-event-decision-button',
      ].join(' '),

      {
        onBeforeClick:
          () => {
            context.audio.sfx.play(
              'button-click',
            );
          },
      },
    );

  button.disabled =
    decision.disabled;

  if (
    decision.unavailableMessage
  ) {
    const unavailableMessage =
      makeElement(
        'p',
        {
          className:
            'campaign-event-decision-unavailable',

          textContent:
            decision.unavailableMessage,
        },
      );

    unavailableMessage.id =
      unavailableId;

    button.setAttribute(
      'aria-describedby',
      unavailableId,
    );

    button.title =
      decision.unavailableMessage;

    wrapper.append(
      button,
      unavailableMessage,
    );

    return wrapper;
  }

  wrapper.append(
    button,
  );

  return wrapper;
}