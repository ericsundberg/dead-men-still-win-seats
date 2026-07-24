import type {
  SceneContext,
} from '../app/scene-router';
import { text } from '../localization/localized-text';
import { makeElement } from '../ui/dom-helpers';
import {
  bindStartupSceneAdvance,
} from './startup-scene-navigation';

const disclaimerSceneDurationMs = 10_000;

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

  scene.style.setProperty(
    '--startup-scene-duration',
    `${disclaimerSceneDurationMs}ms`,
  );

  const disclaimer = makeElement('p', {
    className:
      'startup-scene-content disclaimer-copy',
    textContent: text('startup.disclaimer'),
  });

  scene.append(disclaimer);

  bindStartupSceneAdvance({
    scene,
    context,
    nextScene: 'intro',
    durationMs: disclaimerSceneDurationMs,
  });

  return scene;
}