export type CampaignWorkspaceTabId =
  | 'actions'
  | 'staff'
  | 'surrogates'
  | 'financials'
  | 'polls';

export interface CampaignWorkspaceTabDefinition {
  readonly id:
    CampaignWorkspaceTabId;

  readonly label:
    string;

  readonly heading:
    string;

  readonly description:
    string;
}

const campaignWorkspaceTabDefinitions:
  readonly CampaignWorkspaceTabDefinition[] = [
    {
      id:
        'actions',

      label:
        'Actions',

      heading:
        'Campaign Actions',

      description:
        'Spend action points on campaign operations.',
    },

    {
      id:
        'staff',

      label:
        'Staff',

      heading:
        'Staff Management',

      description: [
        'Review the campaign operatives managing schedules,',
        'calls, logistics, and damage control.',
      ].join(
        ' ',
      ),
    },

    {
      id:
        'surrogates',

      label:
        'Surrogates',

      heading:
        'Surrogate Management',

      description: [
        'Review the public figures appearing and speaking',
        'on the Senator’s behalf.',
      ].join(
        ' ',
      ),
    },

    {
      id:
        'financials',

      label:
        'Financials',

      heading:
        'Campaign Financials',

      description: [
        'Review cash, favors, income, and recurring',
        'campaign expenses.',
      ].join(
        ' ',
      ),
    },

    {
      id:
        'polls',

      label:
        'Polls',

      heading:
        'Campaign Polling',

      description: [
        'Track public suspicion, party confidence,',
        'and voter energy across the campaign.',
      ].join(
        ' ',
      ),
    },
  ];

export function getCampaignWorkspaceTabDefinitions():
  readonly CampaignWorkspaceTabDefinition[] {
  return campaignWorkspaceTabDefinitions;
}

/**
 * Resolves keyboard navigation inside the campaign tab list.
 *
 * Left and right wrap around the complete list. Home and End jump
 * directly to the first and last tabs.
 */
export function resolveCampaignWorkspaceTabIndex(
  currentIndex:
    number,

  key:
    string,

  tabCount:
    number,
): number | null {
  if (
    !Number.isInteger(
      tabCount,
    )
    || tabCount <= 0
  ) {
    return null;
  }

  const normalizedIndex =
    Math.min(
      tabCount - 1,

      Math.max(
        0,
        Math.trunc(
          currentIndex,
        ),
      ),
    );

  switch (
    key
  ) {
    case 'ArrowLeft':
      return (
        normalizedIndex
        - 1
        + tabCount
      )
      % tabCount;

    case 'ArrowRight':
      return (
        normalizedIndex
        + 1
      )
      % tabCount;

    case 'Home':
      return 0;

    case 'End':
      return tabCount - 1;

    default:
      return null;
  }
}