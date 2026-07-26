import {
  sceneDisposeEventName,
  type SceneContext,
} from '../app/scene-router';
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
  makeCampaignEventPanel,
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

/**
 * Resolves the campaign route exclusively from CampaignSession
 * state.
 *
 * The legacy GameSession is no longer consulted when determining
 * whether the campaign exists or what the campaign scene displays.
 */
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
    if (
      !campaignState
        .endGameState
    ) {
      console.warn(
        [
          '[campaign] campaign reached game over',
          'without a recorded end-game result',
        ].join('; '),
      );
    }

    const gameOverPanel =
      makeCampaignGameOverPanel(
        context,
        campaignState
          .endGameState,
      );

    const endingFmvDefinition =
      resolveCampaignEndingFmv(
        campaignState
          .endGameState,
      );

    if (
      endingFmvDefinition
    ) {
      gameOverPanel.hidden =
        true;

      endingFmvPlayer =
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
                ].join('; '),
              );

              gameOverPanel.hidden =
                false;

              endingFmvPlayer
                ?.dispose();

              endingFmvPlayer =
                null;
            },
        });
    }

    campaignContent.append(
      gameOverPanel,
    );
  } else if (
    campaignState.phase
    === 'resolving-events'
  ) {
    const activeEvent =
      context.campaign
        .getActiveEventDefinition();

    if (
      !activeEvent
    ) {
      console.warn(
        [
          '[campaign] resolving-events phase has no active event',
          `turn: ${campaignState.currentTurn}`,
        ].join('; '),
      );

      campaignContent.append(
        makeCampaignEventRuntimeErrorPanel(),
      );
    } else {
      campaignContent.append(
        makeCampaignEventPanel(
          context,
          campaignState,
          activeEvent,
        ),
      );
    }
  } else {
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
      runtimeSnapshot
        .newsItems,
      pauseMenu
        ?.menuButton
      ?? null,
    );

  scene.append(
    campaignShell.element,
  );

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

    /*
     * Wait until SceneRouter has inserted the campaign scene into
     * the document before requesting video playback.
     */
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

function makeCampaignEventRuntimeErrorPanel():
  HTMLElement {
  const panel =
    makeElement(
      'section',
      {
        className:
          [
            'campaign-event-panel',
            'campaign-event-runtime-error',
          ].join(' '),
      },
    );

  panel.append(
    makeElement(
      'h2',
      {
        className:
          'campaign-event-title',

        textContent:
          'Campaign Event Unavailable',
      },
    ),

    makeElement(
      'p',
      {
        className:
          'campaign-event-description',

        textContent:
          [
            'The campaign entered its event phase,',
            'but the event definition could not be found.',
          ].join(' '),
      },
    ),
  );

  return panel;
}