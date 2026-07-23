import { describe, expect, it } from 'vitest';
import { childCharacterHealth } from './character-health';
import { createChildCharacter } from './character-birth';
import { createGameCharacter } from './game-character';

describe('character birth', () => {
  it('creates a child born to a male parent as father', () => {
    const parent = createGameCharacter({
      id: 'parent',
      givenName: 'Parent',
      familyName: 'House',
      startingAge: 30,
      gender: 'man',
    });

    const child = createChildCharacter({
      id: 'child',
      givenName: 'Child',
      familyName: 'House',
      birthYear: 8,
      birthOrder: 3,
      parent,
    });

    expect(child).toEqual({
      id: 'child',
      givenName: 'Child',
      familyName: 'House',
      startingAge: 0,
      startingYear: 8,
      gender: 'unspecified',
      health: childCharacterHealth,
      isRuler: false,
      reignStartYear: null,
      motherId: null,
      fatherId: 'parent',
      bornToCharacterId: 'parent',
      birthOrder: 3,
    });
  });

  it('creates a child born to a female parent as mother', () => {
    const parent = createGameCharacter({
      id: 'parent',
      givenName: 'Parent',
      familyName: 'House',
      startingAge: 30,
      gender: 'woman',
    });

    const child = createChildCharacter({
      id: 'child',
      givenName: 'Child',
      familyName: 'House',
      birthYear: 8,
      birthOrder: 3,
      parent,
      gender: 'man',
    });

    expect(child.motherId).toBe('parent');
    expect(child.fatherId).toBeNull();
    expect(child.gender).toBe('man');
  });

  it('allows explicit mother and father ids', () => {
    const parent = createGameCharacter({
      id: 'dynastic-parent',
      givenName: 'Parent',
      familyName: 'House',
      startingAge: 30,
      gender: 'unspecified',
    });

    const child = createChildCharacter({
      id: 'child',
      givenName: 'Child',
      familyName: 'House',
      birthYear: 8,
      birthOrder: 3,
      parent,
      motherId: 'mother',
      fatherId: 'father',
      bornToCharacterId: 'dynastic-parent',
    });

    expect(child.motherId).toBe('mother');
    expect(child.fatherId).toBe('father');
    expect(child.bornToCharacterId).toBe('dynastic-parent');
  });
});