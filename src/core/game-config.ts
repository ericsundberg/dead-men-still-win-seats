export interface GameConfig {
  readonly startingYear:
    number;

  readonly startingPopulation:
    number;

  /**
   * Optional lower bound applied after legacy Hamurabi turns.
   *
   * The campaign migration temporarily uses this to prevent the
   * placeholder runtime from ending the political campaign.
   */
  readonly minimumPopulation?:
    number;

  readonly startingAcres:
    number;

  readonly startingGrain:
    number;

  readonly grainPerPersonToFeed:
    number;

  readonly grainPerAcreToPlant:
    number;

  readonly acresPerPersonCanPlant:
    number;

  readonly harvestGrainPerAcre:
    number;
}