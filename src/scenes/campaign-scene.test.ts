import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignState,
} from '../game/campaign/campaign-state';
import {
  resolveCampaignSceneRuntime,
} from './campaign-scene';

describe(
  'campaign scene runtime resolution',
  () => {
    it(
      'uses campaign state to determine whether a campaign is active',
      () => {
        const snapshot =
          resolveCampaignSceneRuntime({
            campaignState:
              createInitialCampaignState(
                'easy',
              ),
          });

        expect(
          snapshot
            .hasActiveCampaign,
        ).toBe(true);
      },
    );

    it(
      'reports no active campaign when campaign state is absent',
      () => {
        const snapshot =
          resolveCampaignSceneRuntime({
            campaignState:
              null,
          });

        expect(
          snapshot
            .hasActiveCampaign,
        ).toBe(false);

        expect(
          snapshot.newsItems,
        ).toEqual([]);
      },
    );

    it(
      'exposes campaign news for the campaign shell',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'hardliner',
          ),

          newsFeed: [
            'Senator Misses Another Public Appearance',
            'Campaign Insists Everything Is Fine',
          ],
        };

        const snapshot =
          resolveCampaignSceneRuntime({
            campaignState,
          });

        expect(
          snapshot.newsItems,
        ).toEqual([
          'Senator Misses Another Public Appearance',
          'Campaign Insists Everything Is Fine',
        ]);
      },
    );
  },
);