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
  makeCampaignShell,
} from './campaign/campaign-shell';
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
   * CampaignSession is now authoritative for deciding whether
   * the player has an active campaign.
   *
   * A leftover legacy GameSession by itself is no longer enough
   * to enter the campaign scene.
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
   * The campaign runtime is active, but the temporary Hamurabi
   * panel still requires the corresponding legacy state.
   *
   * Game setup currently starts both runtimes together, so this
   * branch indicates a migration error rather than a normal
   * player-facing state.
   */
  if (
    runtimeSnapshot
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

  const legacyGameOverState =
    context.game
      .getGameOverState();

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
     * difficulty, news, and campaign end-game state.
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