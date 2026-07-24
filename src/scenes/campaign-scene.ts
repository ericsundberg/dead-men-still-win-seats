import {
  sceneDisposeEventName,
  type SceneContext,
} from '../app/scene-router';
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

export function renderCampaignScene(
  context: SceneContext,
): HTMLElement {
  const scene = makeElement(
    'section',
    {
      className:
        'scene gameplay-scene campaign-scene',
    },
  );

  const state =
    context.game.getState();

  /*
   * The campaign HUD only exists while an active game session
   * exists.
   */
  if (!state) {
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

  const gameOverState =
    context.game
      .getGameOverState();

  if (gameOverState) {
    campaignContent.append(
      makeGameOverPanel(
        context,
        gameOverState,
      ),
    );
  } else {
    /*
     * Temporary migration layer:
     *
     * The campaign scene owns the overall shell and HUD while
     * the existing yearly-turn panel remains the primary content.
     * This panel can be replaced later without moving the HUD.
     */
    campaignContent.append(
      makeYearlyTurnPanel(
        context,
        state,
      ),
    );
  }

  /*
   * CampaignState already reserves a newsFeed property, but it
   * is not yet attached to SceneContext. Use an empty list until
   * the campaign runtime supplies that feed.
   */
  const campaignShell =
    makeCampaignShell(
      context,
      campaignContent,
      [],
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