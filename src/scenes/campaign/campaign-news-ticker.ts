import type {
  GameDifficultyId,
} from '../../game/difficulty';
import {
  makeElement,
} from '../../ui/dom-helpers';

const tickerSequenceRepeatCount = 4;

const easyCampaignStartYear = 2026;
const easyCampaignStartMonthIndex = 7;
const campaignWeeksPerMonth = 4;
const campaignMonthsPerYear = 12;

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
    normalizeTurnNumber(
      time.turnNumber,
    );

  const elapsedTurns =
    turnNumber - 1;

  const weekOfMonth =
    (
      elapsedTurns
      % campaignWeeksPerMonth
    )
    + 1;

  const elapsedMonths =
    Math.floor(
      elapsedTurns
      / campaignWeeksPerMonth,
    );

  const absoluteMonthIndex =
    easyCampaignStartMonthIndex
    + elapsedMonths;

  const year =
    easyCampaignStartYear
    + Math.floor(
      absoluteMonthIndex
      / campaignMonthsPerYear,
    );

  const monthIndex =
    absoluteMonthIndex
    % campaignMonthsPerYear;

  const monthDate =
    new Date(
      Date.UTC(
        year,
        monthIndex,
        1,
      ),
    );

  const monthName =
    new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'long',
        timeZone: 'UTC',
      },
    )
      .format(monthDate)
      .toUpperCase();

  return [
    `WEEK ${weekOfMonth}`,
    monthName,
    String(year),
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