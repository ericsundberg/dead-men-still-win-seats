import type { SceneContext } from '../app/scene-router';
import { makeButton, makeElement } from '../ui/dom-helpers';
import {
  getUiScale,
  maximumUiScale,
  minimumUiScale,
  setUiScale,
  uiScaleStep,
} from '../ui/ui-scale';
import {
  appendTertiaryMenuBackground,
} from './shared/tertiary-menu-background';

const scaleSliderId = 'text-scale-slider';

export function renderSettingsScene(
  context: SceneContext,
): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  appendTertiaryMenuBackground(scene);

  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  const title = makeElement('h1', {
    textContent: 'Settings',
  });

  const description = makeElement('p', {
    className: 'scene-description',
    textContent:
      'Adjust the text scale between 75% and 150%.',
  });

  const scaleControl = makeElement('div', {
    className: 'settings-scale-control',
  });

  const scaleHeading = makeElement('div', {
    className: 'settings-scale-heading',
  });

  const scaleLabel = makeElement('label', {
    className: 'settings-scale-label',
    textContent: 'Text Scale',
  });

  scaleLabel.htmlFor = scaleSliderId;

  const scaleStatus = makeElement('output', {
    className: 'setting-status settings-scale-value',
  });

  scaleStatus.setAttribute('for', scaleSliderId);

  const scaleInput = document.createElement('input');

  scaleInput.id = scaleSliderId;
  scaleInput.name = 'text-scale';
  scaleInput.type = 'range';
  scaleInput.className = 'settings-scale-slider';

  scaleInput.min = String(
    scaleToPercentage(minimumUiScale),
  );

  scaleInput.max = String(
    scaleToPercentage(maximumUiScale),
  );

  scaleInput.step = String(
    scaleToPercentage(uiScaleStep),
  );

  const refreshScaleControl = (
    scale: number,
  ): void => {
    const percentage = scaleToPercentage(scale);

    scaleInput.value = String(percentage);
    scaleInput.setAttribute(
      'aria-valuetext',
      `${percentage}%`,
    );

    scaleStatus.textContent = `${percentage}%`;
  };

  refreshScaleControl(getUiScale());

  /*
    Apply the new scale continuously while the slider moves.
  */
  scaleInput.addEventListener('input', () => {
    const percentage = Number.parseInt(
      scaleInput.value,
      10,
    );

    if (!Number.isFinite(percentage)) {
      return;
    }

    const appliedScale = setUiScale(
      percentage / 100,
    );

    refreshScaleControl(appliedScale);
  });

  /*
    Play one confirmation sound when the slider interaction
    is committed, rather than on every one-percent movement.
  */
  scaleInput.addEventListener('change', () => {
    context.audio.sfx.play('button-click');
  });

  const scaleLimits = makeElement('div', {
    className: 'settings-scale-limits',
  });

  scaleLimits.setAttribute('aria-hidden', 'true');

  scaleLimits.append(
    makeElement('span', {
      textContent: `${scaleToPercentage(minimumUiScale)}%`,
    }),
    makeElement('span', {
      textContent: `${scaleToPercentage(maximumUiScale)}%`,
    }),
  );

  scaleHeading.append(
    scaleLabel,
    scaleStatus,
  );

  scaleControl.append(
    scaleHeading,
    scaleInput,
    scaleLimits,
  );

  panel.append(
    title,
    description,
    scaleControl,
    makeButton(
      'Back',
      () => context.navigate('title'),
      'secondary-button',
      {
        onBeforeClick: () => {
          context.audio.sfx.play('button-cancel');
        },
      },
    ),
  );

  scene.append(panel);

  return scene;
}

function scaleToPercentage(
  scale: number,
): number {
  return Math.round(scale * 100);
}