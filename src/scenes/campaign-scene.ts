import {
  sceneDisposeEventName,
  type SceneContext,
} from '../app/scene-router';
import type {
  GameState,
} from '../core/types';
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
  makeCampaignEventPanel,
} from './campaign/campaign-event-panel';
import {
  makeCampaignGameOverPanel,
} from './campaign/campaign-game-over-panel';
import {
  makeCampaignShell,
} from './campaign/campaign-shell';
import {
  makeCampaignStatusSummary,
} from './campaign/campaign-status-summary';
import {
  makeCampaignWeekPanel,
} from './campaign/campaign-week-panel';
import {
  makeGameOverPanel,
} from './yearly-turn/game-over-panel';
import {
  makeNoActiveGamePanel,
} from './yearly-turn/no-active-game-panel';

export interface ResolveCampaignSceneRuntimeOptions {
  readonly campaignState:
    CampaignState | null;

  readonly legacyState:
    GameState | null;
}

export interface CampaignSceneRuntimeSnapshot {
  readonly hasActiveCampaign:
    boolean;

  readonly hasLegacyState:
    boolean;

  readonly hasRuntimeMismatch:
    boolean;

  readonly newsItems:
    readonly string[];
}

export function resolveCampaignSceneRuntime(
  options:
    ResolveCampaignSceneRuntimeOptions,
): CampaignSceneRuntimeSnapshot {
  const hasActiveCampaign =
    options.campaignState
    !== null;

  const hasLegacyState =
    options.legacyState
    !== null;

  return {
    hasActiveCampaign,
    hasLegacyState,

    hasRuntimeMismatch:
      hasActiveCampaign
      && !hasLegacyState,

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

  const legacyState =
    context.game
      .getState();

  const runtimeSnapshot =
    resolveCampaignSceneRuntime({
      campaignState,
      legacyState,
    });

  if (
    !runtimeSnapshot
      .hasActiveCampaign
  ) {
    scene.append(
      makeNoActiveGamePanel(
        context,
      ),
    );

    return scene;
  }

  /*
   * The visible Hamurabi panel has now been replaced by a
   * campaign-native weekly briefing.
   *
   * The temporary runtime mismatch guard remains until the
   * campaign scene and shell stop consulting GameSession
   * entirely in the next migration checkpoint.
   */
  if (
    !campaignState
    || runtimeSnapshot
      .hasRuntimeMismatch
    || !legacyState
  ) {
    console.warn(
      [
        '[campaign] active campaign is missing',
        'the temporary legacy game state',
      ].join('; '),
    );

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

  campaignContent.append(
    makeCampaignStatusSummary(
      campaignState,
    ),
  );

  const legacyGameOverState =
    context.game
      .getGameOverState();

  /*
   * CampaignSession is authoritative for political campaign
   * results. This branch takes priority over the temporary
   * legacy game-over fallback.
   */
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

    campaignContent.append(
      makeCampaignGameOverPanel(
        context,
        campaignState
          .endGameState,
      ),
    );
  } else if (
    legacyGameOverState
  ) {
    /*
     * Temporary fallback for a legacy game that reaches its own
     * terminal state before GameSession is removed from this
     * scene completely.
     */
    campaignContent.append(
      makeGameOverPanel(
        context,
        legacyGameOverState,
      ),
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

  const campaignShell =
    makeCampaignShell(
      context,
      campaignContent,
      runtimeSnapshot
        .newsItems,
    );

  scene.append(
    campaignShell.element,
  );

  scene.addEventListener(
    sceneDisposeEventName,
    () => {
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