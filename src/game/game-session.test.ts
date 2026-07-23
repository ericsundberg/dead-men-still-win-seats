import { describe, expect, it } from 'vitest';
import {
  calculateBaseCharacterHealth,
  childCharacterHealth,
  primeCharacterHealth,
} from './character-health';
import {
  defaultCharacterHealth,
  startingHeirCharacterId,
  startingRulerCharacterId,
} from './game-character';
import { createGameSession } from './game-session';

describe('GameSession', () => {
  it('starts without an active game', () => {
    const session = createGameSession();

    expect(session.hasActiveGame()).toBe(false);
    expect(session.getStatus()).toBe('not-started');
    expect(session.isGameOver()).toBe(false);
    expect(session.getGameOverState()).toBeNull();
    expect(session.getState()).toBeNull();
    expect(session.getAnnualReport()).toBeNull();
    expect(session.getLastOutcome()).toBeNull();
    expect(session.getSuggestedTurnCommand()).toBeNull();
    expect(session.getCharacters()).toEqual([]);
    expect(session.getCurrentRuler()).toBeNull();
    expect(session.getHeir()).toBeNull();
    expect(session.getRulerProfile()).toBeNull();
    expect(session.getRulerAge()).toBeNull();
    expect(session.getRulerHealth()).toBeNull();
    expect(session.getRulerReignYear()).toBeNull();
    expect(session.getGameStartYear()).toBe(1);
  });

  it('starts a new game with a normalized ruler and generated child heir', () => {
    const session = createGameSession();

    session.startNewGame({
      givenName: '  Ashurbanipal  ',
      familyName: '  Sargonid  ',
      startingAge: 31,
      gender: 'man',
    });

    expect(session.hasActiveGame()).toBe(true);
    expect(session.getStatus()).toBe('active');
    expect(session.isGameOver()).toBe(false);
    expect(session.getState()?.playerName).toBe('Ashurbanipal Sargonid');
    expect(session.getCurrentRuler()).toEqual({
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
    expect(session.getHeir()).toEqual({
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
    expect(session.getCharacters()).toHaveLength(2);
    expect(session.getRulerProfile()).toEqual({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });
    expect(session.getRulerAge()).toBe(31);
    expect(session.getRulerHealth()).toBe(calculateBaseCharacterHealth(31));
    expect(session.getRulerReignYear()).toBe(1);
    expect(session.getAnnualReport()?.year).toBe(1);
  });

  it('can add multiple children to the current ruler', () => {
    const session = createGameSession();

    session.startNewGame({
      givenName: 'Ruler',
      familyName: 'House',
      startingAge: 30,
      gender: 'woman',
    });

    const firstChild = session.addChildToCurrentRuler({
      givenName: 'Older Daughter',
      gender: 'woman',
    });
    const secondChild = session.addChildToCurrentRuler({
      givenName: 'Younger Son',
      gender: 'man',
    });

    expect(firstChild?.motherId).toBe(startingRulerCharacterId);
    expect(firstChild?.fatherId).toBeNull();
    expect(firstChild?.birthOrder).toBe(2);
    expect(secondChild?.motherId).toBe(startingRulerCharacterId);
    expect(secondChild?.gender).toBe('man');
    expect(secondChild?.birthOrder).toBe(3);
    expect(session.getCharacters()).toHaveLength(4);
  });

  it('selects the oldest living male heir before women and others', () => {
    const session = createGameSession(() => 1);

    session.startNewGame({
      givenName: 'Ruler',
      familyName: 'House',
      startingAge: 30,
      gender: 'woman',
    });

    session.addChildToCurrentRuler({
      givenName: 'Older Daughter',
      gender: 'woman',
    });
    session.addChildToCurrentRuler({
      givenName: 'Younger Son',
      gender: 'man',
    });

    session.damageCurrentRulerHealth(6);

    expect(session.getCurrentRulerName()).toBe('Younger Son House');
    expect(session.getCurrentRuler()?.gender).toBe('man');
  });

  it('uses women before unspecified heirs when no male heir lives', () => {
    const session = createGameSession(() => 1);

    session.startNewGame({
      givenName: 'Ruler',
      familyName: 'House',
      startingAge: 30,
      gender: 'woman',
    });

    session.addChildToCurrentRuler({
      givenName: 'Daughter',
      gender: 'woman',
    });

    session.damageCurrentRulerHealth(6);

    expect(session.getCurrentRulerName()).toBe('Daughter House');
    expect(session.getCurrentRuler()?.gender).toBe('woman');
  });

  it('keeps string startNewGame compatibility for simple callers', () => {
    const session = createGameSession();

    session.startNewGame('Tester');

    expect(session.hasActiveGame()).toBe(true);
    expect(session.getState()?.playerName).toBe('Tester House');
    expect(session.getRulerProfile()).toEqual({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });
    expect(session.getCurrentRulerName()).toBe('Tester House');
    expect(session.getRulerAge()).toBe(25);
    expect(session.getRulerHealth()).toBe(primeCharacterHealth);
    expect(session.getRulerReignYear()).toBe(1);
  });

  it('creates a suggested opening turn command', () => {
    const session = createGameSession();

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    expect(defaultCharacterHealth).toBe(primeCharacterHealth);
    expect(session.getSuggestedTurnCommand()).toEqual({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 800,
    });
  });

  it('processes a turn and advances ruler age and reign year', () => {
    const session = createGameSession(() => 1);

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    const outcome = session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 500,
    });

    expect(outcome?.nextState.year).toBe(2);
    expect(session.getState()?.year).toBe(2);
    expect(session.getLastOutcome()).toBe(outcome);
    expect(session.getStatus()).toBe('active');
    expect(session.getRulerAge()).toBe(26);
    expect(session.getRulerReignYear()).toBe(2);
    expect(session.getRulerHealth()).toBe(5);
  });

  it('can apply natural health decline when the annual roll succeeds', () => {
    const session = createGameSession(() => 0);

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 500,
    });

    expect(session.getRulerAge()).toBe(26);
    expect(session.getRulerHealth()).toBe(4.9);
  });

  it('does not apply natural health decline when the annual roll fails', () => {
    const session = createGameSession(() => 0.99);

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 500,
    });

    expect(session.getRulerAge()).toBe(26);
    expect(session.getRulerHealth()).toBe(5);
  });

  it('does not trigger succession when ruler health is exactly zero', () => {
    const session = createGameSession();

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    session.damageCurrentRulerHealth(5);

    expect(session.getCurrentRuler()?.id).toBe(startingRulerCharacterId);
    expect(session.getCurrentRuler()?.health).toBe(0);
    expect(session.getHeir()?.id).toBe(startingHeirCharacterId);
  });

  it('transfers rulership and creates a new child for the new ruler', () => {
    const session = createGameSession(() => 1);

    session.startNewGame({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });

    session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 500,
    });

    session.damageCurrentRulerHealth(6);

    expect(session.getCurrentRuler()).toMatchObject({
      id: startingHeirCharacterId,
      givenName: 'Child',
      familyName: 'Sargonid',
      isRuler: true,
      reignStartYear: 2,
    });
    expect(session.getHeir()).toMatchObject({
      id: 'character-child-2',
      givenName: 'Child',
      familyName: 'Sargonid',
      startingAge: 0,
      startingYear: 2,
      health: childCharacterHealth,
      isRuler: false,
      reignStartYear: null,
    });
    expect(session.getRulerAge()).toBe(1);
    expect(session.getRulerHealth()).toBe(childCharacterHealth);
    expect(session.getRulerReignYear()).toBe(1);
  });

  it('does not trigger natural succession when ruler health reaches exactly zero at age 85', () => {
    const session = createGameSession(() => 0.99);

    session.startNewGame({
      givenName: 'Elder',
      familyName: 'House',
      startingAge: 84,
      gender: 'unspecified',
    });

    session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 500,
    });

    expect(session.getCurrentRuler()?.id).toBe(startingRulerCharacterId);
    expect(session.getRulerAge()).toBe(85);
    expect(session.getRulerHealth()).toBe(0);
    expect(session.getRulerReignYear()).toBe(2);
  });

  it('transfers rulership through natural aging after age 85', () => {
    const session = createGameSession(() => 0.99);

    session.startNewGame({
      givenName: 'Elder',
      familyName: 'House',
      startingAge: 85,
      gender: 'unspecified',
    });

    session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 2000,
      acresToPlant: 500,
    });

    expect(session.getCurrentRuler()?.id).toBe(startingHeirCharacterId);
    expect(session.getCurrentRulerName()).toBe('Child House');
    expect(session.getRulerAge()).toBe(1);
    expect(session.getRulerHealth()).toBe(childCharacterHealth);
    expect(session.getRulerReignYear()).toBe(1);
  });

  it('ends the game when population reaches zero', () => {
    const session = createGameSession();

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    const outcome = session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 0,
      acresToPlant: 0,
    });

    expect(outcome?.nextState.population).toBe(0);
    expect(session.getStatus()).toBe('ended');
    expect(session.isGameOver()).toBe(true);
    expect(session.getGameOverState()).toEqual({
      reason: 'population-collapse',
      title: 'Dynasty Collapsed',
      message: 'There are no people left to rule. Your reign has ended.',
    });
    expect(session.getSuggestedTurnCommand()).toBeNull();
  });

  it('does not process additional turns after the game ends', () => {
    const session = createGameSession();

    session.startNewGame({
      givenName: 'Tester',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });

    session.processTurn({
      acresToBuy: 0,
      acresToSell: 0,
      grainToFeed: 0,
      acresToPlant: 0,
    });

    const stateAfterGameOver = session.getState();

    expect(
      session.processTurn({
        acresToBuy: 0,
        acresToSell: 0,
        grainToFeed: 0,
        acresToPlant: 0,
      }),
    ).toBeNull();

    expect(session.getState()).toEqual(stateAfterGameOver);
  });

  it('returns null when processing a turn before a game starts', () => {
    const session = createGameSession();

    expect(
      session.processTurn({
        acresToBuy: 0,
        acresToSell: 0,
        grainToFeed: 0,
        acresToPlant: 0,
      }),
    ).toBeNull();
  });
});