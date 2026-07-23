export interface GameConfig {
readonly startingYear: number;
readonly startingPopulation: number;
readonly startingAcres: number;
readonly startingGrain: number;
readonly grainPerPersonToFeed: number;
readonly grainPerAcreToPlant: number;
readonly acresPerPersonCanPlant: number;
readonly harvestGrainPerAcre: number;
}
