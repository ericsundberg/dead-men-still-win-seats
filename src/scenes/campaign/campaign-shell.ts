import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  CampaignSession,
} from '../../game/campaign/campaign-session';
import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import type {
  GameDifficultyId,
} from '../../game/difficulty';
import {
  makeElement,
} from '../../ui/dom-helpers';
import {
  makeCampaignElectionCountdown,
} from './campaign-election-countdown';
import {
  makeCampaignMusicHud,
} from './campaign-music-hud';
import {
  makeCampaignNewsTicker,
} from './campaign-news-ticker';
import {
  makeCampaignStatusSummary,
} from './campaign-status-summary';

export interface CampaignShell {
  readonly element:
    HTMLElement;

  readonly dispose:
    () => void;
}

export interface CampaignHudSnapshot {
  readonly turnNumber:
    number;

  readonly difficultyId:
    GameDifficultyId;

  readonly newsItems:
    readonly string[];

  readonly isGameOver:
    boolean;
}

export interface ResolveCampaignHudSnapshotOptions {
  readonly campaignState:
    CampaignState;

  readonly fallbackNewsItems?:
    readonly string[];
}

export interface CampaignEndTurnRequestContext {
  readonly campaign:
    Pick<
      CampaignSession,
      'endTurn'
    >;

  readonly navigate:
    SceneContext['navigate'];
}

/**
 * Resolves all campaign HUD values from CampaignSession state.
 */
export function resolveCampaignHudSnapshot(
  options:
    ResolveCampaignHudSnapshotOptions,
): CampaignHudSnapshot {
  const campaignNewsItems =
    options.campaignState
      .newsFeed;

  return {
    turnNumber:
      options.campaignState
        .currentTurn,

    difficultyId:
      options.campaignState
        .difficultyId,

    newsItems:
      campaignNewsItems.length > 0
        ? campaignNewsItems
        : options.fallbackNewsItems
          ?? [],

    isGameOver:
      options.campaignState
        .phase
        === 'game-over',
  };
}

/**
 * The campaign may advance only during the player-actions phase.
 */
export function canCampaignEndTurn(
  campaignState:
    CampaignState,
): boolean {
  return (
    campaignState.phase
    === 'player-actions'
  );
}

/**
 * Requests turn advancement directly from CampaignSession.
 *
 * The campaign scene is rendered again after every successful
 * advancement so the countdown, event panel, campaign actions,
 * news ticker, and end-game state reflect the committed result.
 */
export function requestCampaignEndTurn(
  context:
    CampaignEndTurnRequestContext,
): CampaignState | null {
  const nextState =
    context.campaign
      .endTurn();

  if (!nextState) {
    console.warn(
      [
        '[campaign] end turn request was rejected',
        'the campaign is not in the player-actions phase',
      ].join('; '),
    );

    return null;
  }

  console.log(
    [
      '[campaign] turn advanced',
      `turn: ${nextState.currentTurn}`,
      `phase: ${nextState.phase}`,
    ].join('; '),
  );

  context.navigate(
    'campaign',
  );

  return nextState;
}

export function makeCampaignShell(
  context:
    SceneContext,

  campaignState:
    CampaignState,

  campaignContent:
    HTMLElement,

  newsItems:
    readonly string[] = [],

  menuButton:
    HTMLButtonElement | null = null,
): CampaignShell {
  const shell =
    makeElement(
      'div',
      {
        className:
          'campaign-shell',
      },
    );

  const hud =
    makeElement(
      'aside',
      {
        className:
          'campaign-hud',
      },
    );

  hud.setAttribute(
    'aria-label',
    'Campaign information',
  );

  const musicHud =
    makeCampaignMusicHud(
      context,
    );

  const statusHud =
    makeElement(
      'aside',
      {
        className:
          'campaign-status-hud',
      },
    );

  statusHud.setAttribute(
    'aria-label',
    'Campaign status and menu',
  );

  if (
    menuButton
  ) {
    statusHud.append(
      menuButton,
    );
  }

  statusHud.append(
    makeCampaignStatusSummary(
      campaignState,
    ),
  );

  const hudSnapshot =
    resolveCampaignHudSnapshot({
      campaignState,

      fallbackNewsItems:
        newsItems,
    });

  const newsTicker =
    makeCampaignNewsTicker(
      hudSnapshot.newsItems,
      {
        turnNumber:
          hudSnapshot.turnNumber,

        difficultyId:
          hudSnapshot
            .difficultyId,
      },
    );

  const requestEndTurn =
    (): void => {
      requestCampaignEndTurn({
        campaign:
          context.campaign,

        navigate:
          context.navigate,
      });
    };

  const electionCountdown =
    makeCampaignElectionCountdown({
      turnNumber:
        hudSnapshot.turnNumber,

      difficultyId:
        hudSnapshot
          .difficultyId,

      onEndTurn:
        requestEndTurn,

      disabled:
        !canCampaignEndTurn(
          campaignState,
        ),
    });

  hud.append(
    musicHud.element,
    electionCountdown,
    newsTicker.element,
  );

  shell.append(
    campaignContent,
    statusHud,
    hud,
  );

  return {
    element:
      shell,

    dispose:
      () => {
        musicHud.dispose();
        newsTicker.dispose();
      },
  };
}