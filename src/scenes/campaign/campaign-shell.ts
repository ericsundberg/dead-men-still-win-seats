import type {
  SceneContext,
} from '../../app/scene-router';
import {
  makeElement,
} from '../../ui/dom-helpers';
import {
  makeCampaignMusicHud,
} from './campaign-music-hud';
import {
  makeCampaignNewsTicker,
} from './campaign-news-ticker';
import {
  makeCampaignElectionCountdown,
} from './campaign-election-countdown';

export interface CampaignShell {
  readonly element: HTMLElement;
  readonly dispose: () => void;
}

export function makeCampaignShell(
  context: SceneContext,
  campaignContent: HTMLElement,
  newsItems:
    readonly string[] = [],
): CampaignShell {
  const shell = makeElement(
    'div',
    {
      className:
        'campaign-shell',
    },
  );

  const hud = makeElement(
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

    const gameState =
    context.game.getState();

    const newsTicker =
    makeCampaignNewsTicker(
        newsItems,
        {
        turnNumber:
            gameState?.year
            ?? 1,

        difficultyId:
            context.game.getDifficultyId(),
        },
    );

const requestEndTurn = (): void => {
  const commandForm =
    campaignContent
      .querySelector<HTMLFormElement>(
        '.yearly-command-form',
      );

  if (!commandForm) {
    console.warn(
      '[campaign] cannot end turn because the active campaign form was not found',
    );

    return;
  }

  commandForm.requestSubmit();
};

const electionCountdown =
  makeCampaignElectionCountdown({
    turnNumber:
      gameState?.year
      ?? 1,

    difficultyId:
      context.game.getDifficultyId(),

    onEndTurn:
      requestEndTurn,

    disabled:
      context.game.isGameOver(),
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
    element: shell,

    dispose: () => {
      musicHud.dispose();
      newsTicker.dispose();
    },
  };
}