import { describe, expect, it } from 'vitest';
import { game_version } from '../version';
import { runScriptedHeadlessGame } from './scripted-game-runner';

describe('runScriptedHeadlessGame', () => {
  it('returns readable headless log lines', () => {
    const lines = runScriptedHeadlessGame();

    expect(lines).toContain('[headless] starting scripted simulation');
    expect(lines).toContain(`[headless] game version ${game_version}`);
    expect(lines).toContain('[headless] Year 1 report');
    expect(lines).toContain('[headless] command');
    expect(lines).toContain('[headless] next year: 2');
    expect(lines).toContain('[headless] next population: 100');
    expect(lines).toContain('[headless] next acres: 1000');
    expect(lines).toContain('[headless] next grain: 1800');
    expect(lines).toContain('[headless] scripted simulation complete');
  });
});