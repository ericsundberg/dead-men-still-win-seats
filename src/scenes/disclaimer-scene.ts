import type {
  SceneContext,
} from '../app/scene-router';
import { text } from '../localization/localized-text';
import { makeElement } from '../ui/dom-helpers';
import {
  bindStartupSceneAdvance,
} from './startup-scene-navigation';

export function renderDisclaimerScene(
  context: SceneContext,
): HTMLElement {
  const scene = makeElement('section', {
    className:
      'scene startup-scene disclaimer-scene',
  });

  scene.setAttribute(
    'aria-label',
    'Disclaimer',
  );

  const disclaimer = makeElement('p', {
    className:
      'disclaimer-copy',
    textContent: text('startup.disclaimer'),
  });

  const continuePrompt = makeElement('p', {
    className:
      'disclaimer-continue-prompt',
    textContent: text(
      'startup.continuePrompt',
    ),
  });

  const content = makeElement('div', {
    className:
      'startup-scene-content disclaimer-content',
  });

  content.append(
    disclaimer,
    continuePrompt,
  );

  scene.append(content);

  bindStartupSceneAdvance({
    scene,
    context,
    nextScene: 'intro',
    fadeOnAdvance: false,
  });

  return scene;
}