import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  GameState,
} from '../core/types';
import {
  createInitialCampaignState,
} from '../game/campaign/campaign-state';
import {
  resolveCampaignSceneRuntime,
} from './campaign-scene';

const legacyState:
  GameState = {
    year: 1,
    playerName:
      'Test Candidate',

    population: 100,
    acres: 1_000,
    grain: 2_800,
  };

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

            legacyState,
          });

        expect(
          snapshot
            .hasActiveCampaign,
        ).toBe(true);

        expect(
          snapshot
            .hasLegacyState,
        ).toBe(true);

        expect(
          snapshot
            .hasRuntimeMismatch,
        ).toBe(false);
      },
    );

    it(
      'does not treat legacy state alone as an active campaign',
      () => {
        const snapshot =
          resolveCampaignSceneRuntime({
            campaignState:
              null,

            legacyState,
          });

        expect(
          snapshot
            .hasActiveCampaign,
        ).toBe(false);

        expect(
          snapshot
            .hasLegacyState,
        ).toBe(true);

        expect(
          snapshot
            .hasRuntimeMismatch,
        ).toBe(false);
      },
    );

    it(
      'detects an active campaign without its temporary legacy state',
      () => {
        const snapshot =
          resolveCampaignSceneRuntime({
            campaignState:
              createInitialCampaignState(
                'moderate',
              ),

            legacyState:
              null,
          });

        expect(
          snapshot
            .hasActiveCampaign,
        ).toBe(true);

        expect(
          snapshot
            .hasLegacyState,
        ).toBe(false);

        expect(
          snapshot
            .hasRuntimeMismatch,
        ).toBe(true);
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
            legacyState,
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