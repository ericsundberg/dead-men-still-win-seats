export interface GameState {
readonly year: number;
readonly playerName: string;
readonly population: number;
readonly acres: number;
readonly grain: number;
}

export interface TurnCommand {
readonly acresToBuy: number;
readonly acresToSell: number;
readonly grainToFeed: number;
readonly acresToPlant: number;
}

export interface TurnOutcome {
readonly previousState: GameState;
readonly command: TurnCommand;
readonly nextState: GameState;
readonly events: readonly string[];
}

export interface AnnualReport {
readonly year: number;
readonly lines: readonly string[];
}
