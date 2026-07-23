import type { SceneContext } from '../../app/scene-router';
import { makeButton, makeElement } from '../../ui/dom-helpers';

export function makeNoActiveGamePanel(context: SceneContext): HTMLElement {
  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  panel.append(
    makeElement('h1', {
      textContent: 'No Active Game',
    }),
    makeElement('p', {
      className: 'scene-description',
      textContent: 'Start a new game before entering yearly commands.',
    }),
    makeButton('New Game', () => context.navigate('game-setup'), 'menu-button', {
    onBeforeClick: () => context.audio.sfx.play('button-click'),
    }),
    makeButton('Back to Title', () => context.navigate('title'), 'secondary-button', {
    onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  return panel;
}
