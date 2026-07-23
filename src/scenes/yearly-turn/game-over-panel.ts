import type { SceneContext } from '../../app/scene-router';
import type { GameOverState } from '../../game/game-status';
import { makeButton, makeElement } from '../../ui/dom-helpers';
import { makeAnnualReportList } from './annual-report-list';
import { makeRecentEventsList } from './recent-events-list';

export function makeGameOverPanel(
  context: SceneContext,
  gameOverState: GameOverState,
): HTMLElement {
  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  const state = context.game.getState();

  panel.append(
    makeElement('h1', {
      textContent: gameOverState.title,
    }),
    makeElement('p', {
      className: 'scene-description',
      textContent: gameOverState.message,
    }),
  );

  if (state) {
    panel.append(
      makeElement('p', {
        className: 'scene-description',
        textContent: `Final year reached: ${state.year}`,
      }),
    );
  }

  panel.append(
    makeElement('h2', {
      textContent: 'Final Report',
    }),
    makeAnnualReportList(
      context.game.getAnnualReport(),
      context.game.getCurrentRulerName(),
    ),
    makeElement('h2', {
      textContent: 'Final Events',
    }),
    makeRecentEventsList(context.game.getLastOutcome()),
    makeButton('Start New Game', () => context.navigate('game-setup'), 'menu-button', {
      onBeforeClick: () => context.audio.sfx.play('button-click'),
    }),
    makeButton('Back to Title', () => context.navigate('title'), 'secondary-button', {
      onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  return panel;
}