import type {
  SceneContext,
} from '../../app/scene-router';
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
    CampaignState | null;

  readonly legacyTurnNumber:
    number | null;

  readonly legacyDifficultyId:
    GameDifficultyId;

  readonly legacyIsGameOver:
    boolean;

  readonly fallbackNewsItems?:
    readonly string[];
}

/**
 * Resolves the state displayed by the campaign HUD.
 *
 * CampaignSession is now the preferred source. The legacy
 * GameSession remains a fallback while the old Hamurabi
 * interface is still being removed incrementally.
 */
export function resolveCampaignHudSnapshot(
  options:
    ResolveCampaignHudSnapshotOptions,
): CampaignHudSnapshot {
  const fallbackNewsItems =
    options.fallbackNewsItems
    ?? [];

  if (!options.campaignState) {
    return {
      turnNumber:
        options.legacyTurnNumber
        ?? 1,

      difficultyId:
        options.legacyDifficultyId,

      newsItems:
        fallbackNewsItems,

      isGameOver:
        options.legacyIsGameOver,
    };
  }

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

    /*
     * Until real campaign news is generated, retain any news
     * supplied by the scene as a display fallback.
     */
    newsItems:
      campaignNewsItems.length > 0
        ? campaignNewsItems
        : fallbackNewsItems,

    /*
     * Respect either runtime's game-over state during the
     * migration so the end-turn control cannot be left active.
     */
    isGameOver:
      options.campaignState
        .phase
        === 'game-over'
      || options.legacyIsGameOver,
  };
}

export function makeCampaignShell(
  context: SceneContext,
  campaignContent:
    HTMLElement,

  newsItems:
    readonly string[] = [],
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

  const campaignState =
    context.campaign
      .getState();

  const legacyGameState =
    context.game
      .getState();

  const hudSnapshot =
    resolveCampaignHudSnapshot({
      campaignState,

      legacyTurnNumber:
        legacyGameState?.year
        ?? null,

      legacyDifficultyId:
        context.game
          .getDifficultyId(),

      legacyIsGameOver:
        context.game
          .isGameOver(),

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

  /**
   * Temporary submission bridge.
   *
   * The sticky note still submits the legacy command form.
   * That form now advances both the legacy GameSession and the
   * new CampaignSession in a synchronized operation.
   */
  const requestEndTurn =
    (): void => {
      const commandForm =
        campaignContent
          .querySelector<
            HTMLFormElement
          >(
            '.yearly-command-form',
          );

      if (!commandForm) {
        console.warn(
          [
            '[campaign] cannot end turn',
            'because the active campaign form was not found',
          ].join('; '),
        );

        return;
      }

      commandForm.requestSubmit();
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
        hudSnapshot
          .isGameOver,
    });

  hud.append(
    musicHud.element,
    electionCountdown,
    newsTicker.element,
  );

  shell.append(
    campaignContent,
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