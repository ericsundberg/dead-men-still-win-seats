import { describe, expect, it } from 'vitest';
import {
  calculateBaseCharacterHealth,
  childCharacterHealth,
  primeCharacterHealth,
} from './character-health';
import {
  createGameCharacter,
  createStartingHeirCharacter,
  createStartingRulerCharacter,
  defaultCharacterHealth,
  formatCharacterName,
  isCharacterDead,
  setCharacterRulership,
  startingHeirCharacterId,
  startingRulerCharacterId,
  toRulerProfile,
  updateCharacterHealth,
} from './game-character';

describe('game character', () => {
  it('creates a normalized game character with age-based health by default', () => {
    const character = createGameCharacter({
      id: 'character-test',
      givenName: '  Ashurbanipal  ',
      familyName: '  Sargonid  ',
      startingAge: 31.9,
      startingYear: 2.9,
      gender: 'man',
      isRuler: true,
      reignStartYear: 1,
      birthOrder: 4.9,
    });

    expect(character).toEqual({
      id: 'character-test',
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      startingYear: 2,
      gender: 'man',
      health: calculateBaseCharacterHealth(31),
      isRuler: true,
      reignStartYear: 1,
      motherId: null,
      fatherId: null,
      bornToCharacterId: null,
      birthOrder: 4,
    });
  });

  it('allows explicit health overrides rounded to one decimal', () => {
    const character = createGameCharacter({
      id: 'character-test',
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
      health: 3.75,
    });

    expect(character.health).toBe(3.8);
  });

  it('creates a starting ruler character', () => {
    const character = createStartingRulerCharacter({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 25,
      gender: 'man',
    }, 1);

    expect(character).toEqual({
      id: startingRulerCharacterId,
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 25,
      startingYear: 1,
      gender: 'man',
      health: primeCharacterHealth,
      isRuler: true,
      reignStartYear: 1,
      motherId: null,
      fatherId: null,
      bornToCharacterId: null,
      birthOrder: 0,
    });
    expect(defaultCharacterHealth).toBe(primeCharacterHealth);
  });

  it('creates a starting heir character', () => {
    const character = createStartingHeirCharacter('Child', 'Sargonid');

    expect(character).toEqual({
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
      fatherId: null,
      bornToCharacterId: startingRulerCharacterId,
      birthOrder: 1,
    });
  });

  it('formats character names and ruler profile compatibility', () => {
    const character = createGameCharacter({
      id: 'character-test',
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });

    expect(formatCharacterName(character)).toBe('Ashurbanipal Sargonid');
    expect(toRulerProfile(character)).toEqual({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });
  });

  it('tracks health and death below zero', () => {
    const character = createGameCharacter({
      id: 'character-test',
      health: 0,
    });

    expect(isCharacterDead(character)).toBe(false);
    expect(isCharacterDead(updateCharacterHealth(character, -0.1))).toBe(true);
  });

  it('updates rulership state', () => {
    const character = createStartingHeirCharacter('Child', 'Sargonid');

    expect(setCharacterRulership(character, true, 8)).toEqual({
      ...character,
      isRuler: true,
      reignStartYear: 8,
    });
  });
});