import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  getElectionCountdownWeeks,
} from './campaign-election-countdown';

describe(
  'campaign election countdown',
  () => {
    it(
      'starts Easy mode with twelve weeks remaining',
      () => {
        expect(
          getElectionCountdownWeeks(
            1,
            'easy',
          ),
        ).toBe(12);
      },
    );

    it(
      'decreases by one for each campaign turn',
      () => {
        expect(
          getElectionCountdownWeeks(
            6,
            'easy',
          ),
        ).toBe(7);
      },
    );

    it(
      'does not fall below zero',
      () => {
        expect(
          getElectionCountdownWeeks(
            20,
            'easy',
          ),
        ).toBe(0);
      },
    );
  },
);