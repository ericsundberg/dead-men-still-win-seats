import type { SceneContext } from '../../app/scene-router';
import type { RulerGender } from '../../game/ruler-profile';
import { text } from '../../localization/localized-text';
import { makeElement } from '../../ui/dom-helpers';
import {
  appendRulerCreationFieldLabels,
  createRulerCreationFields,
} from './ruler-creation-fields';

export function makeRulerCreationForm(context: SceneContext): HTMLFormElement {
  const form = makeElement('form', {
    className: 'menu-form',
  });

  const fields = createRulerCreationFields();
  const startButton = document.createElement('button');

  startButton.type = 'submit';
  startButton.className = 'menu-button';
  startButton.textContent = text('gameSetup.startGameButton');

  appendRulerCreationFieldLabels(form, fields);

  form.append(startButton);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    context.audio.sfx.play('button-click');

    context.game.startNewGame({
      givenName: fields.givenNameInput.value,
      familyName: fields.familyNameInput.value,
      startingAge: Number.parseInt(fields.startingAgeInput.value, 10),
      gender: fields.genderSelect.value as RulerGender,
    });

    const rulerProfile = context.game.getRulerProfile();

    console.log(
      `[ui] new game started for ruler: ${rulerProfile?.givenName} ${rulerProfile?.familyName}`,
    );

    context.navigate('yearly-turn');
  });

  return form;
}