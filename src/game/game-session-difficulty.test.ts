import { beforeEach, describe, expect, it } from 'vitest';
import { loadTestLocalization } from '../test/test-localization';
import { createGameSession } from './game-session';

describe('GameSession difficulty', () => {
  beforeEach(loadTestLocalization);

  it('stores the selected difficulty and total turn count', () => {
    const gameSession = createGameSession();

    gameSession.startNewGame({
      difficulty: 'far-gone',
    });

    expect(gameSession.getDifficultyId()).toBe('far-gone');
    expect(gameSession.getTotalTurns()).toBe(78);
  });
});