import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  CampaignSession,
} from '../../game/campaign/campaign-session';
import {
  gameDifficultySettings,
  type GameDifficultyId,
} from '../../game/difficulty';
import type {
  GameSession,
} from '../../game/game-session';
import {
  text,
} from '../../localization/localized-text';
import {
  makeElement,
} from '../../ui/dom-helpers';
import {
  createDifficultySelectionFields,
} from './difficulty-selection-fields';

/**
 * Starts both game runtimes with the same selected difficulty.
 *
 * The legacy GameSession remains necessary while the current
 * Hamurabi placeholder interface is still rendered. The new
 * CampaignSession becomes the authoritative runtime as that
 * interface is replaced in later checkpoints.
 */
export function startCampaignRuntimes(
  gameSession:
    Pick<
      GameSession,
      'startNewGame'
    >,

  campaignSession:
    Pick<
      CampaignSession,
      'startCampaign'
    >,

  difficulty:
    GameDifficultyId,
): void {
  gameSession.startNewGame({
    difficulty,
  });

  campaignSession.startCampaign(
    difficulty,
  );
}

export function makeGameSetupForm(
  context: SceneContext,
): HTMLFormElement {
  const form =
    makeElement(
      'form',
      {
        className:
          'menu-form game-setup-form',
      },
    );

  const difficultyFields =
    createDifficultySelectionFields();

  const startButton =
    document.createElement(
      'button',
    );

  startButton.type =
    'submit';

  startButton.className =
    'menu-button';

  startButton.textContent =
    text(
      'gameSetup.startGameButton',
    );

  form.append(
    difficultyFields.element,
    startButton,
  );

  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();

      context.audio.sfx.play(
        'button-click',
      );

      const difficulty =
        difficultyFields
          .getSelectedDifficulty();

      const settings =
        gameDifficultySettings[
          difficulty
        ];

      /*
       * Start both runtimes before entering the campaign scene.
       *
       * At this migration stage:
       *
       * - context.game supplies the existing placeholder panel.
       * - context.campaign owns the new political campaign state.
       */
      startCampaignRuntimes(
        context.game,
        context.campaign,
        difficulty,
      );

      context.audio.music
        .playGameplayPlaylist();

      console.log(
        [
          '[ui] new campaign started',
          `difficulty: ${difficulty}`,
          `total turns: ${settings.turnCount}`,
        ].join('; '),
      );

      context.navigate(
        'campaign',
      );
    },
  );

  return form;
}