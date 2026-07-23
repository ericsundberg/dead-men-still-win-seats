import type { SceneContext } from '../../app/scene-router';
import type { GameState } from '../../core/types';
import { formatCharacterHealth } from '../../game/character-health';
import {
  type RulerGender,
} from '../../game/ruler-profile';
import { text, type LocalizedTextKey } from '../../localization/localized-text';
import { makeElement } from '../../ui/dom-helpers';

const genderTextKeys = {
  unspecified: 'gameSetup.genderUnspecified',
  woman: 'gameSetup.genderWoman',
  man: 'gameSetup.genderMan',
  nonbinary: 'gameSetup.genderNonbinary',
} as const satisfies Record<RulerGender, LocalizedTextKey>;

export function makeRulerStatsLine(
  context: SceneContext,
  state: GameState,
): HTMLElement {
  const rulerName = context.game.getCurrentRulerName() ?? state.playerName;
  const rulerAge = context.game.getRulerAge();
  const rulerHealth = context.game.getRulerHealth();
  const rulerProfile = context.game.getRulerProfile();

  return makeElement('p', {
    className: 'scene-description',
    textContent: formatRulerStatsText({
      rulerName,
      age: rulerAge,
      gender: rulerProfile?.gender ?? null,
      health: rulerHealth,
    }),
  });
}

interface RulerStatsTextInput {
  readonly rulerName: string;
  readonly age: number | null;
  readonly gender: RulerGender | null;
  readonly health: number | null;
}

function formatRulerStatsText(input: RulerStatsTextInput): string {
  const ageText = input.age?.toString() ?? text('rulerStats.unknownValue');
  const genderText = input.gender
    ? text(genderTextKeys[input.gender])
    : text('rulerStats.unknownValue');
  const healthText = input.health === null
    ? text('rulerStats.unknownValue')
    : formatCharacterHealth(input.health);

  return `${text('rulerStats.rulerLabel')}: ${input.rulerName} | ${text('rulerStats.ageLabel')}: ${ageText} | ${text('rulerStats.genderLabel')}: ${genderText} | ${text('rulerStats.healthLabel')}: ${healthText}`;
}