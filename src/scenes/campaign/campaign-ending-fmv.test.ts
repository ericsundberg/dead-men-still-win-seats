import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignEndingFmvPlaybackState,
  isCampaignEndingFmvSkipKey,
  reduceCampaignEndingFmvPlaybackState,
  resolveCampaignEndingFmv,
} from './campaign-ending-fmv';

describe(
  'campaign ending FMV mapping',
  () => {
    it(
      'uses the win video for reelection victory',
      () => {
        const result =
          resolveCampaignEndingFmv({
            type:
              'win-reelection',

            triggeredOnTurn:
              13,
          });

        expect(
          result,
        ).toMatchObject({
          id:
            'win',

          fileName:
            'win.mp4',

          ariaLabel:
            'Senator Buster wins reelection.',
        });

        expect(
          result?.source,
        ).toMatch(
          /assets\/video\/win\.mp4$/,
        );
      },
    );

    it(
      'uses the draw video when the secret survives but the campaign loses',
      () => {
        const result =
          resolveCampaignEndingFmv({
            type:
              'lose-reelection',

            triggeredOnTurn:
              13,
          });

        expect(
          result,
        ).toMatchObject({
          id:
            'draw',

          fileName:
            'draw.mp4',

          ariaLabel:
            'The campaign loses reelection without revealing the Senator’s death.',
        });

        expect(
          result?.source,
        ).toMatch(
          /assets\/video\/draw\.mp4$/,
        );
      },
    );

    it(
      'uses the lose video when the public discovers the death',
      () => {
        const result =
          resolveCampaignEndingFmv({
            type:
              'public-discovers-death',

            triggeredOnTurn:
              6,
          });

        expect(
          result,
        ).toMatchObject({
          id:
            'lose',

          fileName:
            'lose.mp4',

          ariaLabel:
            'The public learns that Senator Buster is dead.',
        });

        expect(
          result?.source,
        ).toMatch(
          /assets\/video\/lose\.mp4$/,
        );
      },
    );

    it(
      'uses the lose video when the party abandons the Senator',
      () => {
        const result =
          resolveCampaignEndingFmv({
            type:
              'party-dumps-senator',

            triggeredOnTurn:
              4,
          });

        expect(
          result,
        ).toMatchObject({
          id:
            'lose',

          fileName:
            'lose.mp4',

          ariaLabel:
            'The party abandons Senator Buster and announces his death.',
        });

        expect(
          result?.source,
        ).toMatch(
          /assets\/video\/lose\.mp4$/,
        );
      },
    );

    it(
      'returns no video for a missing end-game result',
      () => {
        expect(
          resolveCampaignEndingFmv(
            null,
          ),
        ).toBeNull();
      },
    );
  },
);

describe(
  'campaign ending FMV playback state',
  () => {
    it(
      'starts idle',
      () => {
        expect(
          createInitialCampaignEndingFmvPlaybackState(),
        ).toEqual({
          phase:
            'idle',
        });
      },
    );

    it(
      'moves through starting and playing',
      () => {
        const startingState =
          reduceCampaignEndingFmvPlaybackState(
            createInitialCampaignEndingFmvPlaybackState(),
            'request-start',
          );

        const playingState =
          reduceCampaignEndingFmvPlaybackState(
            startingState,
            'confirm-playing',
          );

        expect(
          startingState,
        ).toEqual({
          phase:
            'starting',
        });

        expect(
          playingState,
        ).toEqual({
          phase:
            'playing',
        });
      },
    );

    it(
      'finishes from any active playback phase',
      () => {
        expect(
          reduceCampaignEndingFmvPlaybackState(
            {
              phase:
                'idle',
            },
            'finish',
          ),
        ).toEqual({
          phase:
            'finished',
        });

        expect(
          reduceCampaignEndingFmvPlaybackState(
            {
              phase:
                'starting',
            },
            'finish',
          ),
        ).toEqual({
          phase:
            'finished',
        });

        expect(
          reduceCampaignEndingFmvPlaybackState(
            {
              phase:
                'playing',
            },
            'finish',
          ),
        ).toEqual({
          phase:
            'finished',
        });
      },
    );

    it(
      'recognizes keyboard controls that skip the video',
      () => {
        expect(
          [
            'Escape',
            'Enter',
            ' ',
            'Spacebar',
          ].every(
            isCampaignEndingFmvSkipKey,
          ),
        ).toBe(true);

        expect(
          isCampaignEndingFmvSkipKey(
            'Tab',
          ),
        ).toBe(false);

        expect(
          isCampaignEndingFmvSkipKey(
            'a',
          ),
        ).toBe(false);
      },
    );

    it(
      'cannot leave the finished phase',
      () => {
        const finishedState = {
          phase:
            'finished',
        } as const;

        expect(
          reduceCampaignEndingFmvPlaybackState(
            finishedState,
            'request-start',
          ),
        ).toBe(
          finishedState,
        );

        expect(
          reduceCampaignEndingFmvPlaybackState(
            finishedState,
            'confirm-playing',
          ),
        ).toBe(
          finishedState,
        );
      },
    );
  },
);