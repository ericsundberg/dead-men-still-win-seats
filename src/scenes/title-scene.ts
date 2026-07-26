import {
  sceneDisposeEventName,
  type SceneContext,
} from '../app/scene-router';
import {
  makeButton,
  makeElement,
} from '../ui/dom-helpers';
import {
  game_version,
} from '../version';
import {
  unavailableDifficultyMessage,
} from './game-setup/difficulty-selection-fields';
import {
  makeTitleBackground,
} from './title/title-background';
import {
  createInitialTitleIdleIntroState,
  recordTitleIdleMusicLoop,
} from './title/title-idle-intro';

export function renderTitleScene(
  context:
    SceneContext,
): HTMLElement {
  const scene =
    makeElement(
      'section',
      {
        className:
          'scene title-scene',
      },
    );

  let idleIntroState =
    createInitialTitleIdleIntroState();

  let hasRequestedIdleIntro =
    false;

  const unsubscribeTrackLoops =
    context.audio.music
      .subscribeTrackLoops(
        (
          trackId,
        ) => {
          idleIntroState =
            recordTitleIdleMusicLoop(
              idleIntroState,
              trackId,
            );

          if (
            !idleIntroState
              .shouldStartIntro
            || hasRequestedIdleIntro
          ) {
            return;
          }

          hasRequestedIdleIntro =
            true;

          context.audio.music.stop();

          context.navigate(
            'intro',
          );
        },
      );

  scene.addEventListener(
    sceneDisposeEventName,
    unsubscribeTrackLoops,
    {
      once:
        true,
    },
  );

  const playTitleMusic =
    (): void => {
      context.audio.music.play(
        'main-menu-theme',
      );
    };

  if (
    context.audio.unlocker
      .getIsUnlocked()
  ) {
    playTitleMusic();
  } else {
    context.audio.unlocker
      .bindToFirstGesture(
        scene,
        playTitleMusic,
      );
  }

  const panel =
    makeElement(
      'div',
      {
        className:
          'scene-panel title-panel',
      },
    );

  const title =
    makeElement(
      'h1',
      {
        className:
          'game-title',

        textContent:
          'Dead Men Still Win Seats',
      },
    );

  const version =
    makeElement(
      'p',
      {
        className:
          'game-version',

        textContent:
          `Version ${game_version}`,
      },
    );

  const subtitle =
    makeElement(
      'p',
      {
        className:
          'scene-description',

        textContent:
          [
            'A browser-first turn-based political satire game',
            'about winning an election with a very unavailable candidate.',
          ].join(' '),
      },
    );

  const menu =
    makeElement(
      'nav',
      {
        className:
          'title-menu',
      },
    );

  menu.setAttribute(
    'aria-label',
    'Main menu',
  );

  const playButtonClick =
    (): void => {
      context.audio.sfx.play(
        'button-click',
      );
    };

  const loadGameMessageId =
    'load-game-unavailable-message';

  const loadGameOption =
    makeElement(
      'div',
      {
        className:
          'title-menu-option is-unavailable',
      },
    );

  loadGameOption.tabIndex =
    0;

  loadGameOption.title =
    unavailableDifficultyMessage;

  loadGameOption.setAttribute(
    'aria-describedby',
    loadGameMessageId,
  );

  const loadGameButton =
    makeButton(
      'Load Game',
      () => undefined,
      'menu-button',
    );

  loadGameButton.disabled =
    true;

  loadGameButton.setAttribute(
    'aria-disabled',
    'true',
  );

  const loadGameMessage =
    makeElement(
      'span',
      {
        className:
          'difficulty-unavailable-message',

        textContent:
          unavailableDifficultyMessage,
      },
    );

  loadGameMessage.id =
    loadGameMessageId;

  loadGameMessage.setAttribute(
    'role',
    'tooltip',
  );

  loadGameOption.append(
    loadGameButton,
    loadGameMessage,
  );

  menu.append(
    makeButton(
      'New Game',
      () => {
        context.navigate(
          'game-setup',
        );
      },
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    loadGameOption,

    makeButton(
      'Settings',
      () => {
        context.navigate(
          'settings',
        );
      },
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    makeButton(
      'Watch FMVs',
      () => {
        context.navigate(
          'fmv-menu',
        );
      },
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    makeButton(
      'Credits',
      () => {
        context.navigate(
          'credits',
        );
      },
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    makeButton(
      'Quit Game',
      () => {
        console.log(
          '[ui] quit requested: reloading browser page',
        );

        globalThis.location.reload();
      },
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    version,
  );

  panel.append(
    title,
    subtitle,
    menu,
  );

  scene.append(
    makeTitleBackground(),
    panel,
  );

  return scene;
}
