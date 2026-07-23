import type { GameConfig } from '../core/game-config';
import type { GameState, TurnCommand } from '../core/types';

export function createDefaultTurnCommand(
  state: GameState,
  config: GameConfig,
): TurnCommand {
  return {
    acresToBuy: 0,
    acresToSell: 0,
    grainToFeed: getDefaultGrainToFeed(state, config),
    acresToPlant: getDefaultAcresToPlant(state, config),
  };
}

export function getDefaultGrainToFeed(
  state: GameState,
  config: GameConfig,
): number {
  return Math.min(
    state.grain,
    state.population * config.grainPerPersonToFeed,
  );
}

export function getDefaultAcresToPlant(
  state: GameState,
  config: GameConfig,
): number {
  const grainReservedForFood = getDefaultGrainToFeed(state, config);
  const grainAvailableForPlanting = Math.max(0, state.grain - grainReservedForFood);

  const maximumPlantableByLand = state.acres;
  const maximumPlantableByPeople = state.population * config.acresPerPersonCanPlant;
  const maximumPlantableByGrain = getMaximumPlantableByGrain(
    grainAvailableForPlanting,
    config,
  );

  return Math.min(
    maximumPlantableByLand,
    maximumPlantableByPeople,
    maximumPlantableByGrain,
  );
}

function getMaximumPlantableByGrain(
  grainAvailableForPlanting: number,
  config: GameConfig,
): number {
  if (config.grainPerAcreToPlant <= 0) {
    return grainAvailableForPlanting;
  }

  return Math.floor(grainAvailableForPlanting / config.grainPerAcreToPlant);
}
