import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import {
  makeElement,
} from '../../ui/dom-helpers';

export type CampaignStatusSummaryItemId =
  | 'cash'
  | 'favors'
  | 'action-points'
  | 'public-suspicion'
  | 'party-confidence'
  | 'voter-energy';

export type CampaignStatusSummaryItemKind =
  | 'resource'
  | 'metric';

export interface CampaignStatusSummaryItem {
  readonly id:
    CampaignStatusSummaryItemId;

  readonly kind:
    CampaignStatusSummaryItemKind;

  readonly label:
    string;

  readonly displayValue:
    string;

  /*
   * Resource entries do not use a progress indicator.
   * Metric entries use a value from zero through one hundred.
   */
  readonly progressValue:
    number | null;
}

const currencyFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    },
  );

const wholeNumberFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 0,
    },
  );

/**
 * Converts campaign state into the ordered values displayed by
 * the campaign status summary.
 *
 * Keeping this transformation separate from DOM creation makes
 * formatting and ordering directly testable.
 */
export function createCampaignStatusSummaryItems(
  campaignState:
    CampaignState,
): readonly CampaignStatusSummaryItem[] {
  const cash =
    normalizeNonNegativeWholeNumber(
      campaignState
        .resources
        .cash,
    );

  const favors =
    normalizeNonNegativeWholeNumber(
      campaignState
        .resources
        .favors,
    );

  const actionPoints =
    normalizeNonNegativeWholeNumber(
      campaignState
        .resources
        .actionPoints,
    );

  const publicSuspicion =
    normalizePercentage(
      campaignState
        .metrics
        .publicSuspicion,
    );

  const partyConfidence =
    normalizePercentage(
      campaignState
        .metrics
        .partyConfidence,
    );

  const voterEnergy =
    normalizePercentage(
      campaignState
        .metrics
        .voterEnergy,
    );

  return [
    {
      id:
        'cash',

      kind:
        'resource',

      label:
        'Cash',

      displayValue:
        currencyFormatter
          .format(cash),

      progressValue:
        null,
    },

    {
      id:
        'favors',

      kind:
        'resource',

      label:
        'Favors',

      displayValue:
        wholeNumberFormatter
          .format(favors),

      progressValue:
        null,
    },

    {
      id:
        'action-points',

      kind:
        'resource',

      label:
        'Action Points',

      displayValue:
        wholeNumberFormatter
          .format(actionPoints),

      progressValue:
        null,
    },

    {
      id:
        'public-suspicion',

      kind:
        'metric',

      label:
        'Public Suspicion',

      displayValue:
        `${publicSuspicion}%`,

      progressValue:
        publicSuspicion,
    },

    {
      id:
        'party-confidence',

      kind:
        'metric',

      label:
        'Party Confidence',

      displayValue:
        `${partyConfidence}%`,

      progressValue:
        partyConfidence,
    },

    {
      id:
        'voter-energy',

      kind:
        'metric',

      label:
        'Voter Energy',

      displayValue:
        `${voterEnergy}%`,

      progressValue:
        voterEnergy,
    },
  ];
}

export function makeCampaignStatusSummary(
  campaignState:
    CampaignState,
): HTMLElement {
  const summary =
    makeElement(
      'section',
      {
        className:
          'campaign-status-summary',
      },
    );

  summary.setAttribute(
    'aria-label',
    'Campaign resources and metrics',
  );

  const title =
    makeElement(
      'h2',
      {
        className:
          'campaign-status-summary-title',

        textContent:
          'Campaign Status',
      },
    );

  const list =
    makeElement(
      'dl',
      {
        className:
          'campaign-status-summary-list',
      },
    );

  const items =
    createCampaignStatusSummaryItems(
      campaignState,
    );

  for (const item of items) {
    const itemElement =
      makeElement(
        'div',
        {
          className: [
            'campaign-status-summary-item',

            `campaign-status-summary-item--${item.kind}`,

            `campaign-status-summary-item--${item.id}`,
          ].join(' '),
        },
      );

    const label =
      makeElement(
        'dt',
        {
          className:
            'campaign-status-summary-label',

          textContent:
            item.label,
        },
      );

    const detail =
      makeElement(
        'dd',
        {
          className:
            'campaign-status-summary-detail',
        },
      );

    const value =
      makeElement(
        'span',
        {
          className:
            'campaign-status-summary-value',

          textContent:
            item.displayValue,
        },
      );

    detail.append(
      value,
    );

    if (
      item.progressValue
      !== null
    ) {
      const progress =
        document.createElement(
          'progress',
        );

      progress.className = [
        'campaign-status-summary-progress',

        `campaign-status-summary-progress--${item.id}`,
      ].join(' ');

      progress.max =
        100;

      progress.value =
        item.progressValue;

      progress.setAttribute(
        'aria-label',
        `${item.label}: ${item.displayValue}`,
      );

      detail.append(
        progress,
      );
    }

    itemElement.append(
      label,
      detail,
    );

    list.append(
      itemElement,
    );
  }

  summary.append(
    title,
    list,
  );

  return summary;
}

function normalizeNonNegativeWholeNumber(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(value),
  );
}

function normalizePercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  );
}