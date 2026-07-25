import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  CampaignEndGameState,
  CampaignEndGameType,
} from '../../game/campaign/campaign-end-game';
import {
  makeButton,
  makeElement,
} from '../../ui/dom-helpers';

export type CampaignGameOverTone =
  | 'victory'
  | 'defeat'
  | 'neutral';

export interface CampaignGameOverPresentation {
  readonly outcomeLabel:
    string;

  readonly title:
    string;

  readonly message:
    string;

  readonly tone:
    CampaignGameOverTone;
}

export interface CampaignGameOverModel
  extends CampaignGameOverPresentation {
  readonly endGameType:
    CampaignEndGameType | null;

  readonly turnLabel:
    string;
}

const campaignGameOverPresentations = {
  'public-discovers-death': {
    outcomeLabel:
      'The Secret Is Out',

    title:
      'The Senator Is Dead',

    message:
      [
        'The public finally learns that Senator Phil A. Buster',
        'is dead. The campaign collapses before the ballots can',
        'finish the job.',
      ].join(' '),

    tone:
      'defeat',
  },

  'party-dumps-senator': {
    outcomeLabel:
      'Party Revolt',

    title:
      'Thrown Under the Campaign Bus',

    message:
      [
        'Party leaders abandon the operation and remove the',
        'Senator from their plans before the campaign reaches',
        'Election Day.',
      ].join(' '),

    tone:
      'defeat',
  },

  'lose-reelection': {
    outcomeLabel:
      'Election Defeat',

    title:
      'Dead on Arrival',

    message:
      [
        'The secret survives, but the campaign does not.',
        'Voters leave the Buster ticket behind on Election Day.',
      ].join(' '),

    tone:
      'defeat',
  },

  'win-reelection': {
    outcomeLabel:
      'Re-Elected',

    title:
      'Dead Men Still Win Seats',

    message:
      [
        'Against biology, arithmetic, and good government,',
        'Senator Phil A. Buster wins another term.',
      ].join(' '),

    tone:
      'victory',
  },
} as const satisfies Record<
  CampaignEndGameType,
  CampaignGameOverPresentation
>;

export function createCampaignGameOverModel(
  endGameState:
    CampaignEndGameState | null,
): CampaignGameOverModel {
  if (!endGameState) {
    return {
      endGameType:
        null,

      outcomeLabel:
        'Result Unavailable',

      title:
        'Campaign Ended',

      message:
        [
          'The campaign reached a terminal state without a',
          'recorded final result.',
        ].join(' '),

      tone:
        'neutral',

      turnLabel:
        'No final campaign turn was recorded.',
    };
  }

  const presentation =
    campaignGameOverPresentations[
      endGameState.type
    ];

  return {
    endGameType:
      endGameState.type,

    ...presentation,

    turnLabel:
      formatCampaignGameOverTurnLabel(
        endGameState,
      ),
  };
}

export function makeCampaignGameOverPanel(
  context:
    SceneContext,

  endGameState:
    CampaignEndGameState | null,
): HTMLElement {
  const model =
    createCampaignGameOverModel(
      endGameState,
    );

  const panel =
    makeElement(
      'section',
      {
        className: [
          'campaign-game-over-panel',

          `campaign-game-over-panel--${model.tone}`,
        ].join(' '),
      },
    );

  panel.setAttribute(
    'aria-label',
    'Campaign result',
  );

  const resultLabel =
    makeElement(
      'p',
      {
        className:
          'campaign-game-over-label',

        textContent:
          model.outcomeLabel,
      },
    );

  const title =
    makeElement(
      'h1',
      {
        className:
          'campaign-game-over-title',

        textContent:
          model.title,
      },
    );

  const message =
    makeElement(
      'p',
      {
        className:
          'campaign-game-over-message',

        textContent:
          model.message,
      },
    );

  const turnLabel =
    makeElement(
      'p',
      {
        className:
          'campaign-game-over-turn',

        textContent:
          model.turnLabel,
      },
    );

  const actions =
    makeElement(
      'div',
      {
        className:
          'button-row campaign-game-over-actions',
      },
    );

  const startNewCampaignButton =
    makeButton(
      'Start New Campaign',

      () => {
        context.navigate(
          'game-setup',
        );
      },

      'menu-button',

      {
        onBeforeClick:
          () => {
            context.audio.sfx.play(
              'button-click',
            );
          },
      },
    );

  const backToTitleButton =
    makeButton(
      'Back to Title',

      () => {
        context.navigate(
          'title',
        );
      },

      'secondary-button',

      {
        onBeforeClick:
          () => {
            context.audio.sfx.play(
              'button-cancel',
            );
          },
      },
    );

  actions.append(
    startNewCampaignButton,
    backToTitleButton,
  );

  panel.append(
    resultLabel,
    title,
    message,
    turnLabel,
    actions,
  );

  return panel;
}

function formatCampaignGameOverTurnLabel(
  endGameState:
    CampaignEndGameState,
): string {
  switch (endGameState.type) {
    case 'lose-reelection':
    case 'win-reelection':
      return [
        'Election resolved on turn',
        `${endGameState.triggeredOnTurn}.`,
      ].join(' ');

    case 'public-discovers-death':
    case 'party-dumps-senator':
      return [
        'Campaign ended on turn',
        `${endGameState.triggeredOnTurn}.`,
      ].join(' ');
  }
}