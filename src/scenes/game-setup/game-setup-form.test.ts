import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  startCampaignRuntimes,
} from './game-setup-form';

describe(
  'game setup form campaign startup',
  () => {
    it(
      'starts both runtimes with the selected difficulty',
      () => {
        const gameSession = {
          startNewGame:
            vi.fn(),
        };

        const campaignSession = {
          startCampaign:
            vi.fn(),
        };

        startCampaignRuntimes(
          gameSession,
          campaignSession,
          'hardliner',
        );

        expect(
          gameSession.startNewGame,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          gameSession.startNewGame,
        ).toHaveBeenCalledWith({
          difficulty:
            'hardliner',
        });

        expect(
          campaignSession
            .startCampaign,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          campaignSession
            .startCampaign,
        ).toHaveBeenCalledWith(
          'hardliner',
        );
      },
    );

    it(
      'does not substitute a default difficulty',
      () => {
        const gameSession = {
          startNewGame:
            vi.fn(),
        };

        const campaignSession = {
          startCampaign:
            vi.fn(),
        };

        startCampaignRuntimes(
          gameSession,
          campaignSession,
          'far-gone',
        );

        expect(
          gameSession.startNewGame,
        ).toHaveBeenCalledWith({
          difficulty:
            'far-gone',
        });

        expect(
          campaignSession
            .startCampaign,
        ).toHaveBeenCalledWith(
          'far-gone',
        );
      },
    );
  },
);