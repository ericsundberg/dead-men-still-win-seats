import type {
  SceneContext,
} from '../app/scene-router';
import type {
  AudioSettings,
} from '../audio/types';
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

export type SettingsTabId =
  | 'display'
  | 'audio';

export interface SettingsTabDefinition {
  readonly id:
    SettingsTabId;

  readonly label:
    string;
}

const settingsTabDefinitions:
  readonly SettingsTabDefinition[] = [
    {
      id:
        'display',

      label:
        'Display',
    },

    {
      id:
        'audio',

      label:
        'Audio',
    },
  ];

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

export function getSettingsTabDefinitions():
  readonly SettingsTabDefinition[] {
  return settingsTabDefinitions;
}

/**
 * Resolves keyboard navigation inside the settings tab list.
 *
 * Left and right wrap through the available tabs. Home and End
 * jump directly to the first and last tabs.
 */
export function resolveSettingsTabIndex(
  currentIndex:
    number,

  key:
    string,

  tabCount:
    number,
): number | null {
  if (
    !Number.isInteger(
      tabCount,
    )
    || tabCount <= 0
  ) {
    return null;
  }

  const normalizedIndex =
    Math.min(
      tabCount - 1,

      Math.max(
        0,
        Math.trunc(
          currentIndex,
        ),
      ),
    );

  switch (
    key
  ) {
    case 'ArrowLeft':
      return (
        normalizedIndex
        - 1
        + tabCount
      )
      % tabCount;

    case 'ArrowRight':
      return (
        normalizedIndex
        + 1
      )
      % tabCount;

    case 'Home':
      return 0;

    case 'End':
      return tabCount - 1;

    default:
      return null;
  }
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
          'scene settings-scene',
      },
    );

  appendTertiaryMenuBackground(
    scene,
  );

  const panel =
    makeElement(
      'section',
      {
        className:
          'scene-panel settings-panel',
      },
    );

  panel.setAttribute(
    'aria-labelledby',
    'settings-scene-title',
  );

  const header =
    makeElement(
      'header',
      {
        className:
          'settings-header',
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

  title.id =
    'settings-scene-title';

  const description =
    makeElement(
      'p',
      {
        className:
          'scene-description settings-description',

        textContent:
          [
            'Adjust display and sound settings.',
            'Changes are saved automatically.',
          ].join(
            ' ',
          ),
      },
    );

  header.append(
    title,
    description,
  );

  const tabList =
    makeElement(
      'div',
      {
        className:
          'settings-tab-list',
      },
    );

  tabList.setAttribute(
    'role',
    'tablist',
  );

  tabList.setAttribute(
    'aria-label',
    'Settings categories',
  );

  const tabPanelFrame =
    makeElement(
      'div',
      {
        className:
          'settings-tab-panel-frame',
      },
    );

  const displayPanel =
    makeDisplaySettingsPanel(
      context,
    );

  const audioPanel =
    makeAudioSettingsPanel(
      context,
    );

  const tabPanels =
    new Map<
      SettingsTabId,
      HTMLElement
    >([
      [
        'display',
        displayPanel,
      ],

      [
        'audio',
        audioPanel,
      ],
    ]);

  tabPanelFrame.append(
    displayPanel,
    audioPanel,
  );

  const tabButtons:
    HTMLButtonElement[] = [];

  let selectedTabId:
    SettingsTabId =
      'display';

  const selectTab =
    (
      tabId:
        SettingsTabId,

      focusSelectedTab:
        boolean,
    ): void => {
      const selectedDefinition =
        settingsTabDefinitions.find(
          (
            definition,
          ) =>
            definition.id
            === tabId,
        );

      if (
        !selectedDefinition
      ) {
        return;
      }

      selectedTabId =
        selectedDefinition.id;

      settingsTabDefinitions.forEach(
        (
          definition,
          index,
        ) => {
          const button =
            tabButtons[
              index
            ];

          const tabPanel =
            tabPanels.get(
              definition.id,
            );

          if (
            !button
            || !tabPanel
          ) {
            return;
          }

          const isSelected =
            definition.id
            === selectedTabId;

          button.setAttribute(
            'aria-selected',
            isSelected
              ? 'true'
              : 'false',
          );

          button.tabIndex =
            isSelected
              ? 0
              : -1;

          button.classList.toggle(
            'is-selected',
            isSelected,
          );

          tabPanel.hidden =
            !isSelected;
        },
      );

      if (
        !focusSelectedTab
      ) {
        return;
      }

      const selectedIndex =
        settingsTabDefinitions
          .findIndex(
            (
              definition,
            ) =>
              definition.id
              === selectedTabId,
          );

      tabButtons[
        selectedIndex
      ]?.focus();
    };

  for (
    const definition
    of settingsTabDefinitions
  ) {
    const button =
      makeElement(
        'button',
        {
          className:
            'settings-tab',

          textContent:
            definition.label,
        },
      );

    button.type =
      'button';

    button.id =
      [
        'settings-tab',
        definition.id,
      ].join(
        '-',
      );

    button.setAttribute(
      'role',
      'tab',
    );

    const tabPanel =
      tabPanels.get(
        definition.id,
      );

    if (
      !tabPanel
    ) {
      continue;
    }

    button.setAttribute(
      'aria-controls',
      tabPanel.id,
    );

    tabPanel.setAttribute(
      'aria-labelledby',
      button.id,
    );

    button.addEventListener(
      'click',
      () => {
        context.audio.sfx.play(
          'button-click',
        );

        selectTab(
          definition.id,
          false,
        );
      },
    );

    tabButtons.push(
      button,
    );

    tabList.append(
      button,
    );
  }

  tabList.addEventListener(
    'keydown',
    (
      event:
        KeyboardEvent,
    ) => {
      const target =
        event.target;

      if (
        !(
          target
          instanceof
          HTMLButtonElement
        )
      ) {
        return;
      }

      const currentIndex =
        tabButtons.indexOf(
          target,
        );

      if (
        currentIndex < 0
      ) {
        return;
      }

      const nextIndex =
        resolveSettingsTabIndex(
          currentIndex,
          event.key,
          tabButtons.length,
        );

      if (
        nextIndex
        === null
      ) {
        return;
      }

      event.preventDefault();

      const nextDefinition =
        settingsTabDefinitions[
          nextIndex
        ];

      selectTab(
        nextDefinition.id,
        true,
      );
    },
  );

  const footer =
    makeElement(
      'footer',
      {
        className:
          'settings-footer',
      },
    );

  footer.append(
    makeButton(
      'Back',
      () => {
        context.navigate(
          'title',
        );
      },
      [
        'secondary-button',
        'settings-back-button',
      ].join(
        ' ',
      ),
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

  panel.append(
    header,
    tabList,
    tabPanelFrame,
    footer,
  );

  scene.append(
    panel,
  );

  selectTab(
    selectedTabId,
    false,
  );

  return scene;
}

function makeDisplaySettingsPanel(
  context:
    SceneContext,
): HTMLElement {
  const panel =
    makeSettingsTabPanel(
      'display',
      'Display Settings',
      [
        'Adjust the scale used by game text',
        'and interface controls.',
      ].join(
        ' ',
      ),
    );

  const controlList =
    makeElement(
      'div',
      {
        className:
          'settings-control-list',
      },
    );

  controlList.append(
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
              percentage
              / 100,
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
    }),
  );

  panel.append(
    controlList,
  );

  return panel;
}

function makeAudioSettingsPanel(
  context:
    SceneContext,
): HTMLElement {
  const panel =
    makeSettingsTabPanel(
      'audio',
      'Audio Settings',
      [
        'Adjust overall volume, music volume,',
        'and interface sound effects.',
      ].join(
        ' ',
      ),
    );

  const audioSettings =
    context.audio.getSettings();

  const controlList =
    makeElement(
      'div',
      {
        className:
          'settings-control-list',
      },
    );

  controlList.append(
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
    ),

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
    ),

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
    ),
  );

  panel.append(
    controlList,
  );

  return panel;
}

function makeSettingsTabPanel(
  tabId:
    SettingsTabId,

  headingText:
    string,

  descriptionText:
    string,
): HTMLElement {
  const panel =
    makeElement(
      'section',
      {
        className:
          'settings-tab-content',
      },
    );

  panel.id =
    [
      'settings-tab-panel',
      tabId,
    ].join(
      '-',
    );

  panel.setAttribute(
    'role',
    'tabpanel',
  );

  panel.tabIndex =
    0;

  const heading =
    makeElement(
      'h2',
      {
        className:
          'settings-section-heading',

        textContent:
          headingText,
      },
    );

  const description =
    makeElement(
      'p',
      {
        className:
          'settings-section-description',

        textContent:
          descriptionText,
      },
    );

  panel.append(
    heading,
    description,
  );

  return panel;
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
          ].join(
            ' ',
          ),
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
    scale
    * 100,
  );
}

function audioVolumeToPercentage(
  volume:
    number,
): number {
  return Math.round(
    volume
    * 100,
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