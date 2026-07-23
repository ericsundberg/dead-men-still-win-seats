import type { SceneContext } from '../app/scene-router';
import { makeButton, makeElement } from '../ui/dom-helpers';

export function renderCreditsScene(context: SceneContext): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  const title = makeElement('h1', {
    textContent: 'Credits',
  });

  const description = makeElement('p', {
    className: 'scene-description',
    textContent:
      'Dead Men Still Win Seats is a TypeScript game jam project about managing a political campaign that cannot admit its candidate is dead.',
  });

  panel.append(
    title,
    description,
    makeButton('Back', () => context.navigate('title'), 'secondary-button', {
      onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  scene.append(panel);

  return scene;
}
