import { describe, expect, it } from 'vitest';
import type { GameState } from '../core/types';
import {
  getCurrentAge,
  getCurrentRulerAge,
  getRulerReignYear,
  gameStartYear,
} from './game-calendar';

describe('game calendar', () => {
  it('uses a fixed game start year', () => {
    expect(gameStartYear).toBe(1);
  });

  it('calculates current age from starting age and total game year', () => {
    const state: GameState = {
      year: 3,
      playerName: 'Ashurbanipal Sargonid',
      population: 100,
      acres: 1000,
      grain: 1800,
    };

    expect(getCurrentAge({ startingAge: 30 }, state)).toBe(32);
    expect(getCurrentRulerAge({ startingAge: 30 }, state)).toBe(32);
  });

  it('calculates current age from a later character starting year', () => {
    const state: GameState = {
      year: 8,
      playerName: 'Heir Sargonid',
      population: 100,
      acres: 1000,
      grain: 1800,
    };

    expect(getCurrentAge({ startingAge: 0, startingYear: 8 }, state)).toBe(0);
    expect(getCurrentAge({ startingAge: 0, startingYear: 6 }, state)).toBe(2);
  });

  it('calculates reign year from reign start year and total game year', () => {
    const state: GameState = {
      year: 8,
      playerName: 'Heir Sargonid',
      population: 100,
      acres: 1000,
      grain: 1800,
    };

    expect(getRulerReignYear({ reignStartYear: 8 }, state)).toBe(1);
    expect(getRulerReignYear({ reignStartYear: 6 }, state)).toBe(3);
  });

  it('returns null reign year for characters who have not ruled', () => {
    const state: GameState = {
      year: 8,
      playerName: 'Heir Sargonid',
      population: 100,
      acres: 1000,
      grain: 1800,
    };

    expect(getRulerReignYear({ reignStartYear: null }, state)).toBeNull();
  });
});