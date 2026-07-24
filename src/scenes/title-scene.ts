import type { SceneContext } from '../app/scene-router';
import { makeButton, makeElement } from '../ui/dom-helpers';
import { game_version } from '../version';
import { makeTitleBackground } from './title/title-background';

export function renderTitleScene(context: SceneContext): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene title-scene',
  });

  context.audio.unlocker.bindToFirstGesture(scene, () => {
    context.audio.music.play('main-menu-theme');
  });

  const panel = makeElement('div', {
    className: 'scene-panel title-panel',
  });

  const title = makeElement('h1', {
    className: 'game-title',
    textContent: 'Dead Men Still Win Seats',
  });

  const version = makeElement('p', {
    className: 'game-version',
    textContent: `Version ${game_version}`,
  });

  const subtitle = makeElement('p', {
    className: 'scene-description',
    textContent: 'A browser-first turn-based political satire game about winning an election with a very unavailable candidate.',
  });

  const menu = makeElement('nav', {
    className: 'title-menu',
  });

  const playButtonClick = (): void => {
    context.audio.sfx.play('button-click');
  };

  menu.setAttribute('aria-label', 'Main menu');

  menu.append(
    makeButton('New Game', () => context.navigate('game-setup'), 'menu-button', {
      onBeforeClick: playButtonClick,
    }),
    makeButton('Load Game', () => context.navigate('load-game'), 'menu-button', {
      onBeforeClick: playButtonClick,
    }),
    makeButton('Settings', () => context.navigate('settings'), 'menu-button', {
      onBeforeClick: playButtonClick,
    }),
    makeButton('Credits', () => context.navigate('credits'), 'menu-button', {
      onBeforeClick: playButtonClick,
    }),
    makeButton(
      'Quit Game',
      () => {
        console.log('[ui] quit requested: reloading browser page');
        globalThis.location.reload();
      },
      'menu-button',
      {
        onBeforeClick: playButtonClick,
      },
    ),
  );

  panel.append(title, version, subtitle, menu);
  scene.append(makeTitleBackground(), panel);

  return scene;
}
