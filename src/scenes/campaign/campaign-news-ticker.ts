import {
  makeElement,
} from '../../ui/dom-helpers';

const newsItemDurationMs =
  5_000;

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

  ticker.setAttribute(
    'aria-label',
    'Campaign news ticker',
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

  const normalizedNewsItems =
    normalizeNewsItems(
      newsItems,
    );

  const blurb = makeElement(
    'span',
    {
      className:
        'campaign-news-blurb',
    },
  );

  let nextNewsIndex = 0;
  let timerId:
    number | null = null;

  const showNextNewsItem =
    (): void => {
      const newsItem =
        normalizedNewsItems[
          nextNewsIndex
        ];

      blurb.textContent =
        newsItem;

      blurb.title =
        newsItem;

      /*
       * Remove and reapply the class so the printing animation
       * restarts even when the fallback text is unchanged.
       */
      blurb.classList.remove(
        'is-printing',
      );

      void blurb.offsetWidth;

      blurb.classList.add(
        'is-printing',
      );

      nextNewsIndex =
        (
          nextNewsIndex + 1
        )
        % normalizedNewsItems.length;

      timerId =
        window.setTimeout(
          showNextNewsItem,
          newsItemDurationMs,
        );
    };

  ticker.append(
    label,
    blurb,
  );

  showNextNewsItem();

  return {
    element: ticker,

    dispose: () => {
      if (timerId !== null) {
        window.clearTimeout(
          timerId,
        );

        timerId = null;
      }
    },
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