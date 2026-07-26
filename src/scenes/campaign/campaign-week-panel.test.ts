import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignState,
} from '../../game/campaign/campaign-state';
import {
  createCampaignWeekPanelModel,
} from './campaign-week-panel';

describe(
  'campaign week panel model',
  () => {
    it(
      'describes the current campaign week and available actions',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          currentTurn:
            4,

          phase:
            'player-actions' as const,

          resources: {
            ...createInitialCampaignState(
              'easy',
            ).resources,

            actionPoints:
              3,
          },
        };

        const model =
          createCampaignWeekPanelModel(
            campaignState,
          );

        expect(
          model.title,
        ).toBe(
          'Week 4 Briefing',
        );

        expect(
          model.actionPointSummary,
        ).toBe(
          '3 action points remaining.',
        );

        expect(
          model.instruction,
        ).toContain(
          'Choose any campaign actions',
        );
      },
    );

    it(
      'uses singular wording when one action point remains',
      () => {
        const initialState =
          createInitialCampaignState(
            'easy',
          );

        const campaignState = {
          ...initialState,

          phase:
            'player-actions' as const,

          resources: {
            ...initialState.resources,

            actionPoints:
              1,
          },
        };

        const model =
          createCampaignWeekPanelModel(
            campaignState,
          );

        expect(
          model.actionPointSummary,
        ).toBe(
          '1 action point remaining.',
        );
      },
    );

    it(
      'directs the player to end the week when no actions remain',
      () => {
        const initialState =
          createInitialCampaignState(
            'easy',
          );

        const campaignState = {
          ...initialState,

          phase:
            'player-actions' as const,

          resources: {
            ...initialState.resources,

            actionPoints:
              0,
          },
        };

        const model =
          createCampaignWeekPanelModel(
            campaignState,
          );

        expect(
          model.instruction,
        ).toContain(
          'exhausted its actions',
        );
      },
    );

    it(
      'shows the most recent campaign headline',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,

          newsFeed: [
            'First campaign headline',
            'Most recent campaign headline',
          ],
        };

        const model =
          createCampaignWeekPanelModel(
            campaignState,
          );

        expect(
          model.latestHeadline,
        ).toBe(
          'Most recent campaign headline',
        );
      },
    );

    it(
      'provides fallback copy when no campaign news exists',
      () => {
        const campaignState = {
          ...createInitialCampaignState(
            'easy',
          ),

          phase:
            'player-actions' as const,
        };

        const model =
          createCampaignWeekPanelModel(
            campaignState,
          );

        expect(
          model.latestHeadline,
        ).toBe(
          'No new campaign headlines this week.',
        );
      },
    );
  },
);