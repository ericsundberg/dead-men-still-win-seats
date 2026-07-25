import type {
  SceneContext,
} from '../../app/scene-router';
import {
  evaluateCampaignActionAvailability,
  getCampaignActionDefinitions,
  type CampaignActionDefinition,
  type CampaignActionFailureReason,
  type CampaignActionId,
} from '../../game/campaign/campaign-actions';
import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import {
  makeButton,
  makeElement,
} from '../../ui/dom-helpers';

export interface CampaignActionPresentation {
  readonly title:
    string;

  readonly description:
    string;

  readonly buttonLabel:
    string;
}

export interface CampaignActionPanelModel {
  readonly id:
    CampaignActionId;

  readonly title:
    string;

  readonly description:
    string;

  readonly requirementItems:
    readonly string[];

  readonly effectItems:
    readonly string[];

  readonly buttonLabel:
    string;

  readonly disabled:
    boolean;

  readonly unavailableMessage:
    string | null;
}

const currencyFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style:
        'currency',

      currency:
        'USD',

      maximumFractionDigits:
        0,
    },
  );

const wholeNumberFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        0,
    },
  );

const campaignActionPresentations = {
  'closed-door-fundraiser': {
    title:
      'Closed-Door Fundraiser',

    description:
      [
        'Invite major donors into a private room,',
        'pass the hat, and hope nobody asks why',
        'the Senator never enters.',
      ].join(' '),

    buttonLabel:
      'Hold Fundraiser',
  },
} as const satisfies Record<
  CampaignActionId,
  CampaignActionPresentation
>;

/**
 * Converts every registered campaign action into the presentation
 * model used by the campaign action panel.
 */
export function createCampaignActionPanelModels(
  campaignState:
    CampaignState,
): readonly CampaignActionPanelModel[] {
  return getCampaignActionDefinitions()
    .map(
      (action) =>
        createCampaignActionPanelModel(
          campaignState,
          action,
        ),
    );
}

/**
 * Converts one campaign action definition into display text and
 * availability information.
 */
export function createCampaignActionPanelModel(
  campaignState:
    CampaignState,

  action:
    CampaignActionDefinition,
): CampaignActionPanelModel {
  const presentation =
    campaignActionPresentations[
      action.id
    ];

  const availability =
    evaluateCampaignActionAvailability(
      campaignState,
      action,
    );

  return {
    id:
      action.id,

    title:
      presentation.title,

    description:
      presentation.description,

    requirementItems:
      createRequirementItems(
        action,
      ),

    effectItems:
      createEffectItems(
        action,
      ),

    buttonLabel:
      presentation.buttonLabel,

    disabled:
      !availability
        .canPerform,

    unavailableMessage:
      formatCampaignActionFailureReasons(
        availability
          .failureReasons,
      ),
  };
}

export function formatCampaignActionFailureReasons(
  failureReasons:
    readonly CampaignActionFailureReason[],
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
          case 'not-player-actions':
            return 'Actions are unavailable right now.';

          case 'insufficient-cash':
            return 'Not enough cash.';

          case 'insufficient-favors':
            return 'Not enough favors.';

          case 'insufficient-action-points':
            return 'Not enough action points.';
        }
      },
    )
    .join(' ');
}

export function makeCampaignActionPanel(
  context:
    SceneContext,

  campaignState:
    CampaignState,
): HTMLElement {
  const panel =
    makeElement(
      'section',
      {
        className:
          'campaign-action-panel',
      },
    );

  panel.setAttribute(
    'aria-label',
    'Campaign actions',
  );

  const heading =
    makeElement(
      'h2',
      {
        className:
          'campaign-action-panel-title',

        textContent:
          'Campaign Actions',
      },
    );

  const introduction =
    makeElement(
      'p',
      {
        className:
          'campaign-action-panel-introduction',

        textContent:
          [
            'Spend action points before ending the week.',
            'Actions may improve one part of the campaign',
            'while creating trouble somewhere else.',
          ].join(' '),
      },
    );

  const actionList =
    makeElement(
      'div',
      {
        className:
          'campaign-action-list',
      },
    );

  const actionModels =
    createCampaignActionPanelModels(
      campaignState,
    );

  for (
    const actionModel
    of actionModels
  ) {
    actionList.append(
      makeCampaignActionCard(
        context,
        actionModel,
      ),
    );
  }

  panel.append(
    heading,
    introduction,
    actionList,
  );

  return panel;
}

function makeCampaignActionCard(
  context:
    SceneContext,

  actionModel:
    CampaignActionPanelModel,
): HTMLElement {
  const card =
    makeElement(
      'article',
      {
        className:
          'campaign-action-card',
      },
    );

  const descriptionId =
    [
      'campaign-action-description',
      actionModel.id,
    ].join('-');

  const unavailableId =
    [
      'campaign-action-unavailable',
      actionModel.id,
    ].join('-');

  const heading =
    makeElement(
      'h3',
      {
        className:
          'campaign-action-card-title',

        textContent:
          actionModel.title,
      },
    );

  const description =
    makeElement(
      'p',
      {
        className:
          'campaign-action-card-description',

        textContent:
          actionModel.description,
      },
    );

  description.id =
    descriptionId;

  const details =
    makeElement(
      'div',
      {
        className:
          'campaign-action-card-details',
      },
    );

  details.append(
    makeCampaignActionDetailGroup(
      'Requirements',
      actionModel
        .requirementItems,
      'campaign-action-requirements',
    ),

    makeCampaignActionDetailGroup(
      'Effects',
      actionModel
        .effectItems,
      'campaign-action-effects',
    ),
  );

  const button =
    makeButton(
      actionModel.buttonLabel,

      () => {
        const result =
          context.campaign
            .performAction(
              actionModel.id,
            );

        if (!result) {
          console.warn(
            [
              '[campaign] action could not be performed',
              'because no active campaign was available',
              `action: ${actionModel.id}`,
            ].join('; '),
          );

          return;
        }

        if (
          !result.performed
        ) {
          console.warn(
            [
              '[campaign] action rejected',
              `action: ${actionModel.id}`,
              `reasons: ${result.failureReasons.join(', ')}`,
            ].join('; '),
          );

          return;
        }

        console.log(
          [
            '[campaign] action performed',
            `action: ${actionModel.id}`,
            `turn: ${result.nextState.currentTurn}`,
            [
              'action points remaining:',
              result.nextState
                .resources
                .actionPoints,
            ].join(' '),
          ].join('; '),
        );

        /*
         * Re-render the campaign scene so the status summary,
         * button availability, and any end-game state reflect
         * the newly committed campaign state.
         */
        context.navigate(
          'campaign',
        );
      },

      [
        'menu-button',
        'campaign-action-button',
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
    actionModel.disabled;

  button.setAttribute(
    'aria-describedby',
    descriptionId,
  );

  if (
    actionModel
      .unavailableMessage
  ) {
    const unavailableMessage =
      makeElement(
        'p',
        {
          className:
            'campaign-action-unavailable',

          textContent:
            actionModel
              .unavailableMessage,
        },
      );

    unavailableMessage.id =
      unavailableId;

    button.setAttribute(
      'aria-describedby',
      [
        descriptionId,
        unavailableId,
      ].join(' '),
    );

    button.title =
      actionModel
        .unavailableMessage;

    card.append(
      heading,
      description,
      details,
      button,
      unavailableMessage,
    );

    return card;
  }

  card.append(
    heading,
    description,
    details,
    button,
  );

  return card;
}

function makeCampaignActionDetailGroup(
  label:
    string,

  items:
    readonly string[],

  className:
    string,
): HTMLElement {
  const group =
    makeElement(
      'section',
      {
        className: [
          'campaign-action-detail-group',
          className,
        ].join(' '),
      },
    );

  const heading =
    makeElement(
      'h4',
      {
        className:
          'campaign-action-detail-title',

        textContent:
          label,
      },
    );

  const list =
    makeElement(
      'ul',
      {
        className:
          'campaign-action-detail-list',
      },
    );

  for (
    const item
    of items
  ) {
    list.append(
      makeElement(
        'li',
        {
          textContent:
            item,
        },
      ),
    );
  }

  group.append(
    heading,
    list,
  );

  return group;
}

function createRequirementItems(
  action:
    CampaignActionDefinition,
): readonly string[] {
  const items:
    string[] = [];

  const minimumCash =
    action.requirements
      .minimumCash;

  if (
    minimumCash
    !== undefined
    && minimumCash > 0
  ) {
    items.push(
      [
        'Requires',
        currencyFormatter
          .format(
            Math.round(
              minimumCash,
            ),
          ),
        'Cash',
      ].join(' '),
    );
  }

  const minimumFavors =
    action.requirements
      .minimumFavors;

  if (
    minimumFavors
    !== undefined
    && minimumFavors > 0
  ) {
    const roundedFavors =
      Math.round(
        minimumFavors,
      );

    items.push(
      [
        'Requires',
        wholeNumberFormatter
          .format(
            roundedFavors,
          ),
        roundedFavors === 1
          ? 'Favor'
          : 'Favors',
      ].join(' '),
    );
  }

  const minimumActionPoints =
    action.requirements
      .minimumActionPoints;

  if (
    minimumActionPoints
    !== undefined
    && minimumActionPoints > 0
  ) {
    const roundedActionPoints =
      Math.round(
        minimumActionPoints,
      );

    items.push(
      [
        'Requires',
        wholeNumberFormatter
          .format(
            roundedActionPoints,
          ),
        roundedActionPoints === 1
          ? 'Action Point'
          : 'Action Points',
      ].join(' '),
    );
  }

  return items;
}

function createEffectItems(
  action:
    CampaignActionDefinition,
): readonly string[] {
  const items:
    string[] = [];

  appendCurrencyEffect(
    items,
    action.effects.cash,
    'Cash',
  );

  appendNumberEffect(
    items,
    action.effects.favors,
    'Favor',
    'Favors',
  );

  appendNumberEffect(
    items,
    action.effects
      .actionPoints,
    'Action Point',
    'Action Points',
  );

  appendNumberEffect(
    items,
    action.effects
      .publicSuspicion,
    'Public Suspicion',
    'Public Suspicion',
  );

  appendNumberEffect(
    items,
    action.effects
      .partyConfidence,
    'Party Confidence',
    'Party Confidence',
  );

  appendNumberEffect(
    items,
    action.effects
      .voterEnergy,
    'Voter Energy',
    'Voter Energy',
  );

  return items;
}

function appendCurrencyEffect(
  items:
    string[],

  value:
    number | undefined,

  label:
    string,
): void {
  if (
    value === undefined
    || !Number.isFinite(
      value,
    )
    || value === 0
  ) {
    return;
  }

  const roundedValue =
    Math.round(
      value,
    );

  const sign =
    roundedValue > 0
      ? '+'
      : '-';

  items.push(
    [
      `${sign}${currencyFormatter.format(
        Math.abs(
          roundedValue,
        ),
      )}`,
      label,
    ].join(' '),
  );
}

function appendNumberEffect(
  items:
    string[],

  value:
    number | undefined,

  singularLabel:
    string,

  pluralLabel:
    string,
): void {
  if (
    value === undefined
    || !Number.isFinite(
      value,
    )
    || value === 0
  ) {
    return;
  }

  const roundedValue =
    Math.round(
      value,
    );

  const sign =
    roundedValue > 0
      ? '+'
      : '';

  const absoluteValue =
    Math.abs(
      roundedValue,
    );

  items.push(
    [
      `${sign}${wholeNumberFormatter.format(
        roundedValue,
      )}`,

      absoluteValue === 1
        ? singularLabel
        : pluralLabel,
    ].join(' '),
  );
}