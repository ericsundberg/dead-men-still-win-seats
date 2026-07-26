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
  makeCampaignEndingFmvPlayer,
  resolveCampaignEndingFmvById,
  type CampaignEndingFmvPlayer,
} from './campaign/campaign-ending-fmv';
import {
  makeTitleBackground,
} from './title/title-background';
import {
  isCampaignEndingFmvSelection,
  titleFmvMenuItems,
  type TitleFmvSelectionId,
} from './title/title-fmv-menu';
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

  let isFmvMenuOpen =
    false;

  let previewPlayer:
    CampaignEndingFmvPlayer | null =
      null;

  const resetIdleIntro =
    (): void => {
      idleIntroState =
        createInitialTitleIdleIntroState();

      hasRequestedIdleIntro =
        false;
    };

  const unsubscribeTrackLoops =
    context.audio.music
      .subscribeTrackLoops(
        (
          trackId,
        ) => {
          if (
            isFmvMenuOpen
            || previewPlayer
          ) {
            return;
          }

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
    () => {
      unsubscribeTrackLoops();

      previewPlayer
        ?.dispose();

      previewPlayer =
        null;
    },
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

  const mainMenu =
    makeElement(
      'nav',
      {
        className:
          'title-menu',
      },
    );

  const fmvMenu =
    makeElement(
      'nav',
      {
        className:
          'title-menu title-fmv-menu',
      },
    );

  fmvMenu.hidden =
    true;

  mainMenu.setAttribute(
    'aria-label',
    'Main menu',
  );

  fmvMenu.setAttribute(
    'aria-label',
    'FMV player menu',
  );

  const playButtonClick =
    (): void => {
      context.audio.sfx.play(
        'button-click',
      );
    };

  const fmvMenuHeading =
    makeElement(
      'p',
      {
        className:
          'game-version',

        textContent:
          'FMV Player',
      },
    );

  let watchFmvsButton:
    HTMLButtonElement;

  const openFmvMenu =
    (): void => {
      resetIdleIntro();

      isFmvMenuOpen =
        true;

      mainMenu.hidden =
        true;

      fmvMenu.hidden =
        false;

      const firstFmvButton =
        fmvMenu.querySelector<
          HTMLButtonElement
        >(
          'button',
        );

      firstFmvButton
        ?.focus();
    };

  const closeFmvMenu =
    (): void => {
      resetIdleIntro();

      isFmvMenuOpen =
        false;

      fmvMenu.hidden =
        true;

      mainMenu.hidden =
        false;

      watchFmvsButton.focus();
    };

  const playFmv =
    (
      selectionId:
        TitleFmvSelectionId,

      triggerButton:
        HTMLButtonElement,
    ): void => {
      if (
        previewPlayer
      ) {
        return;
      }

      context.audio.music.stop();

      if (
        !isCampaignEndingFmvSelection(
          selectionId,
        )
      ) {
        context.navigate(
          'intro',
        );

        return;
      }

      const definition =
        resolveCampaignEndingFmvById(
          selectionId,
        );

      let player:
        CampaignEndingFmvPlayer;

      player =
        makeCampaignEndingFmvPlayer({
          definition,

          onFinished:
            () => {
              if (
                previewPlayer
                !== player
              ) {
                return;
              }

              player.dispose();

              previewPlayer =
                null;

              if (
                !scene.isConnected
              ) {
                return;
              }

              context.audio.music.play(
                'main-menu-theme',
                {
                  restart:
                    true,
                },
              );

              triggerButton.focus();
            },
        });

      previewPlayer =
        player;

      scene.append(
        player.element,
      );

      void player.start();
    };

  watchFmvsButton =
    makeButton(
      'Watch FMVs',
      openFmvMenu,
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    );

  mainMenu.append(
    makeButton(
      'New Game',
      () =>
        context.navigate(
          'game-setup',
        ),
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    makeButton(
      'Load Game',
      () =>
        context.navigate(
          'load-game',
        ),
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    makeButton(
      'Settings',
      () =>
        context.navigate(
          'settings',
        ),
      'menu-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),

    watchFmvsButton,

    makeButton(
      'Credits',
      () =>
        context.navigate(
          'credits',
        ),
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

  fmvMenu.append(
    fmvMenuHeading,
  );

  for (
    const menuItem
    of titleFmvMenuItems
  ) {
    let fmvButton:
      HTMLButtonElement;

    fmvButton =
      makeButton(
        menuItem.label,
        () => {
          playFmv(
            menuItem.id,
            fmvButton,
          );
        },
        'menu-button',
        {
          onBeforeClick:
            playButtonClick,
        },
      );

    fmvMenu.append(
      fmvButton,
    );
  }

  fmvMenu.append(
    makeButton(
      'Back',
      closeFmvMenu,
      'secondary-button',
      {
        onBeforeClick:
          playButtonClick,
      },
    ),
  );

  panel.append(
    title,
    subtitle,
    mainMenu,
    fmvMenu,
  );

  scene.append(
    makeTitleBackground(),
    panel,
  );

  return scene;
}
