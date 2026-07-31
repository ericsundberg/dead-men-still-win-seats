import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  GameEventDefinition,
} from '../../events/event-types';
import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import {
  bindDraggableWindow,
  type DraggableWindowController,
} from '../../ui/draggable-window';
import {
  makeButton,
  makeElement,
} from '../../ui/dom-helpers';
import {
  createCampaignEventPanelModel,
  type CampaignEventDecisionModel,
  type CampaignEventPanelModel,
} from './campaign-event-model';

export interface CampaignEventWindow {
  readonly element:
    HTMLElement;

  readonly dispose:
    () => void;
}

export function makeCampaignEventWindow(
  context:
    SceneContext,

  campaignState:
    CampaignState,

  event:
    GameEventDefinition,

  dragContainer:
    HTMLElement,
): CampaignEventWindow {
  const model =
    createCampaignEventPanelModel(
      campaignState,
      event,
    );

  const eventWindow =
    makeElement(
      'article',
      {
        className: [
          'campaign-event-window',

          model.imageUrl
            ? 'campaign-event-window--with-image'
            : 'campaign-event-window--without-image',
        ].join(
          ' ',
        ),
      },
    );

  eventWindow.setAttribute(
    'role',
    'dialog',
  );

  eventWindow.setAttribute(
    'aria-modal',
    'true',
  );

  const titleId =
    [
      'campaign-event-title',
      model.eventId,
    ].join(
      '-',
    );

  const descriptionId =
    [
      'campaign-event-description',
      model.eventId,
    ].join(
      '-',
    );

  eventWindow.setAttribute(
    'aria-labelledby',
    titleId,
  );

  eventWindow.setAttribute(
    'aria-describedby',
    descriptionId,
  );

  const header =
    makeCampaignEventWindowHeader(
      model,
      titleId,
    );

  eventWindow.append(
    header,
  );

  if (
    model.imageUrl
  ) {
    eventWindow.append(
      makeCampaignEventImage(
        model,
        eventWindow,
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
      ].join(
        '; ',
      ),
    );
  }

  eventWindow.append(
    makeCampaignEventBody(
      context,
      model,
      descriptionId,
    ),
  );

  const dragController:
    DraggableWindowController =
      bindDraggableWindow({
        element:
          eventWindow,

        handle:
          header,

        container:
          dragContainer,

        bounds: {
          top:
            92,

          right:
            20,

          bottom:
            72,

          left:
            20,
        },
      });

  return {
    element:
      eventWindow,

    dispose:
      () => {
        dragController.dispose();
      },
  };
}

function makeCampaignEventWindowHeader(
  model:
    CampaignEventPanelModel,

  titleId:
    string,
): HTMLElement {
  const header =
    makeElement(
      'header',
      {
        className:
          'campaign-event-window-header',
      },
    );

  header.tabIndex =
    0;

  header.setAttribute(
    'role',
    'button',
  );

  header.setAttribute(
    'aria-label',
    `Move ${model.title} event window`,
  );

  header.setAttribute(
    'aria-keyshortcuts',
    'ArrowUp ArrowDown ArrowLeft ArrowRight',
  );

  header.title =
    'Drag to move. Arrow keys also move this window.';

  const grip =
    makeElement(
      'span',
      {
        className:
          'campaign-event-window-grip',

        textContent:
          '⠿',
      },
    );

  grip.setAttribute(
    'aria-hidden',
    'true',
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

  const movementLabel =
    makeElement(
      'span',
      {
        className:
          'campaign-event-window-move-label',

        textContent:
          'Move',
      },
    );

  movementLabel.setAttribute(
    'aria-hidden',
    'true',
  );

  header.append(
    grip,
    heading,
    movementLabel,
  );

  return header;
}

function makeCampaignEventImage(
  model:
    CampaignEventPanelModel,

  eventWindow:
    HTMLElement,
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
      imageFrame.remove();

      eventWindow.classList.remove(
        'campaign-event-window--with-image',
      );

      eventWindow.classList.add(
        'campaign-event-window--without-image',
      );
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

function makeCampaignEventBody(
  context:
    SceneContext,

  model:
    CampaignEventPanelModel,

  descriptionId:
    string,
): HTMLElement {
  const body =
    makeElement(
      'div',
      {
        className:
          'campaign-event-body',
      },
    );

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
    description,
    decisionHeading,
    decisionList,
  );

  return body;
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
    ].join(
      '-',
    );

  const button =
    makeButton(
      decision.label,

      () => {
        const result =
          context.campaign
            .chooseEventDecision(
              decision.id,
            );

        if (
          !result
        ) {
          console.warn(
            [
              '[campaign] event decision could not be resolved',
              `event: ${eventId}`,
              `decision: ${decision.id}`,
            ].join(
              '; ',
            ),
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
            ].join(
              '; ',
            ),
          );

          return;
        }

        console.log(
          [
            '[campaign] event decision resolved',
            `event: ${eventId}`,
            `decision: ${decision.id}`,
            `turn: ${result.nextState.currentTurn}`,
          ].join(
            '; ',
          ),
        );

        context.navigate(
          'campaign',
        );
      },

      [
        'menu-button',
        'campaign-event-decision-button',
      ].join(
        ' ',
      ),

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