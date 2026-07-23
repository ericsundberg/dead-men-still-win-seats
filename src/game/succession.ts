import type { GameState } from '../core/types';
import { getCurrentAge } from './game-calendar';
import { isCharacterDead, type GameCharacter } from './game-character';
import type { RulerGender } from './ruler-profile';

export function selectNextRuler(
  characters: readonly GameCharacter[],
  currentRuler: GameCharacter,
  state: GameState,
): GameCharacter | null {
  const candidates = characters
    .filter((character) => isSuccessionCandidate(character, currentRuler))
    .map((character) => ({
      character,
      age: getCurrentAge(character, state),
      genderPriority: getSuccessionGenderPriority(character.gender),
    }))
    .sort((left, right) => {
      if (left.genderPriority !== right.genderPriority) {
        return left.genderPriority - right.genderPriority;
      }

      if (left.age !== right.age) {
        return right.age - left.age;
      }

      if (left.character.birthOrder !== right.character.birthOrder) {
        return left.character.birthOrder - right.character.birthOrder;
      }

      return left.character.id.localeCompare(right.character.id);
    });

  return candidates[0]?.character ?? null;
}

export function isSuccessionCandidate(
  character: GameCharacter,
  currentRuler: GameCharacter,
): boolean {
  return character.id !== currentRuler.id &&
    !character.isRuler &&
    !isCharacterDead(character);
}

export function getSuccessionGenderPriority(gender: RulerGender): number {
  if (gender === 'man') {
    return 0;
  }

  if (gender === 'woman') {
    return 1;
  }

  if (gender === 'nonbinary') {
    return 2;
  }

  return 3;
}