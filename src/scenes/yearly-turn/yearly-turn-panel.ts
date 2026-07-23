import type { SceneContext } from '../../app/scene-router';
import type { GameState } from '../../core/types';
import { makeButton, makeElement } from '../../ui/dom-helpers';
import { makeAnnualReportList } from './annual-report-list';
import { makeRecentEventsList } from './recent-events-list';
import { makeReignTitle } from './reign-title';
import { makeRulerStatsLine } from './ruler-stats-line';
import { makeYearlyCommandForm } from './yearly-command-form';

export function makeYearlyTurnPanel(
  context: SceneContext,
  state: GameState,
): HTMLElement {
  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  panel.append(
    makeReignTitle(context, state),
    makeRulerStatsLine(context, state),
    makeElement('h2', {
      textContent: 'Annual Report',
    }),
    makeAnnualReportList(
      context.game.getAnnualReport(),
      context.game.getCurrentRulerName(),
    ),
    makeElement('h2', {
      textContent: 'Recent Events',
    }),
    makeRecentEventsList(context.game.getLastOutcome()),
    makeYearlyCommandForm(context),
    makeButton('Back to Title', () => context.navigate('title'), 'secondary-button', {
      onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  return panel;
}