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

  campaignContent.append(
    makeCampaignStatusSummary(
      campaignState,
    ),
  );

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
      campaignState,
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