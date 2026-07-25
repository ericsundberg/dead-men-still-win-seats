import type {
  GameConfig,
} from '../core/game-config';

export const defaultGameConfig:
  GameConfig = {
    startingYear:
      1,

    /*
     * Temporary migration safeguard.
     *
     * Remove these inflated population values when the Hamurabi
     * runtime is removed from the campaign scene.
     */
    startingPopulation:
      999_999_999,

    minimumPopulation:
      999_999_999,

    startingAcres:
      1_000,

    startingGrain:
      2_800,

    grainPerPersonToFeed:
      20,

    grainPerAcreToPlant:
      1,

    acresPerPersonCanPlant:
      10,

    harvestGrainPerAcre:
      3,
  };