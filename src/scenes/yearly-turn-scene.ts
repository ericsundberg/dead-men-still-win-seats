import type { SceneContext } from '../app/scene-router';
import { makeElement } from '../ui/dom-helpers';
import { makeGameOverPanel } from './yearly-turn/game-over-panel';
import { makeNoActiveGamePanel } from './yearly-turn/no-active-game-panel';
import { makeYearlyTurnPanel } from './yearly-turn/yearly-turn-panel';

export function renderYearlyTurnScene(context: SceneContext): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  const state = context.game.getState();

  if (!state) {
    scene.append(makeNoActiveGamePanel(context));
    return scene;
  }

  const gameOverState = context.game.getGameOverState();

  if (gameOverState) {
    scene.append(makeGameOverPanel(context, gameOverState));
    return scene;
  }

  scene.append(makeYearlyTurnPanel(context, state));

  return scene;
}