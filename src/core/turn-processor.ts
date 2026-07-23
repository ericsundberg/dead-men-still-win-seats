import type { GameConfig } from './game-config';
import type { GameState, TurnCommand, TurnOutcome } from './types';

export function processTurn(
state: GameState,
command: TurnCommand,
config: GameConfig,
): TurnOutcome {
const events: string[] = [];

const acresToSell = clampWholeNumber(command.acresToSell, 0, state.acres);

if (acresToSell !== command.acresToSell) {
events.push(`Adjusted acres sold from ${command.acresToSell} to ${acresToSell}.`);
}

const acresAfterSale = state.acres - acresToSell;

const acresToBuy = Math.max(0, Math.floor(command.acresToBuy));

if (acresToBuy !== command.acresToBuy) {
events.push(`Adjusted acres bought from ${command.acresToBuy} to ${acresToBuy}.`);
}

const acresAfterLandTrade = acresAfterSale + acresToBuy;

const maximumPlantableByLand = acresAfterLandTrade;
const maximumPlantableByPeople = state.population * config.acresPerPersonCanPlant;
const maximumPlantableByGrain = Math.floor(state.grain / config.grainPerAcreToPlant);

const acresToPlant = clampWholeNumber(
command.acresToPlant,
0,
Math.min(maximumPlantableByLand, maximumPlantableByPeople, maximumPlantableByGrain),
);

if (acresToPlant !== command.acresToPlant) {
events.push(`Adjusted acres planted from ${command.acresToPlant} to ${acresToPlant}.`);
}

const plantingCost = acresToPlant * config.grainPerAcreToPlant;
const grainAfterPlanting = state.grain - plantingCost;

const grainToFeed = clampWholeNumber(command.grainToFeed, 0, grainAfterPlanting);

if (grainToFeed !== command.grainToFeed) {
events.push(`Adjusted grain fed from ${command.grainToFeed} to ${grainToFeed}.`);
}

const peopleFed = Math.floor(grainToFeed / config.grainPerPersonToFeed);
const peopleStarved = Math.max(0, state.population - peopleFed);
const harvest = acresToPlant * config.harvestGrainPerAcre;

if (peopleStarved > 0) {
events.push(`${peopleStarved} people starved.`);
} else {
events.push('No one starved.');
}

events.push(`Harvested ${harvest} grain from ${acresToPlant} planted acres.`);

const nextState: GameState = {
year: state.year + 1,
playerName: state.playerName,
population: Math.max(0, state.population - peopleStarved),
acres: acresAfterLandTrade,
grain: grainAfterPlanting - grainToFeed + harvest,
};

return {
previousState: state,
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

function clampWholeNumber(value: number, minimum: number, maximum: number): number {
if (!Number.isFinite(value)) {
return minimum;
}

return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}
