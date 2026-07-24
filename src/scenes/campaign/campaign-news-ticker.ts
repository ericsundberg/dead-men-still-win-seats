import {
  makeElement,
} from '../../ui/dom-helpers';

const tickerSequenceRepeatCount = 4;

export const defaultCampaignNewsText =
  "There's no news. This must mean the world's ending.";

export interface CampaignNewsTicker {
  readonly element: HTMLElement;
  readonly dispose: () => void;
}

export function makeCampaignNewsTicker(
  newsItems:
    readonly string[] = [],
): CampaignNewsTicker {
  const ticker = makeElement(
    'section',
    {
      className:
        'campaign-news-ticker',
    },
  );

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
    `Campaign news: ${normalizedNewsItems.join(' ')}`,
  );

  const label = makeElement(
    'span',
    {
      className:
        'campaign-news-label',
      textContent:
        'News',
    },
  );

  /*
   * The moving copies are hidden from assistive technology.
   * The ticker's aria-label provides one non-repeated version.
   */
  const viewport = makeElement(
    'div',
    {
      className:
        'campaign-news-viewport',
    },
  );

  viewport.setAttribute(
    'aria-hidden',
    'true',
  );

  const track = makeElement(
    'div',
    {
      className:
        'campaign-news-track',
    },
  );

  /*
   * Two identical segments allow the carousel to loop without
   * a visible jump.
   */
  track.append(
    makeTickerSegment(
      normalizedNewsItems,
    ),
    makeTickerSegment(
      normalizedNewsItems,
    ),
  );

  viewport.append(track);

  ticker.append(
    label,
    viewport,
  );

  return {
    element: ticker,

    /*
     * The carousel is controlled entirely by CSS, so there are
     * no timers or subscriptions to clean up.
     */
    dispose: () => {},
  };
}

export function normalizeNewsItems(
  newsItems:
    readonly string[],
): readonly string[] {
  const usableNewsItems =
    newsItems
      .map(
        (newsItem) =>
          newsItem.trim(),
      )
      .filter(
        (newsItem) =>
          newsItem.length > 0,
      );

  if (
    usableNewsItems.length === 0
  ) {
    return [
      defaultCampaignNewsText,
    ];
  }

  return usableNewsItems;
}

function makeTickerSegment(
  newsItems:
    readonly string[],
): HTMLElement {
  const segment = makeElement(
    'div',
    {
      className:
        'campaign-news-ticker-segment',
    },
  );

  /*
   * Repeat the available sequence so even one short fallback
   * message fills the chyron continuously.
   */
  for (
    let repetition = 0;
    repetition
      < tickerSequenceRepeatCount;
    repetition += 1
  ) {
    for (
      const newsItem
      of newsItems
    ) {
      segment.append(
        makeElement(
          'span',
          {
            className:
              'campaign-news-item',
            textContent:
              newsItem,
          },
        ),
      );
    }
  }

  return segment;
}