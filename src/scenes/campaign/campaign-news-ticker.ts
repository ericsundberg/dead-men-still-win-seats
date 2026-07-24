import type {
  GameDifficultyId,
} from '../../game/difficulty';
import {
  makeElement,
} from '../../ui/dom-helpers';

const tickerSequenceRepeatCount = 4;

const easyCampaignStartYear = 2026;
const easyCampaignStartMonthIndex = 7;
const easyCampaignStartDay = 1;

export const defaultCampaignNewsText =
  "There's no news. This must mean the world's ending.";

export interface CampaignNewsTickerTime {
  readonly turnNumber: number;
  readonly difficultyId: GameDifficultyId;
}

export interface CampaignNewsTicker {
  readonly element: HTMLElement;
  readonly dispose: () => void;
}

export function makeCampaignNewsTicker(
  newsItems: readonly string[] = [],
  time: CampaignNewsTickerTime = {
    turnNumber: 1,
    difficultyId: 'easy',
  },
): CampaignNewsTicker {
  const ticker = makeElement('section', {
    className: 'campaign-news-ticker',
  });

  const normalizedNewsItems =
    normalizeNewsItems(newsItems);

  ticker.setAttribute(
    'role',
    'status',
  );

  ticker.setAttribute(
    'aria-live',
    'polite',
  );

  ticker.setAttribute(
    'aria-label',
    [
      'POX News.',
      formatCampaignDateLabel(time),
      ...normalizedNewsItems,
    ].join(' '),
  );

  const brand = makeElement('div', {
    className: 'campaign-news-brand',
  });

  brand.setAttribute(
    'aria-hidden',
    'true',
  );

  brand.append(
    makeElement('span', {
      className: 'campaign-news-network',
      textContent: 'POX',
    }),
    makeElement('span', {
      className: 'campaign-news-network-subtitle',
      textContent: 'News',
    }),
  );

  const dateStrap = makeElement('div', {
    className: 'campaign-news-date-strap',
    textContent: formatCampaignDateLabel(time),
  });

  dateStrap.setAttribute(
    'aria-hidden',
    'true',
  );

  const viewport = makeElement('div', {
    className: 'campaign-news-viewport',
  });

  viewport.setAttribute(
    'aria-hidden',
    'true',
  );

  const track = makeElement('div', {
    className: 'campaign-news-track',
  });

  /*
   * Two identical groups allow the right-to-left animation to
   * restart without a visible gap.
   */
  track.append(
    makeTickerSegment(normalizedNewsItems),
    makeTickerSegment(normalizedNewsItems),
  );

  viewport.append(track);

  ticker.append(
    viewport,
    dateStrap,
    brand,
  );

  return {
    element: ticker,

    /*
     * The chyron is animated entirely by CSS and owns no timers
     * or subscriptions.
     */
    dispose: () => {},
  };
}

export function normalizeNewsItems(
  newsItems: readonly string[],
): readonly string[] {
  const usableNewsItems = newsItems
    .map((newsItem) => newsItem.trim())
    .filter((newsItem) => newsItem.length > 0);

  if (usableNewsItems.length === 0) {
    return [
      defaultCampaignNewsText,
    ];
  }

  return usableNewsItems;
}

export function formatCampaignDateLabel(
  time: CampaignNewsTickerTime,
): string {
  const turnNumber =
    normalizeTurnNumber(time.turnNumber);

  const campaignDate =
    getEasyCampaignDate(
      turnNumber,
      time.difficultyId,
    );

  const monthName =
    new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'long',
        timeZone: 'UTC',
      },
    )
      .format(campaignDate)
      .toUpperCase();

  return [
    `WEEK ${turnNumber}`,
    monthName,
    String(
      campaignDate.getUTCFullYear(),
    ),
  ].join(', ');
}

function makeTickerSegment(
  newsItems: readonly string[],
): HTMLElement {
  const segment = makeElement('div', {
    className: 'campaign-news-ticker-segment',
  });

  for (
    let repetition = 0;
    repetition < tickerSequenceRepeatCount;
    repetition += 1
  ) {
    for (const newsItem of newsItems) {
      segment.append(
        makeElement('span', {
          className: 'campaign-news-item',
          textContent: newsItem,
        }),
      );
    }
  }

  return segment;
}

function getEasyCampaignDate(
  turnNumber: number,
  difficultyId: GameDifficultyId,
): Date {
  /*
   * Easy mode is currently the implemented calendar model.
   * Other difficulties temporarily use the same weekly cadence
   * until their distinct campaign calendars are defined.
   */
  const weeksPerTurn =
    difficultyId === 'easy'
      ? 1
      : 1;

  const elapsedWeeks =
    (turnNumber - 1)
    * weeksPerTurn;

  const date = new Date(
    Date.UTC(
      easyCampaignStartYear,
      easyCampaignStartMonthIndex,
      easyCampaignStartDay,
    ),
  );

  date.setUTCDate(
    date.getUTCDate()
      + elapsedWeeks * 7,
  );

  return date;
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