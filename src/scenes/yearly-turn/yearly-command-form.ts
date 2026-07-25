import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  CampaignSession,
} from '../../game/campaign/campaign-session';
import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import type {
  GameSession,
} from '../../game/game-session';
import type {
  TurnCommand,
  TurnOutcome,
} from '../../core/types';
import {
  makeElement,
} from '../../ui/dom-helpers';
import {
  makeNumberInput,
  makeNumberLabel,
  readWholeNumber,
} from './number-field';

export interface SynchronizedTurnResult {
  readonly gameOutcome:
    TurnOutcome | null;

  readonly campaignState:
    CampaignState | null;
}

/**
 * Processes one temporary legacy turn and advances the new
 * campaign runtime only when the legacy turn succeeds.
 *
 * This keeps both runtimes synchronized while the Hamurabi
 * placeholder form is still responsible for submitting turns.
 */
export function processSynchronizedTurn(
  gameSession:
    Pick<
      GameSession,
      'processTurn'
    >,

  campaignSession:
    Pick<
      CampaignSession,
      'endTurn'
    >,

  command:
    TurnCommand,
): SynchronizedTurnResult {
  const gameOutcome =
    gameSession.processTurn(
      command,
    );

  /*
   * Do not advance the campaign runtime when the legacy
   * runtime rejects the turn. This prevents the two sessions
   * from drifting apart.
   */
  if (!gameOutcome) {
    return {
      gameOutcome:
        null,

      campaignState:
        null,
    };
  }

  const campaignState =
    campaignSession.endTurn();

  return {
    gameOutcome,
    campaignState,
  };
}

export function makeYearlyCommandForm(
  context: SceneContext,
): HTMLFormElement {
  const form =
    makeElement(
      'form',
      {
        className:
          'menu-form yearly-command-form manila-folder-form',
      },
    );

  const suggestedCommand =
    context.game
      .getSuggestedTurnCommand()
    ?? {
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 0,
      acresToPlant: 0,
    };

  const acresToBuyInput =
    makeNumberInput(
      'acres-to-buy',
      suggestedCommand
        .acresToBuy,
    );

  const acresToSellInput =
    makeNumberInput(
      'acres-to-sell',
      suggestedCommand
        .acresToSell,
    );

  const grainToFeedInput =
    makeNumberInput(
      'grain-to-feed',
      suggestedCommand
        .grainToFeed,
    );

  const acresToPlantInput =
    makeNumberInput(
      'acres-to-plant',
      suggestedCommand
        .acresToPlant,
    );

  form.append(
    makeNumberLabel(
      'Acres to buy',
      acresToBuyInput,
    ),

    makeNumberLabel(
      'Acres to sell',
      acresToSellInput,
    ),

    makeNumberLabel(
      'Grain to feed people',
      grainToFeedInput,
    ),

    makeNumberLabel(
      'Acres to plant',
      acresToPlantInput,
    ),
  );

  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();

      context.audio.sfx.play(
        'button-click',
      );

      const command:
        TurnCommand = {
          acresToBuy:
            readWholeNumber(
              acresToBuyInput,
            ),

          acresToSell:
            readWholeNumber(
              acresToSellInput,
            ),

          grainToFeed:
            readWholeNumber(
              grainToFeedInput,
            ),

          acresToPlant:
            readWholeNumber(
              acresToPlantInput,
            ),
        };

      const result =
        processSynchronizedTurn(
          context.game,
          context.campaign,
          command,
        );

      if (!result.gameOutcome) {
        console.warn(
          '[game] tried to submit a week turn without an active game',
        );

        context.navigate(
          'game-setup',
        );

        return;
      }

      /*
       * A successful legacy turn should always have a matching
       * active campaign turn. Treat a missing campaign state as
       * a migration error rather than silently allowing the two
       * runtimes to drift apart.
       */
      if (!result.campaignState) {
        console.warn(
          [
            '[campaign] legacy turn completed',
            'but campaign runtime could not advance',
            `legacy week: ${result.gameOutcome.previousState.year}`,
          ].join('; '),
        );

        context.navigate(
          'game-setup',
        );

        return;
      }

      console.log(
        [
          '[game] synchronized turn completed',
          `legacy week: ${result.gameOutcome.previousState.year}`,
          `campaign turn: ${result.campaignState.currentTurn}`,
          `campaign phase: ${result.campaignState.phase}`,
        ].join('; '),
      );

      context.navigate(
        'campaign',
      );
    },
  );

  return form;
}