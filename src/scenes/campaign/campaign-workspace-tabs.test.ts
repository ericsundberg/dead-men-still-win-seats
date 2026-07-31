import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  getCampaignWorkspaceTabDefinitions,
  resolveCampaignWorkspaceTabIndex,
} from './campaign-workspace-tabs';

describe(
  'campaign workspace tabs',
  () => {
    it(
      'defines the campaign workspace tabs in display order',
      () => {
        expect(
          getCampaignWorkspaceTabDefinitions()
            .map(
              (
                definition,
              ) => ({
                id:
                  definition.id,

                label:
                  definition.label,
              }),
            ),
        ).toEqual([
          {
            id:
              'actions',

            label:
              'Actions',
          },

          {
            id:
              'staff',

            label:
              'Staff',
          },

          {
            id:
              'surrogates',

            label:
              'Surrogates',
          },

          {
            id:
              'financials',

            label:
              'Financials',
          },

          {
            id:
              'polls',

            label:
              'Polls',
          },
        ]);
      },
    );

    it(
      'moves between adjacent tabs',
      () => {
        expect(
          resolveCampaignWorkspaceTabIndex(
            1,
            'ArrowRight',
            5,
          ),
        ).toBe(
          2,
        );

        expect(
          resolveCampaignWorkspaceTabIndex(
            3,
            'ArrowLeft',
            5,
          ),
        ).toBe(
          2,
        );
      },
    );

    it(
      'wraps at each end of the tab list',
      () => {
        expect(
          resolveCampaignWorkspaceTabIndex(
            0,
            'ArrowLeft',
            5,
          ),
        ).toBe(
          4,
        );

        expect(
          resolveCampaignWorkspaceTabIndex(
            4,
            'ArrowRight',
            5,
          ),
        ).toBe(
          0,
        );
      },
    );

    it(
      'supports Home and End navigation',
      () => {
        expect(
          resolveCampaignWorkspaceTabIndex(
            2,
            'Home',
            5,
          ),
        ).toBe(
          0,
        );

        expect(
          resolveCampaignWorkspaceTabIndex(
            2,
            'End',
            5,
          ),
        ).toBe(
          4,
        );
      },
    );

    it(
      'ignores unrelated keys and invalid tab lists',
      () => {
        expect(
          resolveCampaignWorkspaceTabIndex(
            2,
            'Enter',
            5,
          ),
        ).toBeNull();

        expect(
          resolveCampaignWorkspaceTabIndex(
            0,
            'ArrowRight',
            0,
          ),
        ).toBeNull();
      },
    );
  },
);