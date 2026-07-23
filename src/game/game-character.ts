import {
  calculateBaseCharacterHealth,
  roundHealth,
} from './character-health';
import { gameStartYear } from './game-calendar';
import {
  createRulerProfile,
  defaultRulerProfile,
  type RulerCreationInput,
  type RulerGender,
  type RulerProfile,
} from './ruler-profile';

export type CharacterId = string;

export interface GameCharacter {
  readonly id: CharacterId;
  readonly givenName: string;
  readonly familyName: string;
  readonly startingAge: number;
  readonly startingYear: number;
  readonly gender: RulerGender;
  readonly health: number;
  readonly isRuler: boolean;
  readonly reignStartYear: number | null;
  readonly motherId: CharacterId | null;
  readonly fatherId: CharacterId | null;
  readonly bornToCharacterId: CharacterId | null;
  readonly birthOrder: number;
}

export interface GameCharacterCreationInput extends RulerCreationInput {
  readonly id: CharacterId;
  readonly startingYear: number;
  readonly health: number;
  readonly isRuler: boolean;
  readonly reignStartYear: number | null;
  readonly motherId: CharacterId | null;
  readonly fatherId: CharacterId | null;
  readonly bornToCharacterId: CharacterId | null;
  readonly birthOrder: number;
}

export const defaultCharacterHealth = calculateBaseCharacterHealth(25);
export const startingRulerCharacterId = 'character-ruler';
export const startingHeirCharacterId = 'character-heir';

export function createGameCharacter(
  input: Partial<GameCharacterCreationInput> & Pick<GameCharacterCreationInput, 'id'>,
): GameCharacter {
  const profile = createRulerProfile(input);
  const startingAge = normalizeCharacterStartingAge(input.startingAge);

  return {
    id: input.id,
    givenName: profile.givenName,
    familyName: profile.familyName,
    startingAge,
    startingYear: normalizeCharacterStartingYear(input.startingYear),
    gender: profile.gender,
    health: normalizeHealth(
      input.health ?? calculateBaseCharacterHealth(startingAge),
    ),
    isRuler: input.isRuler ?? false,
    reignStartYear: input.reignStartYear ?? null,
    motherId: input.motherId ?? null,
    fatherId: input.fatherId ?? null,
    bornToCharacterId: input.bornToCharacterId ?? null,
    birthOrder: normalizeBirthOrder(input.birthOrder),
  };
}

export function createStartingRulerCharacter(
  rulerProfile: RulerProfile,
  reignStartYear: number,
): GameCharacter {
  return createGameCharacter({
    id: startingRulerCharacterId,
    givenName: rulerProfile.givenName,
    familyName: rulerProfile.familyName,
    startingAge: rulerProfile.startingAge,
    startingYear: gameStartYear,
    gender: rulerProfile.gender,
    isRuler: true,
    reignStartYear,
    motherId: null,
    fatherId: null,
    bornToCharacterId: null,
    birthOrder: 0,
  });
}

export function createStartingHeirCharacter(
  givenName: string,
  familyName: string,
): GameCharacter {
  return createGameCharacter({
    id: startingHeirCharacterId,
    givenName,
    familyName,
    startingAge: 0,
    startingYear: gameStartYear,
    gender: 'unspecified',
    isRuler: false,
    reignStartYear: null,
    motherId: null,
    fatherId: null,
    bornToCharacterId: startingRulerCharacterId,
    birthOrder: 1,
  });
}

export function formatCharacterName(character: GameCharacter): string {
  return `${character.givenName} ${character.familyName}`;
}

export function toRulerProfile(character: GameCharacter): RulerProfile {
  return {
    givenName: character.givenName,
    familyName: character.familyName,
    startingAge: character.startingAge,
    gender: character.gender,
  };
}

export function updateCharacterHealth(
  character: GameCharacter,
  health: number,
): GameCharacter {
  return {
    ...character,
    health: normalizeHealth(health),
  };
}

export function setCharacterRulership(
  character: GameCharacter,
  isRuler: boolean,
  reignStartYear: number | null,
): GameCharacter {
  return {
    ...character,
    isRuler,
    reignStartYear,
  };
}

export function isCharacterDead(character: GameCharacter): boolean {
  return character.health < 0;
}

function normalizeCharacterStartingAge(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultRulerProfile.startingAge;
  }

  const wholeAge = Math.floor(value);

  return Math.min(99, Math.max(0, wholeAge));
}

function normalizeCharacterStartingYear(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return gameStartYear;
  }

  return Math.max(gameStartYear, Math.floor(value));
}

function normalizeBirthOrder(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeHealth(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return calculateBaseCharacterHealth(defaultRulerProfile.startingAge);
  }

  return roundHealth(value);
}