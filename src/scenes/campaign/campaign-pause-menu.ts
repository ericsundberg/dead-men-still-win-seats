import type {
  SceneContext,
} from '../../app/scene-router';
import {
  makeButton,
  makeElement,
} from '../../ui/dom-helpers';
import {
  getUiScale,
  maximumUiScale,
  minimumUiScale,
  setUiScale,
  uiScaleStep,
} from '../../ui/ui-scale';

export type CampaignPauseView =
  | 'menu'
  | 'settings';

export type CampaignPauseAction =
  | 'open'
  | 'close'
  | 'toggle'
  | 'show-menu'
  | 'show-settings';

export interface CampaignPauseState {
  readonly isOpen:
    boolean;

  readonly view:
    CampaignPauseView;
}

export interface CampaignPauseMenu {
  readonly element:
    HTMLElement;

  readonly menuButton:
    HTMLButtonElement;

  readonly open:
    () => void;

  readonly close:
    () => void;

  readonly toggle:
    () => void;

  readonly getState:
    () => CampaignPauseState;

  readonly dispose:
    () => void;
}

const pauseTitleId =
  'campaign-pause-title';

const pauseSettingsSliderId =
  'campaign-pause-settings-scale';

/**
 * Returns the default state used whenever a campaign scene is
 * first rendered.
 */
export function createInitialCampaignPauseState():
  CampaignPauseState {
  return {
    isOpen:
      false,

    view:
      'menu',
  };
}

/**
 * Pure pause-menu state transition helper.
 *
 * Closing the pause menu always resets it to the primary menu so
 * that the next opening begins with Resume selected rather than
 * returning to a nested settings screen.
 */
export function reduceCampaignPauseState(
  state:
    CampaignPauseState,

  action:
    CampaignPauseAction,
): CampaignPauseState {
  switch (action) {
    case 'open':
      return {
        isOpen:
          true,

        view:
          'menu',
      };

    case 'close':
      return {
        isOpen:
          false,

        view:
          'menu',
      };

    case 'toggle':
      return state.isOpen
        ? {
            isOpen:
              false,

            view:
              'menu',
          }
        : {
            isOpen:
              true,

            view:
              'menu',
          };

    case 'show-menu':
      return {
        ...state,

        view:
          'menu',
      };

    case 'show-settings':
      return {
        isOpen:
          true,

        view:
          'settings',
      };
  }
}

/**
 * Creates the campaign pause overlay and the permanent campaign
 * menu button used to open it.
 *
 * The caller owns appending the returned element to the active
 * campaign scene and calling dispose when that scene is removed.
 */
export function makeCampaignPauseMenu(
  context:
    SceneContext,
): CampaignPauseMenu {
  let state =
    createInitialCampaignPauseState();

  let previousFocus:
    HTMLElement | null = null;

  let disposed =
    false;

  const layer =
    makeElement(
      'div',
      {
        className:
          'campaign-pause-layer',
      },
    );

  const menuButton =
    makeButton(
      'Menu',
      () => {
        open();
      },
      'campaign-pause-hud-button',
      {
        onBeforeClick:
          () => {
            context.audio.sfx.play(
              'button-click',
            );
          },
      },
    );

  menuButton.setAttribute(
    'aria-haspopup',
    'dialog',
  );

  menuButton.setAttribute(
    'aria-controls',
    'campaign-pause-overlay',
  );

  const overlay =
    makeElement(
      'div',
      {
        className:
          'campaign-pause-overlay',
      },
    );

  overlay.id =
    'campaign-pause-overlay';

  overlay.hidden =
    true;

  overlay.setAttribute(
    'aria-hidden',
    'true',
  );

  const backdrop =
    makeElement(
      'div',
      {
        className:
          'campaign-pause-backdrop',
      },
    );

  backdrop.setAttribute(
    'aria-hidden',
    'true',
  );

  const dialog =
    makeElement(
      'section',
      {
        className:
          'campaign-pause-dialog',
      },
    );

  dialog.setAttribute(
    'role',
    'dialog',
  );

  dialog.setAttribute(
    'aria-modal',
    'true',
  );

  dialog.setAttribute(
    'aria-labelledby',
    pauseTitleId,
  );

  overlay.append(
    backdrop,
    dialog,
  );

  layer.append(
    overlay,
  );

  function updateState(
    action:
      CampaignPauseAction,
  ): void {
    if (
      disposed
    ) {
      return;
    }

    const wasOpen =
      state.isOpen;

    const nextState =
      reduceCampaignPauseState(
        state,
        action,
      );

    if (
      !wasOpen
      && nextState.isOpen
    ) {
      previousFocus =
        document.activeElement
          instanceof HTMLElement
          ? document.activeElement
          : null;
    }

    state =
      nextState;

    render();

    if (
      wasOpen
      && !state.isOpen
    ) {
      previousFocus?.focus();

      previousFocus =
        null;
    }
  }

  function open():
    void {
    updateState(
      'open',
    );
  }

  function close():
    void {
    updateState(
      'close',
    );
  }

  function toggle():
    void {
    updateState(
      'toggle',
    );
  }

  function showMenu():
    void {
    updateState(
      'show-menu',
    );
  }

  function showSettings():
    void {
    updateState(
      'show-settings',
    );
  }

  function render():
    void {
    overlay.hidden =
      !state.isOpen;

    overlay.setAttribute(
      'aria-hidden',
      String(
        !state.isOpen,
      ),
    );

    menuButton.setAttribute(
      'aria-expanded',
      String(
        state.isOpen,
      ),
    );

    if (
      !state.isOpen
    ) {
      dialog.replaceChildren();

      return;
    }

    if (
      state.view
      === 'settings'
    ) {
      dialog.replaceChildren(
        makeSettingsView(),
      );
    } else {
      dialog.replaceChildren(
        makePrimaryMenuView(),
      );
    }

    queueMicrotask(
      () => {
        if (
          disposed
          || !state.isOpen
        ) {
          return;
        }

        const firstControl =
          dialog.querySelector<
            HTMLButtonElement
            | HTMLInputElement
          >(
            'button, input',
          );

        firstControl?.focus();
      },
    );
  }

  function makePrimaryMenuView():
    HTMLElement {
    const content =
      makeElement(
        'div',
        {
          className:
            'campaign-pause-content campaign-pause-main-view',
        },
      );

    const heading =
      makeElement(
        'h2',
        {
          className:
            'campaign-pause-title',

          textContent:
            'Game Paused',
        },
      );

    heading.id =
      pauseTitleId;

    const description =
      makeElement(
        'p',
        {
          className:
            'campaign-pause-description',

          textContent:
            'The campaign is waiting for your return.',
        },
      );

    const menu =
      makeElement(
        'nav',
        {
          className:
            'campaign-pause-menu',
        },
      );

    menu.setAttribute(
      'aria-label',
      'Pause menu',
    );

    menu.append(
      makeButton(
        'Resume',
        close,
        'menu-button campaign-pause-menu-button',
        {
          onBeforeClick:
            () => {
              context.audio.sfx.play(
                'button-cancel',
              );
            },
        },
      ),

      makeButton(
        'Settings',
        showSettings,
        'menu-button campaign-pause-menu-button',
        {
          onBeforeClick:
            () => {
              context.audio.sfx.play(
                'button-click',
              );
            },
        },
      ),

      makeButton(
        'Exit to Main Menu',
        () => {
          close();

          context.navigate(
            'title',
          );
        },
        'menu-button campaign-pause-menu-button',
        {
          onBeforeClick:
            () => {
              context.audio.sfx.play(
                'button-cancel',
              );
            },
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
        'menu-button campaign-pause-menu-button',
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

    content.append(
      heading,
      description,
      menu,
    );

    return content;
  }

  function makeSettingsView():
    HTMLElement {
    const content =
      makeElement(
        'div',
        {
          className:
            'campaign-pause-content campaign-pause-settings-view',
        },
      );

    const heading =
      makeElement(
        'h2',
        {
          className:
            'campaign-pause-title',

          textContent:
            'Settings',
        },
      );

    heading.id =
      pauseTitleId;

    const description =
      makeElement(
        'p',
        {
          className:
            'campaign-pause-description',

          textContent:
            'Adjust the text scale between 75% and 150%.',
        },
      );

    const scaleControl =
      makeElement(
        'div',
        {
          className:
            'campaign-pause-scale-control',
        },
      );

    const scaleHeading =
      makeElement(
        'div',
        {
          className:
            'campaign-pause-scale-heading',
        },
      );

    const scaleLabel =
      makeElement(
        'label',
        {
          className:
            'campaign-pause-scale-label',

          textContent:
            'Text Scale',
        },
      );

    scaleLabel.htmlFor =
      pauseSettingsSliderId;

    const scaleStatus =
      makeElement(
        'output',
        {
          className:
            'campaign-pause-scale-value',
        },
      );

    scaleStatus.setAttribute(
      'for',
      pauseSettingsSliderId,
    );

    const scaleInput =
      document.createElement(
        'input',
      );

    scaleInput.id =
      pauseSettingsSliderId;

    scaleInput.name =
      'pause-text-scale';

    scaleInput.type =
      'range';

    scaleInput.className =
      'campaign-pause-scale-slider';

    scaleInput.min =
      String(
        scaleToPercentage(
          minimumUiScale,
        ),
      );

    scaleInput.max =
      String(
        scaleToPercentage(
          maximumUiScale,
        ),
      );

    scaleInput.step =
      String(
        scaleToPercentage(
          uiScaleStep,
        ),
      );

    const refreshScaleControl =
      (
        scale:
          number,
      ): void => {
        const percentage =
          scaleToPercentage(
            scale,
          );

        scaleInput.value =
          String(
            percentage,
          );

        scaleInput.setAttribute(
          'aria-valuetext',
          `${percentage}%`,
        );

        scaleStatus.textContent =
          `${percentage}%`;
      };

    refreshScaleControl(
      getUiScale(),
    );

    scaleInput.addEventListener(
      'input',
      () => {
        const percentage =
          Number.parseInt(
            scaleInput.value,
            10,
          );

        if (
          !Number.isFinite(
            percentage,
          )
        ) {
          return;
        }

        const appliedScale =
          setUiScale(
            percentage
            / 100,
          );

        refreshScaleControl(
          appliedScale,
        );
      },
    );

    scaleInput.addEventListener(
      'change',
      () => {
        context.audio.sfx.play(
          'button-click',
        );
      },
    );

    scaleHeading.append(
      scaleLabel,
      scaleStatus,
    );

    scaleControl.append(
      scaleHeading,
      scaleInput,
    );

    const backButton =
      makeButton(
        'Back',
        showMenu,
        'secondary-button campaign-pause-back-button',
        {
          onBeforeClick:
            () => {
              context.audio.sfx.play(
                'button-cancel',
              );
            },
        },
      );

    content.append(
      heading,
      description,
      scaleControl,
      backButton,
    );

    return content;
  }

  const onKeyDown =
    (
      event:
        KeyboardEvent,
    ): void => {
      if (
        event.key
        !== 'Escape'
        || event.repeat
      ) {
        return;
      }

      event.preventDefault();

      toggle();
    };

  document.addEventListener(
    'keydown',
    onKeyDown,
  );

  render();

  return {
    element:
      layer,

    menuButton,

    open,
    close,
    toggle,

    getState:
      () =>
        state,

    dispose:
      () => {
        if (
          disposed
        ) {
          return;
        }

        disposed =
          true;

        document.removeEventListener(
          'keydown',
          onKeyDown,
        );

        overlay.remove();
        menuButton.remove();

        previousFocus =
          null;
      },
  };
}

function scaleToPercentage(
  scale:
    number,
): number {
  return Math.round(
    scale
    * 100,
  );
}