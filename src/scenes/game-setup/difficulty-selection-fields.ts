import {
  defaultGameDifficultyId,
  gameDifficultyIds,
  gameDifficultySettings,
  type GameDifficultyId,
} from '../../game/difficulty';
import { text, type LocalizedTextKey } from '../../localization/localized-text';
import { makeElement } from '../../ui/dom-helpers';

const difficultyTextKeys = {
  easy: {
    label: 'gameSetup.difficulty.easy.label',
    duration: 'gameSetup.difficulty.easy.duration',
    description: 'gameSetup.difficulty.easy.description',
  },
  moderate: {
    label: 'gameSetup.difficulty.moderate.label',
    duration: 'gameSetup.difficulty.moderate.duration',
    description: 'gameSetup.difficulty.moderate.description',
  },
  hardliner: {
    label: 'gameSetup.difficulty.hardliner.label',
    duration: 'gameSetup.difficulty.hardliner.duration',
    description: 'gameSetup.difficulty.hardliner.description',
  },
  'far-gone': {
    label: 'gameSetup.difficulty.farGone.label',
    duration: 'gameSetup.difficulty.farGone.duration',
    description: 'gameSetup.difficulty.farGone.description',
  },
} as const satisfies Record<
  GameDifficultyId,
  {
    readonly label: LocalizedTextKey;
    readonly duration: LocalizedTextKey;
    readonly description: LocalizedTextKey;
  }
>;

export interface DifficultySelectionFields {
  readonly element: HTMLElement;
  readonly getSelectedDifficulty: () => GameDifficultyId;
}

export function createDifficultySelectionFields(
  initialDifficultyId: GameDifficultyId = defaultGameDifficultyId,
): DifficultySelectionFields {
  let selectedDifficultyId = initialDifficultyId;

  const container = makeElement('section', {
    className: 'difficulty-selector',
  });

  const heading = makeElement('h2', {
    className: 'difficulty-selector-heading',
    textContent: text('gameSetup.difficultyHeading'),
  });

  const description = makeElement('p', {
    className: 'scene-description',
    textContent: text('gameSetup.difficultyDescription'),
  });

  const buttonGrid = makeElement('div', {
    className: 'difficulty-button-grid',
  });

  const difficultyButtons = new Map<GameDifficultyId, HTMLButtonElement>();

  const refreshSelection = (): void => {
    for (const [difficultyId, button] of difficultyButtons) {
      const isSelected = difficultyId === selectedDifficultyId;

      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    }
  };

  for (const difficultyId of gameDifficultyIds) {
    const button = document.createElement('button');
    const textKeys = difficultyTextKeys[difficultyId];
    const settings = gameDifficultySettings[difficultyId];

    button.type = 'button';
    button.className = 'difficulty-button';
    button.setAttribute('aria-pressed', 'false');
    button.dataset.difficultyId = difficultyId;
    button.dataset.turnCount = String(settings.turnCount);

    button.append(
      makeElement('span', {
        className: 'difficulty-button-label',
        textContent: text(textKeys.label),
      }),
      makeElement('span', {
        className: 'difficulty-button-duration',
        textContent: text(textKeys.duration),
      }),
      makeElement('span', {
        className: 'difficulty-button-description',
        textContent: text(textKeys.description),
      }),
    );

    button.addEventListener('click', () => {
      selectedDifficultyId = difficultyId;
      refreshSelection();
    });

    difficultyButtons.set(difficultyId, button);
    buttonGrid.append(button);
  }

  container.append(heading, description, buttonGrid);
  refreshSelection();

  return {
    element: container,
    getSelectedDifficulty: () => selectedDifficultyId,
  };
}