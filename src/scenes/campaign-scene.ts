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
  makeCampaignGameOverPanel,
} from './campaign/campaign-game-over-panel';
import {
  makeCampaignShell,
} from './campaign/campaign-shell';
import {
  makeCampaignStatusSummary,
} from './campaign/campaign-status-summary';
import {
  makeGameOverPanel,
} from './yearly-turn/game-over-panel';
import {
  makeNoActiveGamePanel,
} from './yearly-turn/no-active-game-panel';
import {
  makeYearlyTurnPanel,
} from './yearly-turn/yearly-turn-panel';

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
   * The temporary Hamurabi panel still requires legacy state.
   *
   * This restriction can be removed after the legacy central
   * panel and synchronized turn bridge have been replaced.
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
   * results. This branch must take priority over the temporary
   * legacy game-over state and yearly-turn panel.
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
     * terminal state before that system is removed.
     */
    campaignContent.append(
      makeGameOverPanel(
        context,
        legacyGameOverState,
      ),
    );
  } else {
    campaignContent.append(
      makeCampaignActionPanel(
        context,
        campaignState,
      ),
    );

    /*
     * Temporary migration layer:
     *
     * CampaignSession owns campaign existence, turn number,
     * difficulty, news, resources, metrics, campaign actions,
     * and campaign end-game state.
     *
     * The legacy yearly-turn panel remains only until the real
     * event-and-decision panel replaces it.
     */
    campaignContent.append(
      makeYearlyTurnPanel(
        context,
        legacyState,
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
      once: true,
    },
  );

  return scene;
}