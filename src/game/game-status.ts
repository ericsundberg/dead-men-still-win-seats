import type { GameState } from '../core/types';

export type GameStatus = 'not-started' | 'active' | 'ended';

export type GameOverReason = 'population-collapse';

export interface GameOverState {
  readonly reason: GameOverReason;
  readonly title: string;
  readonly message: string;
}

export function getGameStatus(state: GameState | null): GameStatus {
  if (!state) {
    return 'not-started';
  }

  if (getGameOverState(state)) {
    return 'ended';
  }

  return 'active';
}

export function getGameOverState(state: GameState | null): GameOverState | null {
  if (!state) {
    return null;
  }

  if (state.population <= 0) {
    return {
      reason: 'population-collapse',
      title: 'Dynasty Collapsed',
      message: 'There are no people left to rule. Your reign has ended.',
    };
  }

  return null;
}