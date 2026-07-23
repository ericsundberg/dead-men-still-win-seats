import { describe, expect, it } from 'vitest';
import {
  defaultGameDifficultyId,
  gameDifficultyIds,
  gameDifficultySettings,
  getGameDifficultySettings,
} from './difficulty';

describe('game difficulty', () => {
  it('defines campaign lengths by difficulty', () => {
    expect(gameDifficultySettings.easy.turnCount).toBe(13);
    expect(gameDifficultySettings.moderate.turnCount).toBe(26);
    expect(gameDifficultySettings.hardliner.turnCount).toBe(52);
    expect(gameDifficultySettings['far-gone'].turnCount).toBe(78);
  });

  it('uses easy as the default difficulty', () => {
    expect(defaultGameDifficultyId).toBe('easy');
    expect(getGameDifficultySettings()).toEqual(gameDifficultySettings.easy);
  });

  it('keeps difficulty ids ordered for setup UI rendering', () => {
    expect(gameDifficultyIds).toEqual([
      'easy',
      'moderate',
      'hardliner',
      'far-gone',
    ]);
  });
});
