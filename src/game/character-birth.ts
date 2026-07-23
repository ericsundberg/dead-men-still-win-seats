import { createGameCharacter, type CharacterId, type GameCharacter } from './game-character';
import type { RulerGender } from './ruler-profile';

export interface CharacterBirthInput {
  readonly id: CharacterId;
  readonly givenName: string;
  readonly familyName: string;
  readonly birthYear: number;
  readonly birthOrder: number;
  readonly parent: GameCharacter;
  readonly gender?: RulerGender;
  readonly motherId?: CharacterId | null;
  readonly fatherId?: CharacterId | null;
  readonly bornToCharacterId?: CharacterId | null;
}

export function createChildCharacter(input: CharacterBirthInput): GameCharacter {
  const parentLinks = getDefaultParentLinks(input.parent);

  return createGameCharacter({
    id: input.id,
    givenName: input.givenName,
    familyName: input.familyName,
    startingAge: 0,
    startingYear: input.birthYear,
    gender: input.gender ?? 'unspecified',
    isRuler: false,
    reignStartYear: null,
    motherId: input.motherId ?? parentLinks.motherId,
    fatherId: input.fatherId ?? parentLinks.fatherId,
    bornToCharacterId: input.bornToCharacterId ?? input.parent.id,
    birthOrder: input.birthOrder,
  });
}

function getDefaultParentLinks(
  parent: GameCharacter,
): Pick<GameCharacter, 'motherId' | 'fatherId'> {
  if (parent.gender === 'woman') {
    return {
      motherId: parent.id,
      fatherId: null,
    };
  }

  if (parent.gender === 'man') {
    return {
      motherId: null,
      fatherId: parent.id,
    };
  }

  return {
    motherId: null,
    fatherId: null,
  };
}