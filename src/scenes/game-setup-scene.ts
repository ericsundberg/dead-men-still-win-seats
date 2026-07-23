import type { SceneContext } from '../app/scene-router';
import { text } from '../localization/localized-text';
import { makeButton, makeElement } from '../ui/dom-helpers';
import { makeRulerCreationForm } from './game-setup/ruler-creation-form';

export function renderGameSetupScene(context: SceneContext): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  panel.append(
    makeElement('h1', {
      textContent: text('gameSetup.title'),
    }),
    makeElement('p', {
      className: 'scene-description',
      textContent: text('gameSetup.description'),
    }),
    makeElement('p', {
      className: 'scene-description',
      textContent: text('gameSetup.startYearNote'),
    }),
    makeRulerCreationForm(context),
    makeButton(text('gameSetup.backButton'), () => context.navigate('title'), 'secondary-button', {
      onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  scene.append(panel);

  return scene;
}