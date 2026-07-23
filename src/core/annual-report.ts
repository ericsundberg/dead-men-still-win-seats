import type { AnnualReport, GameState } from './types';

export function createAnnualReport(state: GameState): AnnualReport {
return {
year: state.year,
lines: [
`Year ${state.year} report`,
`Player: ${state.playerName}`,
`Population: ${state.population}`,
`Acres: ${state.acres}`,
`Grain: ${state.grain}`,
],
};
}
