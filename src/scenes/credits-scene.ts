import type {
  SceneContext,
} from '../app/scene-router';
import {
  makeButton,
  makeElement,
} from '../ui/dom-helpers';
import {
  appendTertiaryMenuBackground,
} from './shared/tertiary-menu-background';

const creditsLines = [
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
  'ACTORS',
  'RYAN - SENATOR PHIL A. BUSTER',
  'ERIC - BALD GUY IN CHARGE',
  '',
  '',
  'DEDICATED TO THE LIVE PRESUMED DEAD.',
] as const;

export function getCreditsText():
  string {
  return creditsLines.join(
    '\n',
  );
}

export function renderCreditsScene(
  context:
    SceneContext,
): HTMLElement {
  const scene =
    makeElement(
      'section',
      {
        className:
          'scene credits-scene',
      },
    );

  appendTertiaryMenuBackground(
    scene,
  );

  const panel =
    makeElement(
      'section',
      {
        className:
          'scene-panel credits-panel',
      },
    );

  panel.setAttribute(
    'aria-labelledby',
    'credits-scene-title',
  );

  const header =
    makeElement(
      'header',
      {
        className:
          'credits-header',
      },
    );

  const title =
    makeElement(
      'h1',
      {
        className:
          'credits-title',

        textContent:
          'Credits',
      },
    );

  title.id =
    'credits-scene-title';

  header.append(
    title,
  );

  const crawlViewport =
    makeElement(
      'div',
      {
        className:
          'credits-crawl-viewport',
      },
    );

  crawlViewport.tabIndex =
    0;

  crawlViewport.setAttribute(
    'role',
    'region',
  );

  crawlViewport.setAttribute(
    'aria-label',
    'Game credits',
  );

  const crawlTrack =
    makeElement(
      'div',
      {
        className:
          'credits-crawl-track',
      },
    );

  const creditsText =
    makeElement(
      'p',
      {
        className:
          [
            'scene-description',
            'credits-text',
          ].join(
            ' ',
          ),

        textContent:
          getCreditsText(),
      },
    );

  crawlTrack.append(
    creditsText,
  );

  crawlViewport.append(
    crawlTrack,
  );

  const footer =
    makeElement(
      'footer',
      {
        className:
          'credits-footer',
      },
    );

  footer.append(
    makeButton(
      'Back',
      () => {
        context.navigate(
          'title',
        );
      },
      [
        'secondary-button',
        'credits-back-button',
      ].join(
        ' ',
      ),
      {
        onBeforeClick:
          () => {
            context.audio.sfx.play(
              'button-cancel',
            );
          },
      },
    ),
  );

  panel.append(
    header,
    crawlViewport,
    footer,
  );

  scene.append(
    panel,
  );

  return scene;
}