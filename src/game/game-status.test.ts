import { describe, expect, it } from 'vitest';
import type { GameState } from '../core/types';
import { getGameOverState, getGameStatus } from './game-status';

describe('game status', () => {
  it('marks a missing state as not started', () => {
    expect(getGameStatus(null)).toBe('not-started');
    expect(getGameOverState(null)).toBeNull();
  });

  it('marks a populated state as active', () => {
    const state: GameState = {
      year: 1,
      playerName: 'Tester',
      population: 100,
      acres: 1000,
      grain: 2800,
    };

    expect(getGameStatus(state)).toBe('active');
    expect(getGameOverState(state)).toBeNull();
  });

  it('marks zero population as ended by population collapse', () => {
    const state: GameState = {
      year: 5,
      playerName: 'Tester',
      population: 0,
      acres: 1000,
      grain: 0,
    };

    expect(getGameStatus(state)).toBe('ended');
    expect(getGameOverState(state)).toEqual({
      reason: 'population-collapse',
      title: 'Dynasty Collapsed',
      message: 'There are no people left to rule. Your reign has ended.',
    });
  });
});