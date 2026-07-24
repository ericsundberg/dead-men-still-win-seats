import { beforeEach, describe, expect, it } from 'vitest';
import {
  createStartedGameSession,
  standardTurnCommand,
} from '../test/game-session-fixtures';
import { loadTestLocalization } from '../test/test-localization';
import { childCharacterHealth } from './character-health';
import {
  startingHeirCharacterId,
  startingRulerCharacterId,
} from './game-character';

describe('GameSession succession', () => {
  beforeEach(loadTestLocalization);

  it('selects the oldest living male heir first', () => {
    const gameSession = createStartedGameSession({
      givenName: 'Ruler',
      gender: 'woman',
    });

    gameSession.addChildToCurrentRuler({
      givenName: 'Older Daughter',
      gender: 'woman',
    });

    gameSession.addChildToCurrentRuler({
      givenName: 'Younger Son',
      gender: 'man',
    });

    gameSession.damageCurrentRulerHealth(6);

    expect(gameSession.getCurrentRulerName()).toBe(
      'Younger Son House',
    );
    expect(gameSession.getCurrentRuler()?.gender).toBe('man');
  });

  it('uses women before unspecified heirs', () => {
    const gameSession = createStartedGameSession({
      givenName: 'Ruler',
      gender: 'woman',
    });

    gameSession.addChildToCurrentRuler({
      givenName: 'Daughter',
      gender: 'woman',
    });

    gameSession.damageCurrentRulerHealth(6);

    expect(gameSession.getCurrentRulerName()).toBe(
      'Daughter House',
    );
    expect(gameSession.getCurrentRuler()?.gender).toBe('woman');
  });

  it('does not trigger succession at exactly zero health', () => {
    const gameSession = createStartedGameSession();

    gameSession.damageCurrentRulerHealth(5);

    expect(gameSession.getCurrentRuler()?.id).toBe(
      startingRulerCharacterId,
    );
    expect(gameSession.getCurrentRuler()?.health).toBe(0);
    expect(gameSession.getHeir()?.id).toBe(
      startingHeirCharacterId,
    );
  });

  it('transfers rulership and creates a new child', () => {
    const gameSession = createStartedGameSession({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });

    gameSession.processTurn(standardTurnCommand);
    gameSession.damageCurrentRulerHealth(6);

    expect(gameSession.getCurrentRuler()).toMatchObject({
      id: startingHeirCharacterId,
      givenName: 'Child',
      familyName: 'Sargonid',
      isRuler: true,
      reignStartYear: 2,
    });

    expect(gameSession.getHeir()).toMatchObject({
      id: 'character-child-2',
      givenName: 'Child',
      familyName: 'Sargonid',
      startingAge: 0,
      startingYear: 2,
      health: childCharacterHealth,
      isRuler: false,
      reignStartYear: null,
    });

    expect(gameSession.getRulerAge()).toBe(1);
    expect(gameSession.getRulerHealth()).toBe(
      childCharacterHealth,
    );
    expect(gameSession.getRulerReignYear()).toBe(1);
  });

  it('does not trigger natural succession at zero health', () => {
    const gameSession = createStartedGameSession({
      givenName: 'Elder',
      startingAge: 84,
      random: () => 0.99,
    });

    gameSession.processTurn(standardTurnCommand);

    expect(gameSession.getCurrentRuler()?.id).toBe(
      startingRulerCharacterId,
    );
    expect(gameSession.getRulerAge()).toBe(85);
    expect(gameSession.getRulerHealth()).toBe(0);
    expect(gameSession.getRulerReignYear()).toBe(2);
  });

  it('transfers rulership through natural aging after age 85', () => {
    const gameSession = createStartedGameSession({
      givenName: 'Elder',
      startingAge: 85,
      random: () => 0.99,
    });

    gameSession.processTurn(standardTurnCommand);

    expect(gameSession.getCurrentRuler()?.id).toBe(
      startingHeirCharacterId,
    );
    expect(gameSession.getCurrentRulerName()).toBe('Child House');
    expect(gameSession.getRulerAge()).toBe(1);
    expect(gameSession.getRulerHealth()).toBe(
      childCharacterHealth,
    );
    expect(gameSession.getRulerReignYear()).toBe(1);
  });
});