import type { GameConfig } from '../core/game-config';

export const defaultGameConfig: GameConfig = {
startingYear: 1,
startingPopulation: 100,
startingAcres: 1000,
startingGrain: 2800,
grainPerPersonToFeed: 20,
grainPerAcreToPlant: 1,
acresPerPersonCanPlant: 10,
harvestGrainPerAcre: 3,
};
