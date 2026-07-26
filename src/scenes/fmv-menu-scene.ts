import {
  sceneDisposeEventName,
  type SceneContext,
} from '../app/scene-router';
import {
  makeButton,
  makeElement,
} from '../ui/dom-helpers';
import {
  makeCampaignEndingFmvPlayer,
  resolveCampaignEndingFmvById,
  type CampaignEndingFmvPlayer,
} from './campaign/campaign-ending-fmv';
import {
  renderIntroScene,
} from './intro-scene';
import {
  appendTertiaryMenuBackground,
} from './shared/tertiary-menu-background';
import {
  isCampaignEndingFmvSelection,
  resolveIntroPreviewDestination,
  titleFmvMenuItems,
  type TitleFmvSelectionId,
} from './title/title-fmv-menu';

export function renderFmvMenuScene(
  context:
    SceneContext,
): HTMLElement {
  const scene =
    makeElement(
      'section',
      {
        className:
          'scene',
      },
    );

  appendTertiaryMenuBackground(
    scene,
  );

  let previewPlayer:
    CampaignEndingFmvPlayer | null =
      null;

  scene.addEventListener(
    sceneDisposeEventName,
    () => {
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

  const panel =
    makeElement(
      'div',
      {
        className:
          'scene-panel',
      },
    );

  const title =
    makeElement(
      'h1',
      {
        textContent:
          'Watch FMVs',
      },
    );

  const description =
    makeElement(
      'p',
      {
        className:
          'scene-description',

        textContent:
          'Select a full-motion video.',
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
    'FMV menu',
  );

  const playButtonClick =
    (): void => {
      context.audio.sfx.play(
        'button-click',
      );
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
          'intro-preview',
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

    menu.append(
      fmvButton,
    );
  }

  menu.append(
    makeButton(
      'Back',
      () => {
        context.navigate(
          'title',
        );
      },
      'secondary-button',
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
    title,
    description,
    menu,
  );

  scene.append(
    panel,
  );

  return scene;
}

export function renderIntroPreviewScene(
  context:
    SceneContext,
): HTMLElement {
  return renderIntroScene({
    ...context,

    navigate:
      (
        nextScene,
      ) => {
        context.navigate(
          resolveIntroPreviewDestination(
            nextScene,
          ),
        );
      },
  });
}
