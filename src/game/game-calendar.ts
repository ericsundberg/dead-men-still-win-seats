import type { GameState } from '../core/types';

export const gameStartYear = 1;

export interface AgeTrackedEntity {
  readonly startingAge: number;
  readonly startingYear?: number;
}

export interface ReignTrackedEntity {
  readonly reignStartYear: number | null;
}

export function getCurrentAge(
  entity: AgeTrackedEntity,
  state: GameState,
): number {
  const startingYear = entity.startingYear ?? gameStartYear;

  return entity.startingAge + Math.max(0, state.year - startingYear);
}

export function getCurrentRulerAge(
  rulerProfile: AgeTrackedEntity,
  state: GameState,
): number {
  return getCurrentAge(rulerProfile, state);
}

export function getRulerReignYear(
  entity: ReignTrackedEntity,
  state: GameState,
): number | null {
  if (entity.reignStartYear === null) {
    return null;
  }

  return Math.max(1, state.year - entity.reignStartYear + 1);
}