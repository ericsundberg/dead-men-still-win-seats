import type {
  GameDifficultyId,
} from '../../game/difficulty';
import {
  makeElement,
} from '../../ui/dom-helpers';

const easyCampaignWeeks = 12;

export interface CampaignElectionCountdownOptions {
  readonly turnNumber: number;
  readonly difficultyId:
    GameDifficultyId | null;
}

export function makeCampaignElectionCountdown(
  options: CampaignElectionCountdownOptions,
): HTMLElement {
  const remainingWeeks =
    getElectionCountdownWeeks(
      options.turnNumber,
      options.difficultyId,
    );

  const unit =
    remainingWeeks === 1
      ? 'Week'
      : 'Weeks';

  const countdown = makeElement(
    'section',
    {
      className:
        'campaign-election-countdown sticky-note-hud',
    },
  );

  countdown.setAttribute(
    'aria-label',
    `Election in ${remainingWeeks} ${unit.toLowerCase()}`,
  );

  countdown.setAttribute(
    'aria-live',
    'polite',
  );

  countdown.append(
    makeElement(
      'span',
      {
        className:
          'sticky-note-countdown-label',
        textContent:
          'Election In',
      },
    ),

    makeElement(
      'strong',
      {
        className:
          'sticky-note-countdown-number',
        textContent:
          String(remainingWeeks),
      },
    ),

    makeElement(
      'span',
      {
        className:
          'sticky-note-countdown-unit',
        textContent:
          unit,
      },
    ),
  );

  return countdown;
}

export function getElectionCountdownWeeks(
  turnNumber: number,
  difficultyId:
    GameDifficultyId | null,
): number {
  const normalizedTurnNumber =
    normalizeTurnNumber(turnNumber);

  /*
   * Only Easy mode has its campaign calendar finalized.
   * Other modes temporarily use the same 12-week countdown.
   */
  const totalWeeks =
    difficultyId === 'easy'
      ? easyCampaignWeeks
      : easyCampaignWeeks;

  return Math.max(
    0,
    totalWeeks
      - (normalizedTurnNumber - 1),
  );
}

function normalizeTurnNumber(
  turnNumber: number,
): number {
  if (!Number.isFinite(turnNumber)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(turnNumber),
  );
}