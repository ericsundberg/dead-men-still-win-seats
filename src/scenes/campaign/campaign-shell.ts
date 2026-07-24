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

  hud.append(
    musicHud.element,
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