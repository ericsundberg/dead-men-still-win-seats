export type GameDifficultyId = 'easy' | 'moderate' | 'hardliner' | 'far-gone';

export interface GameDifficultySettings {
  readonly id: GameDifficultyId;
  readonly turnCount: number;
}

export const defaultGameDifficultyId: GameDifficultyId = 'easy';

export const gameDifficultyIds = [
  'easy',
  'moderate',
  'hardliner',
  'far-gone',
] as const satisfies readonly GameDifficultyId[];

export const gameDifficultySettings = {
  easy: {
    id: 'easy',
    turnCount: 13,
  },
  moderate: {
    id: 'moderate',
    turnCount: 26,
  },
  hardliner: {
    id: 'hardliner',
    turnCount: 52,
  },
  'far-gone': {
    id: 'far-gone',
    turnCount: 78,
  },
} as const satisfies Record<GameDifficultyId, GameDifficultySettings>;

export function getGameDifficultySettings(
  difficultyId: GameDifficultyId = defaultGameDifficultyId,
): GameDifficultySettings {
  return gameDifficultySettings[difficultyId];
}
