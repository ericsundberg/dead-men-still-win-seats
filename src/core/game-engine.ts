import { createAnnualReport } from './annual-report';
import type { GameConfig } from './game-config';
import { processTurn } from './turn-processor';
import type { AnnualReport, GameState, TurnCommand, TurnOutcome } from './types';

export class GameEngine {
private state: GameState;

public constructor(
private readonly config: GameConfig,
playerName: string,
) {
this.state = {
year: config.startingYear,
playerName,
population: config.startingPopulation,
acres: config.startingAcres,
grain: config.startingGrain,
};
}

public getState(): GameState {
return this.state;
}

public getAnnualReport(): AnnualReport {
return createAnnualReport(this.state);
}

public processTurn(command: TurnCommand): TurnOutcome {
const outcome = processTurn(this.state, command, this.config);

this.state = outcome.nextState;

return outcome;
}
}
