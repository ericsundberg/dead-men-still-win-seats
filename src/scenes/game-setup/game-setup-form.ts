import type { SceneContext } from '../../app/scene-router';
import { gameDifficultySettings } from '../../game/difficulty';
import { text } from '../../localization/localized-text';
import { makeElement } from '../../ui/dom-helpers';
import {
  createDifficultySelectionFields,
} from './difficulty-selection-fields';

export function makeGameSetupForm(
  context: SceneContext,
): HTMLFormElement {
  const form = makeElement('form', {
    className: 'menu-form game-setup-form',
  });

  const difficultyFields = createDifficultySelectionFields();
  const startButton = document.createElement('button');

  startButton.type = 'submit';
  startButton.className = 'menu-button';
  startButton.textContent = text('gameSetup.startGameButton');

  form.append(
    difficultyFields.element,
    startButton,
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    context.audio.sfx.play('button-click');

    const difficulty =
      difficultyFields.getSelectedDifficulty();

    const settings =
      gameDifficultySettings[difficulty];

    context.game.startNewGame({
      difficulty,
    });

    context.audio.music.playGameplayPlaylist();

    console.log(
      `[ui] new game started with difficulty: ${difficulty}; total turns: ${settings.turnCount}`,
    );

    context.navigate('yearly-turn');
  });

  return form;
}