import { beforeEach, describe, expect, it } from 'vitest';
import { createStartedGameSession } from '../test/game-session-fixtures';
import { loadTestLocalization } from '../test/test-localization';
import { startingRulerCharacterId } from './game-character';

describe('GameSession children', () => {
  beforeEach(loadTestLocalization);

  it('adds multiple children to the current ruler', () => {
    const gameSession = createStartedGameSession({
      givenName: 'Ruler',
      gender: 'woman',
    });

    const firstChild = gameSession.addChildToCurrentRuler({
      givenName: 'Older Daughter',
      gender: 'woman',
    });

    const secondChild = gameSession.addChildToCurrentRuler({
      givenName: 'Younger Son',
      gender: 'man',
    });

    expect(firstChild?.motherId).toBe(startingRulerCharacterId);
    expect(firstChild?.fatherId).toBeNull();
    expect(firstChild?.birthOrder).toBe(2);

    expect(secondChild?.motherId).toBe(startingRulerCharacterId);
    expect(secondChild?.gender).toBe('man');
    expect(secondChild?.birthOrder).toBe(3);

    expect(gameSession.getCharacters()).toHaveLength(4);
  });
});