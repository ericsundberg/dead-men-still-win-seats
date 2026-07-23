import { defaultGameConfig } from '../content/default-game-config';
import { GameEngine } from '../core/game-engine';
import type { AnnualReport, TurnCommand, TurnOutcome } from '../core/types';
import { game_version } from '../version';

export function runScriptedHeadlessGame(): readonly string[] {
  const engine = new GameEngine(defaultGameConfig, 'Headless Tester');

  const firstCommand: TurnCommand = {
    acresToBuy: 0,
    acresToSell: 0,
    grainToFeed: 2000,
    acresToPlant: 500,
  };

  const lines: string[] = [];

  lines.push('[headless] starting scripted simulation');
  lines.push(`[headless] game version ${game_version}`);
  lines.push('');

  appendReport(lines, engine.getAnnualReport());
  appendCommand(lines, firstCommand);

  const outcome = engine.processTurn(firstCommand);

  appendOutcome(lines, outcome);
  lines.push('');
  appendReport(lines, engine.getAnnualReport());
  lines.push('[headless] scripted simulation complete');

  return lines;
}

function appendReport(lines: string[], report: AnnualReport): void {
  for (const line of report.lines) {
    lines.push(`[headless] ${line}`);
  }
}

function appendCommand(lines: string[], command: TurnCommand): void {
  lines.push('[headless] command');
  lines.push(`[headless] acres to buy: ${command.acresToBuy}`);
  lines.push(`[headless] acres to sell: ${command.acresToSell}`);
  lines.push(`[headless] grain to feed: ${command.grainToFeed}`);
  lines.push(`[headless] acres to plant: ${command.acresToPlant}`);
}

function appendOutcome(lines: string[], outcome: TurnOutcome): void {
  lines.push('[headless] outcome');

  for (const event of outcome.events) {
    lines.push(`[headless] ${event}`);
  }

  lines.push(`[headless] next year: ${outcome.nextState.year}`);
  lines.push(`[headless] next population: ${outcome.nextState.population}`);
  lines.push(`[headless] next acres: ${outcome.nextState.acres}`);
  lines.push(`[headless] next grain: ${outcome.nextState.grain}`);
}