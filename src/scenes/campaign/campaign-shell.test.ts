import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignState,
} from '../../game/campaign/campaign-state';
import {
  canCampaignEndTurn,
  resolveCampaignHudSnapshot,
} from './campaign-shell';

describe(
  'campaign HUD state resolution',
  () => {
    it(
      'prefers active campaign state over legacy state',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'moderate',
          ),

          currentTurn:
            7,

          phase:
            'player-actions' as const,

          newsFeed: [
            'Campaign news headline',
          ],
        };

        const snapshot =
          resolveCampaignHudSnapshot({
            campaignState,

            legacyTurnNumber:
              99,

            legacyDifficultyId:
              'easy',

            legacyIsGameOver:
              false,

            fallbackNewsItems: [
              'Fallback headline',
            ],
          });

        expect(
          snapshot,
        ).toEqual({
          turnNumber:
            7,

          difficultyId:
            'moderate',

          newsItems: [
            'Campaign news headline',
          ],

          isGameOver:
            false,
        });
      },
    );

    it(
      'uses supplied news while the campaign feed is empty',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,
        };

        const snapshot =
          resolveCampaignHudSnapshot({
            campaignState,

            legacyTurnNumber:
              1,

            legacyDifficultyId:
              'easy',

            legacyIsGameOver:
              false,

            fallbackNewsItems: [
              'Temporary campaign headline',
            ],
          });

        expect(
          snapshot.newsItems,
        ).toEqual([
          'Temporary campaign headline',
        ]);
      },
    );

    it(
      'falls back to legacy state before a campaign is active',
      () => {
        const snapshot =
          resolveCampaignHudSnapshot({
            campaignState:
              null,

            legacyTurnNumber:
              4,

            legacyDifficultyId:
              'hardliner',

            legacyIsGameOver:
              false,

            fallbackNewsItems: [
              'Legacy headline',
            ],
          });

        expect(
          snapshot,
        ).toEqual({
          turnNumber:
            4,

          difficultyId:
            'hardliner',

          newsItems: [
            'Legacy headline',
          ],

          isGameOver:
            false,
        });
      },
    );

    it(
      'uses turn one when neither runtime supplies a turn',
      () => {
        const snapshot =
          resolveCampaignHudSnapshot({
            campaignState:
              null,

            legacyTurnNumber:
              null,

            legacyDifficultyId:
              'easy',

            legacyIsGameOver:
              false,
          });

        expect(
          snapshot.turnNumber,
        ).toBe(1);

        expect(
          snapshot.newsItems,
        ).toEqual([]);
      },
    );

    it(
      'disables turn advancement when campaign state is game over',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'game-over' as const,

          endGameState: {
            type:
              'win-reelection' as const,

            triggeredOnTurn:
              13,
          },
        };

        const snapshot =
          resolveCampaignHudSnapshot({
            campaignState,

            legacyTurnNumber:
              13,

            legacyDifficultyId:
              'easy',

            legacyIsGameOver:
              false,
          });

        expect(
          snapshot.isGameOver,
        ).toBe(true);
      },
    );

    it(
      'also respects the temporary legacy game-over state',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,
        };

        const snapshot =
          resolveCampaignHudSnapshot({
            campaignState,

            legacyTurnNumber:
              1,

            legacyDifficultyId:
              'easy',

            legacyIsGameOver:
              true,
          });

        expect(
          snapshot.isGameOver,
        ).toBe(true);
      },
    );
  },
);

describe(
  'campaign end-turn availability',
  () => {
    it(
      'allows turn advancement during player actions',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,
        };

        expect(
          canCampaignEndTurn(
            campaignState,
            false,
          ),
        ).toBe(true);
      },
    );

    it(
      'blocks turn advancement while an event is unresolved',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'resolving-events' as const,

          activeEventInstanceId:
            'event_test_01' as const,
        };

        expect(
          canCampaignEndTurn(
            campaignState,
            false,
          ),
        ).toBe(false);
      },
    );

    it(
      'blocks turn advancement when the legacy runtime is game over',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,
        };

        expect(
          canCampaignEndTurn(
            campaignState,
            true,
          ),
        ).toBe(false);
      },
    );
  },
);