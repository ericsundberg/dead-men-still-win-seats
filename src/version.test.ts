import { describe, expect, it } from 'vitest';
import { game_version } from './version';

describe('game version', () => {
  it('exposes the current prealpha version', () => {
    expect(game_version).toBe('0.0.7-prealpha');
  });
});