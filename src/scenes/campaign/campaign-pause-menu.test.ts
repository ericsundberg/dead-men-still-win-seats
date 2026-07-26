import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createInitialCampaignPauseState,
  reduceCampaignPauseState,
} from './campaign-pause-menu';

describe(
  'campaign pause-menu state',
  () => {
    it(
      'starts closed on the primary pause menu',
      () => {
        expect(
          createInitialCampaignPauseState(),
        ).toEqual({
          isOpen:
            false,

          view:
            'menu',
        });
      },
    );

    it(
      'opens on the primary pause menu',
      () => {
        const state =
          reduceCampaignPauseState(
            createInitialCampaignPauseState(),
            'open',
          );

        expect(
          state,
        ).toEqual({
          isOpen:
            true,

          view:
            'menu',
        });
      },
    );

    it(
      'toggles between open and closed states',
      () => {
        const openState =
          reduceCampaignPauseState(
            createInitialCampaignPauseState(),
            'toggle',
          );

        const closedState =
          reduceCampaignPauseState(
            openState,
            'toggle',
          );

        expect(
          openState.isOpen,
        ).toBe(true);

        expect(
          closedState,
        ).toEqual({
          isOpen:
            false,

          view:
            'menu',
        });
      },
    );

    it(
      'opens the settings view',
      () => {
        const state =
          reduceCampaignPauseState(
            createInitialCampaignPauseState(),
            'show-settings',
          );

        expect(
          state,
        ).toEqual({
          isOpen:
            true,

          view:
            'settings',
        });
      },
    );

    it(
      'returns from settings to the primary menu',
      () => {
        const settingsState =
          reduceCampaignPauseState(
            createInitialCampaignPauseState(),
            'show-settings',
          );

        const menuState =
          reduceCampaignPauseState(
            settingsState,
            'show-menu',
          );

        expect(
          menuState,
        ).toEqual({
          isOpen:
            true,

          view:
            'menu',
        });
      },
    );

    it(
      'resets to the primary menu whenever it closes',
      () => {
        const settingsState =
          reduceCampaignPauseState(
            createInitialCampaignPauseState(),
            'show-settings',
          );

        const closedState =
          reduceCampaignPauseState(
            settingsState,
            'close',
          );

        expect(
          closedState,
        ).toEqual({
          isOpen:
            false,

          view:
            'menu',
        });
      },
    );
  },
);