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
      'reads turn, difficulty, and news from campaign state',
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
      'recognizes campaign game-over state',
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
          ),
        ).toBe(false);
      },
    );

    it(
      'blocks turn advancement after campaign game over',
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

        expect(
          canCampaignEndTurn(
            campaignState,
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