import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createInitialCampaignState,
} from '../../game/campaign/campaign-state';
import {
  canCampaignEndTurn,
  requestCampaignEndTurn,
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

describe(
  'campaign end-turn requests',
  () => {
    it(
      'advances the campaign and renders the resulting state',
      () => {
        const nextState = {
          ...createInitialCampaignState(
            'easy',
          ),

          currentTurn:
            2,

          phase:
            'player-actions' as const,
        };

        const endTurn =
          vi.fn(
            () =>
              nextState,
          );

        const navigate =
          vi.fn();

        const consoleLog =
          vi.spyOn(
            console,
            'log',
          ).mockImplementation(
            () => undefined,
          );

        try {
          const result =
            requestCampaignEndTurn({
              campaign: {
                endTurn,
              },

              navigate,
            });

          expect(
            result,
          ).toBe(
            nextState,
          );

          expect(
            endTurn,
          ).toHaveBeenCalledTimes(
            1,
          );

          expect(
            navigate,
          ).toHaveBeenCalledTimes(
            1,
          );

          expect(
            navigate,
          ).toHaveBeenCalledWith(
            'campaign',
          );
        } finally {
          consoleLog.mockRestore();
        }
      },
    );

    it(
      'does not navigate when campaign turn advancement is rejected',
      () => {
        const endTurn =
          vi.fn(
            () =>
              null,
          );

        const navigate =
          vi.fn();

        const consoleWarn =
          vi.spyOn(
            console,
            'warn',
          ).mockImplementation(
            () => undefined,
          );

        try {
          const result =
            requestCampaignEndTurn({
              campaign: {
                endTurn,
              },

              navigate,
            });

          expect(
            result,
          ).toBeNull();

          expect(
            endTurn,
          ).toHaveBeenCalledTimes(
            1,
          );

          expect(
            navigate,
          ).not.toHaveBeenCalled();
        } finally {
          consoleWarn.mockRestore();
        }
      },
    );
  },
);