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

/**
 * Resolves the runtime state needed by the campaign scene.
 *
 * CampaignSession determines whether a political campaign is
 * active. The legacy GameSession is still required temporarily
 * because the current central panel renders Hamurabi state.
 */
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

    /*
     * This state should not occur through normal game setup,
     * because the setup form starts both runtimes together.
     */
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
  context: SceneContext,
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

  /*
   * CampaignSession is authoritative for deciding whether the
   * player has an active campaign.
   */
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
   * Including campaignState in this guard also narrows its type
   * before it is passed to campaign-only interface components.
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
   * Do not offer campaign actions after either temporary runtime
   * has reached a game-over state.
   */
  if (
    campaignState.phase
      !== 'game-over'
    && !legacyGameOverState
  ) {
    campaignContent.append(
      makeCampaignActionPanel(
        context,
        campaignState,
      ),
    );
  }

  if (legacyGameOverState) {
    campaignContent.append(
      makeGameOverPanel(
        context,
        legacyGameOverState,
      ),
    );
  } else {
    /*
     * Temporary migration layer:
     *
     * CampaignSession owns campaign existence, turn number,
     * difficulty, news, resources, metrics, campaign actions,
     * and campaign end-game state.
     *
     * The legacy yearly-turn panel remains the central content
     * only until the vertical-slice campaign interface replaces
     * it in a later checkpoint.
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