import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import {
  makeElement,
} from '../../ui/dom-helpers';
import {
  makeCampaignActionPanel,
} from './campaign-action-panel';
import {
  getCampaignWorkspaceTabDefinitions,
  resolveCampaignWorkspaceTabIndex,
  type CampaignWorkspaceTabDefinition,
  type CampaignWorkspaceTabId,
} from './campaign-workspace-tabs';

export interface CampaignWorkspace {
  readonly element:
    HTMLElement;

  readonly dispose:
    () => void;
}

/**
 * Builds the tabbed manila-folder campaign workspace.
 *
 * Actions remain fully functional. The other tabs establish the
 * final navigation structure before their management and chart
 * content is implemented in the following checkpoints.
 */
export function makeCampaignWorkspace(
  context:
    SceneContext,

  campaignState:
    CampaignState,
): CampaignWorkspace {
  const workspace =
    makeElement(
      'section',
      {
        className:
          'campaign-workspace manila-folder-form',
      },
    );

  workspace.setAttribute(
    'aria-label',
    'Campaign workspace',
  );

  const tabList =
    makeElement(
      'div',
      {
        className:
          'campaign-workspace-tab-list',
      },
    );

  tabList.setAttribute(
    'role',
    'tablist',
  );

  tabList.setAttribute(
    'aria-label',
    'Campaign workspace sections',
  );

  const paper =
    makeElement(
      'section',
      {
        className:
          'campaign-workspace-paper printed-report-paper',
      },
    );

  paper.id =
    'campaign-workspace-tab-panel';

  paper.setAttribute(
    'role',
    'tabpanel',
  );

  paper.tabIndex =
    0;

  const definitions =
    getCampaignWorkspaceTabDefinitions();

  const tabButtons:
    HTMLButtonElement[] = [];

  const cleanupCallbacks:
    Array<
      () => void
    > = [];

  let selectedTabId:
    CampaignWorkspaceTabId =
      'actions';

  const selectTab =
    (
      tabId:
        CampaignWorkspaceTabId,

      focusSelectedTab:
        boolean,
    ): void => {
      const selectedDefinition =
        definitions.find(
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

      for (
        let index = 0;
        index < definitions.length;
        index += 1
      ) {
        const definition =
          definitions[index];

        const button =
          tabButtons[index];

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
      }

      const selectedIndex =
        definitions.findIndex(
          (
            definition,
          ) =>
            definition.id
            === selectedTabId,
        );

      const selectedButton =
        tabButtons[
          selectedIndex
        ];

      paper.setAttribute(
        'aria-labelledby',
        selectedButton.id,
      );

      paper.dataset.tabId =
        selectedTabId;

      paper.replaceChildren(
        makeCampaignWorkspaceTabContent(
          context,
          campaignState,
          selectedDefinition,
        ),
      );

      if (
        focusSelectedTab
      ) {
        selectedButton.focus();
      }
    };

  for (
    const definition
    of definitions
  ) {
    const button =
      makeElement(
        'button',
        {
          className:
            'campaign-workspace-tab',

          textContent:
            definition.label,
        },
      );

    button.type =
      'button';

    button.id =
      [
        'campaign-workspace-tab',
        definition.id,
      ].join(
        '-',
      );

    button.setAttribute(
      'role',
      'tab',
    );

    button.setAttribute(
      'aria-controls',
      paper.id,
    );

    const handleClick =
      (): void => {
        context.audio.sfx.play(
          'button-click',
        );

        selectTab(
          definition.id,
          false,
        );
      };

    button.addEventListener(
      'click',
      handleClick,
    );

    cleanupCallbacks.push(
      () => {
        button.removeEventListener(
          'click',
          handleClick,
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

  const handleTabListKeyDown =
    (
      event:
        KeyboardEvent,
    ): void => {
      const target =
        event.target;

      if (
        !(target
          instanceof
          HTMLButtonElement)
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
        resolveCampaignWorkspaceTabIndex(
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
        definitions[
          nextIndex
        ];

      selectTab(
        nextDefinition.id,
        true,
      );
    };

  tabList.addEventListener(
    'keydown',
    handleTabListKeyDown,
  );

  cleanupCallbacks.push(
    () => {
      tabList.removeEventListener(
        'keydown',
        handleTabListKeyDown,
      );
    },
  );

  workspace.append(
    tabList,
    paper,
  );

  selectTab(
    selectedTabId,
    false,
  );

  return {
    element:
      workspace,

    dispose:
      () => {
        for (
          const cleanup
          of cleanupCallbacks
        ) {
          cleanup();
        }
      },
  };
}

function makeCampaignWorkspaceTabContent(
  context:
    SceneContext,

  campaignState:
    CampaignState,

  definition:
    CampaignWorkspaceTabDefinition,
): HTMLElement {
  if (
    definition.id
    === 'actions'
  ) {
    return makeCampaignActionPanel(
      context,
      campaignState,
    );
  }

  return makeCampaignWorkspacePlaceholder(
    definition,
  );
}

function makeCampaignWorkspacePlaceholder(
  definition:
    CampaignWorkspaceTabDefinition,
): HTMLElement {
  const placeholder =
    makeElement(
      'section',
      {
        className:
          'campaign-workspace-placeholder',
      },
    );

  placeholder.setAttribute(
    'aria-label',
    definition.heading,
  );

  const heading =
    makeElement(
      'h2',
      {
        className:
          'campaign-workspace-placeholder-title',

        textContent:
          definition.heading,
      },
    );

  const description =
    makeElement(
      'p',
      {
        className:
          'campaign-workspace-placeholder-description',

        textContent:
          definition.description,
      },
    );

  const status =
    makeElement(
      'p',
      {
        className:
          'campaign-workspace-placeholder-status',

        textContent:
          'Detailed campaign records will be added in a future update.',
      },
    );

  placeholder.append(
    heading,
    description,
    status,
  );

  return placeholder;
}