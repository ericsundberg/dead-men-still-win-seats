import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignState,
} from '../../game/campaign/campaign-state';
import {
  createCampaignStatusSummaryItems,
} from './campaign-status-summary';

describe(
  'campaign status summary',
  () => {
    it(
      'creates the ordered default campaign values',
      () => {
        const items =
          createCampaignStatusSummaryItems(
            createInitialCampaignState(
              'easy',
            ),
          );

        expect(
          items,
        ).toEqual([
          {
            id:
              'cash',

            kind:
              'resource',

            label:
              'Cash',

            displayValue:
              '$100,000',

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
              '3',

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
              '3',

            progressValue:
              null,
          },

          {
            id:
              'staffers',

            kind:
              'resource',

            label:
              'Staffers',

            displayValue:
              '0',

            progressValue:
              null,
          },

          {
            id:
              'surrogates',

            kind:
              'resource',

            label:
              'Surrogates',

            displayValue:
              '0',

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
              '0%',

            progressValue:
              0,
          },

          {
            id:
              'party-confidence',

            kind:
              'metric',

            label:
              'Party Confidence',

            displayValue:
              '100%',

            progressValue:
              100,
          },

          {
            id:
              'voter-energy',

            kind:
              'metric',

            label:
              'Voter Energy',

            displayValue:
              '100%',

            progressValue:
              100,
          },
        ]);
      },
    );

    it(
      'formats custom resource, personnel, and metric values',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'moderate',
          ),

          resources: {
            cash:
              12_345.67,

            favors:
              8.6,

            actionPoints:
              1.2,
          },

          personnel: {
            staffers:
              2.6,

            surrogates:
              4.4,
          },

          metrics: {
            publicSuspicion:
              37.6,

            partyConfidence:
              64.4,

            voterEnergy:
              51.5,
          },
        };

        const items =
          createCampaignStatusSummaryItems(
            campaignState,
          );

        expect(
          items.map(
            (item) =>
              item.displayValue,
          ),
        ).toEqual([
          '$12,346',
          '9',
          '1',
          '3',
          '4',
          '38%',
          '64%',
          '52%',
        ]);
      },
    );

    it(
      'keeps display values inside safe visual bounds',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'hardliner',
          ),

          resources: {
            cash:
              -5_000,

            favors:
              Number.NaN,

            actionPoints:
              Number.NEGATIVE_INFINITY,
          },

          metrics: {
            publicSuspicion:
              -20,

            partyConfidence:
              120,

            voterEnergy:
              Number.NaN,
          },
        };

        const items =
          createCampaignStatusSummaryItems(
            campaignState,
          );

        expect(
          items.map(
            (item) =>
              item.displayValue,
          ),
        ).toEqual([
          '$0',
          '0',
          '0',
          '0',
          '0',
          '0%',
          '100%',
          '0%',
        ]);

        expect(
          items.map(
            (item) =>
              item.progressValue,
          ),
        ).toEqual([
          null,
          null,
          null,
          null,
          null,
          0,
          100,
          0,
        ]);
      },
    );
  },
);