import type { SceneContext } from '../app/scene-router';
import { makeButton, makeElement } from '../ui/dom-helpers';
import {
  appendTertiaryMenuBackground,
} from './shared/tertiary-menu-background';

export function renderCreditsScene(
  context: SceneContext,
): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  appendTertiaryMenuBackground(scene);

  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  const title = makeElement('h1', {
    textContent: 'Credits',
  });

  const description = makeElement('p', {
    className: 'scene-description',
    textContent: 'DIRECTED BY ERIC AND RYAN',
  });

  panel.append(
    title,
    description,
    makeButton(
      'Back',
      () => context.navigate('title'),
      'secondary-button',
      {
        onBeforeClick: () => {
          context.audio.sfx.play('button-cancel');
        },
      },
    ),
  );

  scene.append(panel);

  return scene;
}