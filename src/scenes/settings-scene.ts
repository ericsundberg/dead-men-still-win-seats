import type {
  AudioSettings,
} from '../audio/types';
import type {
  SceneContext,
} from '../app/scene-router';
import {
  makeButton,
  makeElement,
} from '../ui/dom-helpers';
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

const textScaleSliderId =
  'text-scale-slider';

const masterVolumeSliderId =
  'master-volume-slider';

const musicVolumeSliderId =
  'music-volume-slider';

const sfxVolumeSliderId =
  'sfx-volume-slider';

interface PercentageSliderOptions {
  readonly id:
    string;

  readonly name:
    string;

  readonly label:
    string;

  readonly initialPercentage:
    number;

  readonly minimumPercentage:
    number;

  readonly maximumPercentage:
    number;

  readonly step:
    number;

  readonly onInput:
    (
      percentage:
        number,
    ) => number;

  readonly onChange?:
    () => void;
}

export function renderSettingsScene(
  context:
    SceneContext,
): HTMLElement {
  const scene =
    makeElement(
      'section',
      {
        className:
          'scene',
      },
    );

  appendTertiaryMenuBackground(
    scene,
  );

  const panel =
    makeElement(
      'div',
      {
        className:
          'scene-panel settings-panel',
      },
    );

  const title =
    makeElement(
      'h1',
      {
        textContent:
          'Settings',
      },
    );

  const description =
    makeElement(
      'p',
      {
        className:
          'scene-description',

        textContent:
          [
            'Adjust text scale and sound levels.',
            'Changes are saved automatically.',
          ].join(' '),
      },
    );

  const controlList =
    makeElement(
      'div',
      {
        className:
          'settings-control-list',
      },
    );

  const displayHeading =
    makeElement(
      'h2',
      {
        className:
          'settings-section-heading',

        textContent:
          'Display',
      },
    );

  const textScaleControl =
    makePercentageSliderControl({
      id:
        textScaleSliderId,

      name:
        'text-scale',

      label:
        'Text Scale',

      initialPercentage:
        scaleToPercentage(
          getUiScale(),
        ),

      minimumPercentage:
        scaleToPercentage(
          minimumUiScale,
        ),

      maximumPercentage:
        scaleToPercentage(
          maximumUiScale,
        ),

      step:
        scaleToPercentage(
          uiScaleStep,
        ),

      onInput:
        (
          percentage,
        ) => {
          const appliedScale =
            setUiScale(
              percentage / 100,
            );

          return scaleToPercentage(
            appliedScale,
          );
        },

      onChange:
        () => {
          context.audio.sfx.play(
            'button-click',
          );
        },
    });

  const audioHeading =
    makeElement(
      'h2',
      {
        className:
          'settings-section-heading',

        textContent:
          'Audio',
      },
    );

  const audioSettings =
    context.audio.getSettings();

  const masterVolumeControl =
    makeAudioVolumeControl(
      context,
      {
        id:
          masterVolumeSliderId,

        name:
          'master-volume',

        label:
          'Master Volume',

        setting:
          'masterVolume',

        initialSettings:
          audioSettings,
      },
    );

  const musicVolumeControl =
    makeAudioVolumeControl(
      context,
      {
        id:
          musicVolumeSliderId,

        name:
          'music-volume',

        label:
          'Music Volume',

        setting:
          'musicVolume',

        initialSettings:
          audioSettings,
      },
    );

  const sfxVolumeControl =
    makeAudioVolumeControl(
      context,
      {
        id:
          sfxVolumeSliderId,

        name:
          'sfx-volume',

        label:
          'Sound Effects Volume',

        setting:
          'sfxVolume',

        initialSettings:
          audioSettings,
      },
    );

  controlList.append(
    displayHeading,
    textScaleControl,
    audioHeading,
    masterVolumeControl,
    musicVolumeControl,
    sfxVolumeControl,
  );

  panel.append(
    title,
    description,
    controlList,
    makeButton(
      'Back',
      () => {
        context.navigate(
          'title',
        );
      },
      'secondary-button',
      {
        onBeforeClick:
          () => {
            context.audio.sfx.play(
              'button-cancel',
            );
          },
      },
    ),
  );

  scene.append(
    panel,
  );

  return scene;
}

interface AudioVolumeControlOptions {
  readonly id:
    string;

  readonly name:
    string;

  readonly label:
    string;

  readonly setting:
    keyof Pick<
      AudioSettings,
      | 'masterVolume'
      | 'musicVolume'
      | 'sfxVolume'
    >;

  readonly initialSettings:
    AudioSettings;
}

function makeAudioVolumeControl(
  context:
    SceneContext,

  options:
    AudioVolumeControlOptions,
): HTMLElement {
  return makePercentageSliderControl({
    id:
      options.id,

    name:
      options.name,

    label:
      options.label,

    initialPercentage:
      audioVolumeToPercentage(
        options.initialSettings[
          options.setting
        ],
      ),

    minimumPercentage:
      0,

    maximumPercentage:
      100,

    step:
      1,

    onInput:
      (
        percentage,
      ) => {
        const nextSettings =
          context.audio
            .updateSettings({
              [options.setting]:
                percentage
                / 100,
            });

        return audioVolumeToPercentage(
          nextSettings[
            options.setting
          ],
        );
      },

    onChange:
      () => {
        context.audio.sfx.play(
          'button-click',
        );
      },
  });
}

function makePercentageSliderControl(
  options:
    PercentageSliderOptions,
): HTMLElement {
  const control =
    makeElement(
      'div',
      {
        className:
          'settings-control',
      },
    );

  const heading =
    makeElement(
      'div',
      {
        className:
          'settings-control-heading',
      },
    );

  const label =
    makeElement(
      'label',
      {
        className:
          'settings-control-label',

        textContent:
          options.label,
      },
    );

  label.htmlFor =
    options.id;

  const status =
    makeElement(
      'output',
      {
        className:
          [
            'setting-status',
            'settings-control-value',
          ].join(' '),
      },
    );

  status.setAttribute(
    'for',
    options.id,
  );

  const input =
    document.createElement(
      'input',
    );

  input.id =
    options.id;

  input.name =
    options.name;

  input.type =
    'range';

  input.className =
    'settings-slider';

  input.min =
    String(
      options.minimumPercentage,
    );

  input.max =
    String(
      options.maximumPercentage,
    );

  input.step =
    String(
      options.step,
    );

  const refreshControl =
    (
      percentage:
        number,
    ): void => {
      const normalizedPercentage =
        clampPercentage(
          percentage,
          options.minimumPercentage,
          options.maximumPercentage,
        );

      input.value =
        String(
          normalizedPercentage,
        );

      input.setAttribute(
        'aria-valuetext',
        `${normalizedPercentage}%`,
      );

      status.textContent =
        `${normalizedPercentage}%`;
    };

  refreshControl(
    options.initialPercentage,
  );

  input.addEventListener(
    'input',
    () => {
      const percentage =
        Number.parseInt(
          input.value,
          10,
        );

      if (
        !Number.isFinite(
          percentage,
        )
      ) {
        return;
      }

      refreshControl(
        options.onInput(
          percentage,
        ),
      );
    },
  );

  if (
    options.onChange
  ) {
    input.addEventListener(
      'change',
      options.onChange,
    );
  }

  const limits =
    makeElement(
      'div',
      {
        className:
          'settings-control-limits',
      },
    );

  limits.setAttribute(
    'aria-hidden',
    'true',
  );

  limits.append(
    makeElement(
      'span',
      {
        textContent:
          `${options.minimumPercentage}%`,
      },
    ),
    makeElement(
      'span',
      {
        textContent:
          `${options.maximumPercentage}%`,
      },
    ),
  );

  heading.append(
    label,
    status,
  );

  control.append(
    heading,
    input,
    limits,
  );

  return control;
}

function scaleToPercentage(
  scale:
    number,
): number {
  return Math.round(
    scale * 100,
  );
}

function audioVolumeToPercentage(
  volume:
    number,
): number {
  return Math.round(
    volume * 100,
  );
}

function clampPercentage(
  percentage:
    number,

  minimumPercentage:
    number,

  maximumPercentage:
    number,
): number {
  return Math.min(
    maximumPercentage,
    Math.max(
      minimumPercentage,
      Math.round(
        percentage,
      ),
    ),
  );
}