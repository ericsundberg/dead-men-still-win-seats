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

  const creditsText = [
    'DEAD MEN STILL WIN SEATS', 
    '', 
    '', 
    'DEVELOPMENT', 
    'ERIC AND RYAN   CO-PRODUCERS', 
    'ERIC -  PROJECT LEAD', 
    'ERIC -  GAME DIRECTOR', 
    '', 
    '', 
    'DESIGN', 
    'ERIC -  LEAD GAME DESIGN', 
    'ERIC AND RYAN - ORIGINAL CONCEPT', 
    'ERIC AND RYAN - GAME DESIGN', 
    'ERIC - NARRATIVE DESIGN AND WRITING', 
    'RYAN - ADDITIONAL NARRATIVE AND EVENT DESIGN', 
    '', 
    '', 
    'PROGRAMMING', 
    'ERIC - LEAD DEVELOPER', 
    'ERIC - GAME SYSTEMS', 
    'ERIC - USER INTERFACE PROGRAMMING', 
    'ERIC - AUDIO IMPLEMENTATION', 
    '', 
    '', 
    'ART', 
    'ERIC - ART DIRECTION', 
    'RYAN - LEAD ARTIST', 
    'RYAN - ILLUSTRATION', 
    'RYAN - CHARACTER ART AND LINE WORK', 
    'ERIC AND RYAN - VISUAL DEVELOPMENT', 
    '', 
    '', 
    'INTERFACE AND AUDIO', 
    'ERIC - UI AND UX DESIGN', 
    'ERIC - AUDIO DESIGN',
    '',
    '',
    'DEDICATED TO THE LIVE PRESUMED DEAD.',
  ].join('\n');

  const description = makeElement('p', {
    className: 'scene-description credits-text',
    textContent: creditsText,
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