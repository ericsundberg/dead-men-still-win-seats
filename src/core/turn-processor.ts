import type {
  GameConfig,
} from './game-config';
import type {
  GameState,
  TurnCommand,
  TurnOutcome,
} from './types';

export function processTurn(
  state:
    GameState,

  command:
    TurnCommand,

  config:
    GameConfig,
): TurnOutcome {
  const events:
    string[] = [];

  const acresToSell =
    clampWholeNumber(
      command.acresToSell,
      0,
      state.acres,
    );

  if (
    acresToSell
    !== command.acresToSell
  ) {
    events.push(
      [
        'Adjusted acres sold from',
        `${command.acresToSell}`,
        'to',
        `${acresToSell}.`,
      ].join(' '),
    );
  }

  const acresAfterSale =
    state.acres
    - acresToSell;

  const acresToBuy =
    Math.max(
      0,
      Math.floor(
        command.acresToBuy,
      ),
    );

  if (
    acresToBuy
    !== command.acresToBuy
  ) {
    events.push(
      [
        'Adjusted acres bought from',
        `${command.acresToBuy}`,
        'to',
        `${acresToBuy}.`,
      ].join(' '),
    );
  }

  const acresAfterLandTrade =
    acresAfterSale
    + acresToBuy;

  const maximumPlantableByLand =
    acresAfterLandTrade;

  const maximumPlantableByPeople =
    state.population
    * config.acresPerPersonCanPlant;

  const maximumPlantableByGrain =
    Math.floor(
      state.grain
      / config.grainPerAcreToPlant,
    );

  const acresToPlant =
    clampWholeNumber(
      command.acresToPlant,
      0,
      Math.min(
        maximumPlantableByLand,
        maximumPlantableByPeople,
        maximumPlantableByGrain,
      ),
    );

  if (
    acresToPlant
    !== command.acresToPlant
  ) {
    events.push(
      [
        'Adjusted acres planted from',
        `${command.acresToPlant}`,
        'to',
        `${acresToPlant}.`,
      ].join(' '),
    );
  }

  const plantingCost =
    acresToPlant
    * config.grainPerAcreToPlant;

  const grainAfterPlanting =
    state.grain
    - plantingCost;

  const grainToFeed =
    clampWholeNumber(
      command.grainToFeed,
      0,
      grainAfterPlanting,
    );

  if (
    grainToFeed
    !== command.grainToFeed
  ) {
    events.push(
      [
        'Adjusted grain fed from',
        `${command.grainToFeed}`,
        'to',
        `${grainToFeed}.`,
      ].join(' '),
    );
  }

  const peopleFed =
    Math.floor(
      grainToFeed
      / config.grainPerPersonToFeed,
    );

  const minimumPopulation =
    getMinimumPopulation(
      config,
    );

  /*
   * People protected by the configured floor are not counted as
   * starving. Legacy simulations without a floor retain their
   * original behavior.
   */
  const protectedPopulation =
    Math.min(
      state.population,
      minimumPopulation,
    );

  const survivingPopulation =
    Math.max(
      peopleFed,
      protectedPopulation,
    );

  const peopleStarved =
    Math.max(
      0,
      state.population
      - survivingPopulation,
    );

  const harvest =
    acresToPlant
    * config.harvestGrainPerAcre;

  if (
    peopleStarved
    > 0
  ) {
    events.push(
      `${peopleStarved} people starved.`,
    );
  } else {
    events.push(
      'No one starved.',
    );
  }

  events.push(
    [
      `Harvested ${harvest} grain`,
      `from ${acresToPlant} planted acres.`,
    ].join(' '),
  );

  const nextState:
    GameState = {
      year:
        state.year
        + 1,

      playerName:
        state.playerName,

      population:
        Math.max(
          minimumPopulation,
          state.population
          - peopleStarved,
        ),

      acres:
        acresAfterLandTrade,

      grain:
        grainAfterPlanting
        - grainToFeed
        + harvest,
    };

  return {
    previousState:
      state,

    command: {
      acresToBuy,
      acresToSell,
      grainToFeed,
      acresToPlant,
    },

    nextState,

    events,
  };
}

function getMinimumPopulation(
  config:
    GameConfig,
): number {
  const configuredMinimum =
    config.minimumPopulation
    ?? 0;

  if (
    !Number.isFinite(
      configuredMinimum,
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      configuredMinimum,
    ),
  );
}

function clampWholeNumber(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.floor(
        value,
      ),
    ),
  );
}