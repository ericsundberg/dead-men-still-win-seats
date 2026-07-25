import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createCampaignGameOverModel,
} from './campaign-game-over-panel';

describe(
  'campaign game-over panel',
  () => {
    it(
      'presents the public discovery result',
      () => {
        expect(
          createCampaignGameOverModel({
            type:
              'public-discovers-death',

            triggeredOnTurn:
              7,
          }),
        ).toEqual({
          endGameType:
            'public-discovers-death',

          outcomeLabel:
            'The Secret Is Out',

          title:
            'The Senator Is Dead',

          message:
            [
              'The public finally learns that Senator Phil A. Buster',
              'is dead. The campaign collapses before the ballots can',
              'finish the job.',
            ].join(' '),

          tone:
            'defeat',

          turnLabel:
            'Campaign ended on turn 7.',
        });
      },
    );

    it(
      'presents the party revolt result',
      () => {
        expect(
          createCampaignGameOverModel({
            type:
              'party-dumps-senator',

            triggeredOnTurn:
              4,
          }),
        ).toEqual({
          endGameType:
            'party-dumps-senator',

          outcomeLabel:
            'Party Revolt',

          title:
            'Thrown Under the Campaign Bus',

          message:
            [
              'Party leaders abandon the operation and remove the',
              'Senator from their plans before the campaign reaches',
              'Election Day.',
            ].join(' '),

          tone:
            'defeat',

          turnLabel:
            'Campaign ended on turn 4.',
        });
      },
    );

    it(
      'presents the election defeat result',
      () => {
        expect(
          createCampaignGameOverModel({
            type:
              'lose-reelection',

            triggeredOnTurn:
              13,
          }),
        ).toEqual({
          endGameType:
            'lose-reelection',

          outcomeLabel:
            'Election Defeat',

          title:
            'Dead on Arrival',

          message:
            [
              'The secret survives, but the campaign does not.',
              'Voters leave the Buster ticket behind on Election Day.',
            ].join(' '),

          tone:
            'defeat',

          turnLabel:
            'Election resolved on turn 13.',
        });
      },
    );

    it(
      'presents the reelection victory result',
      () => {
        expect(
          createCampaignGameOverModel({
            type:
              'win-reelection',

            triggeredOnTurn:
              13,
          }),
        ).toEqual({
          endGameType:
            'win-reelection',

          outcomeLabel:
            'Re-Elected',

          title:
            'Dead Men Still Win Seats',

          message:
            [
              'Against biology, arithmetic, and good government,',
              'Senator Phil A. Buster wins another term.',
            ].join(' '),

          tone:
            'victory',

          turnLabel:
            'Election resolved on turn 13.',
        });
      },
    );

    it(
      'provides a safe fallback for a missing result',
      () => {
        expect(
          createCampaignGameOverModel(
            null,
          ),
        ).toEqual({
          endGameType:
            null,

          outcomeLabel:
            'Result Unavailable',

          title:
            'Campaign Ended',

          message:
            [
              'The campaign reached a terminal state without a',
              'recorded final result.',
            ].join(' '),

          tone:
            'neutral',

          turnLabel:
            'No final campaign turn was recorded.',
        });
      },
    );
  },
);