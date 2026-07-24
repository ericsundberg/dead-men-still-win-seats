import type {
  SceneContext,
} from '../app/scene-router';
import { makeElement } from '../ui/dom-helpers';
import {
  bindStartupSceneAdvance,
} from './startup-scene-navigation';

const brandingSceneDurationMs = 5_000;

export function renderBrandingScene(
  context: SceneContext,
): HTMLElement {
  const scene = makeElement('section', {
    className:
      'scene startup-scene branding-scene',
  });

  scene.setAttribute(
    'aria-label',
    'Game branding',
  );

  const branding = makeElement('h1', {
    className:
      'startup-scene-content branding-title',
    textContent: 'DEAD MEN STILL WIN SEATS.',
  });

  scene.append(branding);

  bindStartupSceneAdvance({
    scene,
    context,
    nextScene: 'disclaimer',
    durationMs: brandingSceneDurationMs,
  });

  return scene;
}