import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  formatCampaignDateLabel,
} from './campaign-news-ticker';

describe(
  'campaign news ticker calendar',
  () => {
    it(
      'starts at week one of August 2026',
      () => {
        expect(
          formatCampaignDateLabel({
            turnNumber: 1,
            difficultyId: 'easy',
          }),
        ).toBe(
          'WEEK 1, AUGUST, 2026',
        );
      },
    );

    it(
      'uses four weeks in each month',
      () => {
        expect(
          formatCampaignDateLabel({
            turnNumber: 4,
            difficultyId: 'easy',
          }),
        ).toBe(
          'WEEK 4, AUGUST, 2026',
        );
      },
    );

    it(
      'resets to week one after week four',
      () => {
        expect(
          formatCampaignDateLabel({
            turnNumber: 5,
            difficultyId: 'easy',
          }),
        ).toBe(
          'WEEK 1, SEPTEMBER, 2026',
        );
      },
    );

    it(
      'advances the year after twelve months',
      () => {
        expect(
          formatCampaignDateLabel({
            turnNumber: 21,
            difficultyId: 'easy',
          }),
        ).toBe(
          'WEEK 1, JANUARY, 2027',
        );
      },
    );

    it(
      'formats later turns using the same cycle',
      () => {
        expect(
          formatCampaignDateLabel({
            turnNumber: 33,
            difficultyId: 'easy',
          }),
        ).toBe(
          'WEEK 1, APRIL, 2027',
        );
      },
    );
  },
);