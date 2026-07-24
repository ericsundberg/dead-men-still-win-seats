import { beforeEach, describe, expect, it } from 'vitest';
import {
  createStartedGameSession,
  populationCollapseTurnCommand,
} from '../test/game-session-fixtures';
import { loadTestLocalization } from '../test/test-localization';

describe('GameSession game over', () => {
  beforeEach(loadTestLocalization);

  it('ends the game when population reaches zero', () => {
    const gameSession = createStartedGameSession();

    const outcome = gameSession.processTurn(
      populationCollapseTurnCommand,
    );

    expect(outcome?.nextState.population).toBe(0);
    expect(gameSession.getStatus()).toBe('ended');
    expect(gameSession.isGameOver()).toBe(true);
    expect(gameSession.getGameOverState()).toEqual({
      reason: 'population-collapse',
      title: 'Dynasty Collapsed',
      message: 'There are no people left to rule. Your reign has ended.',
    });
    expect(gameSession.getSuggestedTurnCommand()).toBeNull();
  });

  it('does not process turns after the game ends', () => {
    const gameSession = createStartedGameSession();

    gameSession.processTurn(populationCollapseTurnCommand);

    const stateAfterGameOver = gameSession.getState();

    expect(
      gameSession.processTurn(populationCollapseTurnCommand),
    ).toBeNull();

    expect(gameSession.getState()).toEqual(stateAfterGameOver);
  });
});