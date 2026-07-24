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
   * The animated text is hidden from accessibility tools because
   * the ticker already exposes one concise aria-label above.
   * This prevents every repeated copy from being announced.
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
   * Two identical segments make the animation seamless.
   *
   * When the first segment reaches its destination, the second
   * segment is in exactly the same visual position. The animation
   * can restart without an observable jump.
   */
  const firstSegment =
    makeTickerSegment(
      normalizedNewsItems,
    );

  const duplicateSegment =
    makeTickerSegment(
      normalizedNewsItems,
    );

  track.append(
    firstSegment,
    duplicateSegment,
  );

  viewport.append(track);

  ticker.append(
    label,
    viewport,
  );

  return {
    element: ticker,

    /*
     * The ticker is now driven entirely by CSS animation, so it
     * does not own a timer or subscription requiring cleanup.
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
   * Repeating the sequence fills the screen even when the only
   * available item is the relatively short fallback message.
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
        makeElement(
          'span',
          {
            className:
              'campaign-news-separator',
            textContent:
              '◆',
          },
        ),
      );
    }
  }

  return segment;
}