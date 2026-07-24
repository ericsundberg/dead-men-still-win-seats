import type { TurnCommand } from '../core/types';
import {
  createGameSession,
  type GameSession,
} from '../game/game-session';
import type { RulerGender } from '../game/ruler-profile';

export const standardTurnCommand: TurnCommand = {
  acresToBuy: 0,
  acresToSell: 0,
  grainToFeed: 2000,
  acresToPlant: 500,
};

export const populationCollapseTurnCommand: TurnCommand = {
  acresToBuy: 0,
  acresToSell: 0,
  grainToFeed: 0,
  acresToPlant: 0,
};

export interface StartedGameSessionOptions {
  readonly givenName?: string;
  readonly familyName?: string;
  readonly startingAge?: number;
  readonly gender?: RulerGender;
  readonly random?: () => number;
}

export function createStartedGameSession(
  options: StartedGameSessionOptions = {},
): GameSession {
  const gameSession = createGameSession(
    options.random ?? (() => 1),
  );

  gameSession.startNewGame({
    givenName: options.givenName ?? 'Tester',
    familyName: options.familyName ?? 'House',
    startingAge: options.startingAge ?? 25,
    gender: options.gender ?? 'unspecified',
  });

  return gameSession;
}