import type { SceneContext } from '../app/scene-router';
import { makeButton, makeElement } from '../ui/dom-helpers';
import {
  decreaseUiScale,
  getUiScale,
  increaseUiScale,
  resetUiScale,
} from '../ui/ui-scale';

export function renderSettingsScene(context: SceneContext): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  const title = makeElement('h1', {
    textContent: 'Settings',
  });

  const description = makeElement('p', {
    className: 'scene-description',
    textContent: 'Basic UI scale controls for early testing.',
  });

  const scaleStatus = makeElement('p', {
    className: 'setting-status',
  });

  const refreshScaleStatus = (): void => {
    scaleStatus.textContent = `Current UI scale: ${getUiScale().toFixed(2)}x`;
  };

  refreshScaleStatus();

  const controls = makeElement('div', {
    className: 'button-row',
  });

  controls.append(
    makeButton('Decrease Scale', () => {
      context.audio.sfx.play('button-click');
      decreaseUiScale();
      refreshScaleStatus();
    }),
    makeButton('Increase Scale', () => {
      context.audio.sfx.play('button-click');
      increaseUiScale();
      refreshScaleStatus();
    }),
    makeButton('Reset Scale', () => {
      context.audio.sfx.play('button-click');
      resetUiScale();
      refreshScaleStatus();
    }),
  );

  panel.append(
    title,
    description,
    scaleStatus,
    controls,
    makeButton('Back', () => context.navigate('title'), 'secondary-button', {
      onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  scene.append(panel);

  return scene;
}
