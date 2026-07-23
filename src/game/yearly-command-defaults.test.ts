import { describe, expect, it } from 'vitest';
import type { GameState } from '../core/types';
import { defaultGameConfig } from '../content/default-game-config';
import { createDefaultTurnCommand } from './yearly-command-defaults';

describe('yearly command defaults', () => {
  it('creates a useful opening command suggestion', () => {
    const state: GameState = {
      year: 1,
      playerName: 'Tester',
      population: 100,
      acres: 1000,
      grain: 2800,
    };

    expect(createDefaultTurnCommand(state, defaultGameConfig)).toEqual({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 800,
    });
  });

  it('does not reserve more grain for food than exists', () => {
    const state: GameState = {
      year: 2,
      playerName: 'Tester',
      population: 100,
      acres: 1000,
      grain: 1200,
    };

    expect(createDefaultTurnCommand(state, defaultGameConfig)).toEqual({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 1200,
      acresToPlant: 0,
    });
  });

  it('returns zero defaults for a dead population with no grain', () => {
    const state: GameState = {
      year: 5,
      playerName: 'Tester',
      population: 0,
      acres: 1000,
      grain: 0,
    };

    expect(createDefaultTurnCommand(state, defaultGameConfig)).toEqual({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 0,
      acresToPlant: 0,
    });
  });
});
