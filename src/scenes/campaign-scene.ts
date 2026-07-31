import {
  sceneDisposeEventName,
  type SceneContext,
} from '../app/scene-router';
import type {
  GameEventDefinition,
} from '../events/event-types';
import type {
  CampaignState,
} from '../game/campaign/campaign-state';
import {
  makeElement,
} from '../ui/dom-helpers';
import {
  makeCampaignActionPanel,
} from './campaign/campaign-action-panel';
import {
  makeCampaignEndingFmvPlayer,
  resolveCampaignEndingFmv,
  type CampaignEndingFmvPlayer,
} from './campaign/campaign-ending-fmv';
import {
  makeCampaignEventWindow,
  type CampaignEventWindow,
} from './campaign/campaign-event-panel';
import {
  makeCampaignGameOverPanel,
} from './campaign/campaign-game-over-panel';
import {
  makeCampaignPauseMenu,
} from './campaign/campaign-pause-menu';
import {
  makeCampaignShell,
} from './campaign/campaign-shell';
import {
  makeCampaignWeekPanel,
} from './campaign/campaign-week-panel';
import {
  makeNoActiveGamePanel,
} from './yearly-turn/no-active-game-panel';

export interface ResolveCampaignSceneRuntimeOptions {
  readonly campaignState:
    CampaignState | null;
}

export interface CampaignSceneRuntimeSnapshot {
  readonly hasActiveCampaign:
    boolean;

  readonly newsItems:
    readonly string[];
}

export function resolveCampaignSceneRuntime(
  options:
    ResolveCampaignSceneRuntimeOptions,
): CampaignSceneRuntimeSnapshot {
  return {
    hasActiveCampaign:
      options.campaignState
      !== null,

    newsItems:
      options.campaignState
        ?.newsFeed
      ?? [],
  };
}

export function renderCampaignScene(
  context:
    SceneContext,
): HTMLElement {
  const scene =
    makeElement(
      'section',
      {
        className:
          'scene gameplay-scene campaign-scene',
      },
    );

  const campaignState =
    context.campaign
      .getState();

  const runtimeSnapshot =
    resolveCampaignSceneRuntime({
      campaignState,
    });

  if (
    !campaignState
    || !runtimeSnapshot
      .hasActiveCampaign
  ) {
    scene.append(
      makeNoActiveGamePanel(
        context,
      ),
    );

    return scene;
  }

  const campaignContent =
    makeElement(
      'main',
      {
        className:
          'campaign-content printed-report-paper',
      },
    );

  let activeEvent:
    GameEventDefinition | null =
      null;

  let campaignEventWindow:
    CampaignEventWindow | null =
      null;

  let endingFmvPlayer:
    CampaignEndingFmvPlayer | null =
      null;

  let endingFmvStartTimeoutId:
    number | null =
      null;

  if (
    campaignState.phase
    === 'game-over'
  ) {
    endingFmvPlayer =
      appendCampaignGameOverContent(
        context,
        campaignState,
        campaignContent,
      );
  } else if (
    campaignState.phase
    === 'resolving-events'
  ) {
    activeEvent =
      context.campaign
        .getActiveEventDefinition();

    if (
      activeEvent
    ) {
      appendCampaignActionContent(
        context,
        campaignState,
        campaignContent,
      );

      campaignContent.classList.add(
        'campaign-content--event-background',
      );

      campaignContent.setAttribute(
        'inert',
        '',
      );

      campaignContent.setAttribute(
        'aria-hidden',
        'true',
      );
    } else {
      console.warn(
        [
          '[campaign] resolving-events phase has no active event',
          `turn: ${campaignState.currentTurn}`,
        ].join(
          '; ',
        ),
      );

      campaignContent.append(
        makeCampaignEventRuntimeErrorPanel(),
      );
    }
  } else {
    appendCampaignActionContent(
      context,
      campaignState,
      campaignContent,
    );
  }

  const pauseMenu =
    campaignState.phase
    === 'game-over'
      ? null
      : makeCampaignPauseMenu(
          context,
        );

  const campaignShell =
    makeCampaignShell(
      context,
      campaignState,
      campaignContent,
      runtimeSnapshot.newsItems,
      pauseMenu
        ?.menuButton
      ?? null,
    );

  scene.append(
    campaignShell.element,
  );

  if (
    activeEvent
  ) {
    campaignEventWindow =
      makeCampaignEventWindow(
        context,
        campaignState,
        activeEvent,
        scene,
      );

    scene.append(
      campaignEventWindow.element,
    );
  }

  if (
    pauseMenu
  ) {
    scene.append(
      pauseMenu.element,
    );
  }

  if (
    endingFmvPlayer
  ) {
    const playerToStart =
      endingFmvPlayer;

    scene.append(
      playerToStart.element,
    );

    context.audio.music.stop();

    endingFmvStartTimeoutId =
      window.setTimeout(
        () => {
          endingFmvStartTimeoutId =
            null;

          void playerToStart.start();
        },
        0,
      );
  }

  scene.addEventListener(
    sceneDisposeEventName,
    () => {
      if (
        endingFmvStartTimeoutId
        !== null
      ) {
        window.clearTimeout(
          endingFmvStartTimeoutId,
        );

        endingFmvStartTimeoutId =
          null;
      }

      campaignEventWindow
        ?.dispose();

      campaignEventWindow =
        null;

      endingFmvPlayer
        ?.dispose();

      endingFmvPlayer =
        null;

      pauseMenu
        ?.dispose();

      campaignShell.dispose();
    },
    {
      once:
        true,
    },
  );

  return scene;
}

function appendCampaignActionContent(
  context:
    SceneContext,

  campaignState:
    CampaignState,

  campaignContent:
    HTMLElement,
): void {
  campaignContent.append(
    makeCampaignActionPanel(
      context,
      campaignState,
    ),

    makeCampaignWeekPanel(
      campaignState,
    ),
  );
}

function appendCampaignGameOverContent(
  context:
    SceneContext,

  campaignState:
    CampaignState,

  campaignContent:
    HTMLElement,
): CampaignEndingFmvPlayer | null {
  if (
    !campaignState.endGameState
  ) {
    console.warn(
      [
        '[campaign] campaign reached game over',
        'without a recorded end-game result',
      ].join(
        '; ',
      ),
    );
  }

  const gameOverPanel =
    makeCampaignGameOverPanel(
      context,
      campaignState.endGameState,
    );

  const endingFmvDefinition =
    resolveCampaignEndingFmv(
      campaignState.endGameState,
    );

  if (
    !endingFmvDefinition
  ) {
    campaignContent.append(
      gameOverPanel,
    );

    return null;
  }

  gameOverPanel.hidden =
    true;

  let player:
    CampaignEndingFmvPlayer | null =
      null;

  player =
    makeCampaignEndingFmvPlayer({
      definition:
        endingFmvDefinition,

      onFinished:
        (
          reason,
        ) => {
          console.log(
            [
              '[video] campaign ending video finished',
              `video: ${endingFmvDefinition.id}`,
              `reason: ${reason}`,
            ].join(
              '; ',
            ),
          );

          gameOverPanel.hidden =
            false;

          player?.dispose();

          player =
            null;
        },
    });

  campaignContent.append(
    gameOverPanel,
  );

  return player;
}

function makeCampaignEventRuntimeErrorPanel():
  HTMLElement {
  const panel =
    makeElement(
      'section',
      {
        className:
          'campaign-event-runtime-error',
      },
    );

  panel.append(
    makeElement(
      'h2',
      {
        textContent:
          'Campaign Event Unavailable',
      },
    ),

    makeElement(
      'p',
      {
        textContent: [
          'The campaign entered its event phase,',
          'but the event definition could not be found.',
        ].join(
          ' ',
        ),
      },
    ),
  );

  return panel;
}