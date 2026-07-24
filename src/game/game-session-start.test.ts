import { beforeEach, describe, expect, it } from 'vitest';
import { loadTestLocalization } from '../test/test-localization';
import {
  calculateBaseCharacterHealth,
  childCharacterHealth,
  primeCharacterHealth,
} from './character-health';
import {
  startingHeirCharacterId,
  startingRulerCharacterId,
} from './game-character';
import { createGameSession } from './game-session';

describe('GameSession start', () => {
  beforeEach(loadTestLocalization);

  it('starts without an active game', () => {
    const gameSession = createGameSession();

    expect(gameSession.hasActiveGame()).toBe(false);
    expect(gameSession.getStatus()).toBe('not-started');
    expect(gameSession.isGameOver()).toBe(false);
    expect(gameSession.getGameOverState()).toBeNull();
    expect(gameSession.getState()).toBeNull();
    expect(gameSession.getAnnualReport()).toBeNull();
    expect(gameSession.getLastOutcome()).toBeNull();
    expect(gameSession.getSuggestedTurnCommand()).toBeNull();
    expect(gameSession.getCharacters()).toEqual([]);
    expect(gameSession.getCurrentRuler()).toBeNull();
    expect(gameSession.getHeir()).toBeNull();
    expect(gameSession.getRulerProfile()).toBeNull();
    expect(gameSession.getRulerAge()).toBeNull();
    expect(gameSession.getRulerHealth()).toBeNull();
    expect(gameSession.getRulerReignYear()).toBeNull();
    expect(gameSession.getGameStartYear()).toBe(1);
  });

  it('starts a normalized game with a generated child heir', () => {
    const gameSession = createGameSession();

    gameSession.startNewGame({
      givenName: '  Ashurbanipal  ',
      familyName: '  Sargonid  ',
      startingAge: 31,
      gender: 'man',
    });

    expect(gameSession.hasActiveGame()).toBe(true);
    expect(gameSession.getStatus()).toBe('active');
    expect(gameSession.isGameOver()).toBe(false);
    expect(gameSession.getState()?.playerName).toBe(
      'Ashurbanipal Sargonid',
    );

    expect(gameSession.getCurrentRuler()).toEqual({
      id: startingRulerCharacterId,
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      startingYear: 1,
      gender: 'man',
      health: calculateBaseCharacterHealth(31),
      isRuler: true,
      reignStartYear: 1,
      motherId: null,
      fatherId: null,
      bornToCharacterId: null,
      birthOrder: 0,
    });

    expect(gameSession.getHeir()).toEqual({
      id: startingHeirCharacterId,
      givenName: 'Child',
      familyName: 'Sargonid',
      startingAge: 0,
      startingYear: 1,
      gender: 'unspecified',
      health: childCharacterHealth,
      isRuler: false,
      reignStartYear: null,
      motherId: null,
      fatherId: startingRulerCharacterId,
      bornToCharacterId: startingRulerCharacterId,
      birthOrder: 1,
    });

    expect(gameSession.getCharacters()).toHaveLength(2);
    expect(gameSession.getRulerProfile()).toEqual({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });
    expect(gameSession.getRulerAge()).toBe(31);
    expect(gameSession.getRulerHealth()).toBe(
      calculateBaseCharacterHealth(31),
    );
    expect(gameSession.getRulerReignYear()).toBe(1);
    expect(gameSession.getAnnualReport()?.year).toBe(1);
  });

  it('keeps string startNewGame compatibility', () => {
    const gameSession = createGameSession();

    gameSession.startNewGame('Tester');

    expect(gameSession.hasActiveGame()).toBe(true);
    expect(gameSession.getState()?.playerName).toBe('Tester House');
    expect(gameSession.getRulerProfile()).toEqual({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });
    expect(gameSession.getCurrentRulerName()).toBe('Tester House');
    expect(gameSession.getRulerAge()).toBe(25);
    expect(gameSession.getRulerHealth()).toBe(primeCharacterHealth);
    expect(gameSession.getRulerReignYear()).toBe(1);
  });
});