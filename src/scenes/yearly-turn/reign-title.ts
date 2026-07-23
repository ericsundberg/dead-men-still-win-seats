import type { SceneContext } from '../../app/scene-router';
import type { GameState } from '../../core/types';
import { text } from '../../localization/localized-text';
import { makeElement } from '../../ui/dom-helpers';

export function makeReignTitle(
  context: SceneContext,
  state: GameState,
): HTMLHeadingElement {
  const reignYear = context.game.getRulerReignYear() ?? state.year;
  const rulerName = context.game.getCurrentRulerName() ?? state.playerName;

  return makeElement('h1', {
    textContent: `${text('yearlyTurn.yearLabel')} ${reignYear} ${text('yearlyTurn.inReignOf')} ${rulerName}`,
  });
}