import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  game_version,
} from './version';

describe(
  'game version',
  () => {
    it(
      'exposes the current beta version',
      () => {
        expect(
          game_version,
        ).toBe(
          '0.1.1-beta',
        );
      },
    );
  },
);