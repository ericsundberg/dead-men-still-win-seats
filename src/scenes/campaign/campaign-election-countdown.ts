import type {
  GameDifficultyId,
} from '../../game/difficulty';
import {
  formatText,
  text,
} from '../../localization/localized-text';
import {
  makeElement,
} from '../../ui/dom-helpers';

const easyCampaignWeeks = 12;

export interface CampaignElectionCountdownOptions {
  readonly turnNumber: number;

  readonly difficultyId:
    GameDifficultyId | null;

  readonly onEndTurn: () => void;
  readonly disabled?: boolean;
}

export function makeCampaignElectionCountdown(
  options: CampaignElectionCountdownOptions,
): HTMLButtonElement {
  const remainingWeeks =
    getElectionCountdownWeeks(
      options.turnNumber,
      options.difficultyId,
    );

  const unit =
    remainingWeeks === 1
      ? text(
          'campaign.electionCountdown.week',
        )
      : text(
          'campaign.electionCountdown.weeks',
        );

  const accessibleLabel =
    formatText(
      'campaign.electionCountdown.accessibleLabel',
      {
        weeks:
          remainingWeeks,

        unit,
      },
    );

  const countdown =
    document.createElement('button');

  countdown.type = 'button';

  countdown.className =
    'campaign-election-countdown sticky-note-hud';

  countdown.disabled =
    options.disabled ?? false;

  /*
   * Use only an accessible label here.
   *
   * Do not set countdown.title, because that creates the
   * browser-native tooltip seen in the screenshot.
   */
  countdown.setAttribute(
    'aria-label',
    accessibleLabel,
  );

  const countdownLabel =
    makeElement(
      'span',
      {
        className:
          'sticky-note-countdown-label',

        textContent:
          text(
            'campaign.electionCountdown.label',
          ),
      },
    );

  const countdownNumber =
    makeElement(
      'strong',
      {
        className:
          'sticky-note-countdown-number',

        textContent:
          String(remainingWeeks),
      },
    );

  const countdownUnit =
    makeElement(
      'span',
      {
        className:
          'sticky-note-countdown-unit',

        textContent:
          unit,
      },
    );

  /*
   * Permanent label-maker strip.
   *
   * Both visual strings exist in the DOM so CSS can crossfade
   * between them without relying on generated content.
   */
  const endTurnLabel =
    makeElement(
      'span',
      {
        className:
          'sticky-note-end-turn-label',
      },
    );

  endTurnLabel.setAttribute(
    'aria-hidden',
    'true',
  );

  const endTurnDefaultText =
    makeElement(
      'span',
      {
        className:
          'sticky-note-end-turn-label-default',

        textContent:
          text(
            'campaign.electionCountdown.endTurnLabel',
          ),
      },
    );

  const endTurnHoverText =
    makeElement(
      'span',
      {
        className:
          'sticky-note-end-turn-label-hover',

        textContent:
          text(
            'campaign.electionCountdown.endTurnHoverLabel',
          ),
      },
    );

  endTurnLabel.append(
    endTurnDefaultText,
    endTurnHoverText,
  );

  const hoverVeil =
    makeElement(
      'span',
      {
        className:
          'sticky-note-hover-veil',
      },
    );

  hoverVeil.setAttribute(
    'aria-hidden',
    'true',
  );

  const endTurnOverlay =
    makeElement(
      'span',
      {
        className:
          'sticky-note-end-turn-overlay',

        textContent:
          text(
            'campaign.electionCountdown.endTurnOverlay',
          ),
      },
    );

  endTurnOverlay.setAttribute(
    'aria-hidden',
    'true',
  );

  countdown.append(
    countdownLabel,
    countdownNumber,
    countdownUnit,
    hoverVeil,
    endTurnOverlay,
    endTurnLabel,
  );

  countdown.addEventListener(
    'click',
    () => {
      options.onEndTurn();
    },
  );

  return countdown;
}

export function getElectionCountdownWeeks(
  turnNumber: number,

  difficultyId:
    GameDifficultyId | null,
): number {
  const normalizedTurnNumber =
    normalizeTurnNumber(
      turnNumber,
    );

  /*
   * Only Easy mode currently has its final campaign calendar.
   * Other difficulties temporarily use the same countdown.
   */
  const totalWeeks =
    difficultyId === 'easy'
      ? easyCampaignWeeks
      : easyCampaignWeeks;

  return Math.max(
    0,
    totalWeeks
      - (
        normalizedTurnNumber
        - 1
      ),
  );
}

function normalizeTurnNumber(
  turnNumber: number,
): number {
  if (
    !Number.isFinite(
      turnNumber,
    )
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(
      turnNumber,
    ),
  );
}