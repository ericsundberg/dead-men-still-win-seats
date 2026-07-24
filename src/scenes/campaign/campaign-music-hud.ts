import type {
  SceneContext,
} from '../../app/scene-router';
import type {
  MusicPlaybackState,
} from '../../audio/music-manager';
import {
  makeElement,
} from '../../ui/dom-helpers';

export interface CampaignMusicHud {
  readonly element: HTMLElement;
  readonly dispose: () => void;
}

export function makeCampaignMusicHud(
  context: SceneContext,
): CampaignMusicHud {
  const player = makeElement(
    'section',
    {
      className:
        'campaign-music-player streaming-music-hud',
    },
  );

  player.setAttribute(
    'aria-label',
    'Music player',
  );

  const information = makeElement(
    'div',
    {
      className:
        'campaign-music-information',
    },
  );

  const label = makeElement(
    'span',
    {
      className:
        'campaign-hud-label',
      textContent:
        'Now Playing',
    },
  );

  const trackTitle = makeElement(
    'span',
    {
      className:
        'campaign-music-title',
      textContent:
        'No song playing',
    },
  );

  trackTitle.setAttribute(
    'aria-live',
    'polite',
  );

  information.append(
    label,
    trackTitle,
  );

  const controls = makeElement(
    'div',
    {
      className:
        'campaign-music-controls',
    },
  );

  const restartButton =
    makeMusicControlButton(
      '◄◄',
      'Restart current song',
    );

    const pauseButton =
    makeMusicControlButton(
        '',
        'Pause current song',
    );

    pauseButton.classList.add(
    'campaign-music-primary-control',
    );

  const skipButton =
    makeMusicControlButton(
      '►►',
      'Skip current song',
    );

  restartButton.addEventListener(
    'click',
    () => {
      context.audio.sfx.play(
        'button-click',
      );

      context.audio.music
        .restartCurrentTrack();
    },
  );

  pauseButton.addEventListener(
    'click',
    () => {
      context.audio.sfx.play(
        'button-click',
      );

      context.audio.music
        .togglePause();
    },
  );

  skipButton.addEventListener(
    'click',
    () => {
      context.audio.sfx.play(
        'button-click',
      );

      context.audio.music
        .skipGameplayTrack();
    },
  );

  controls.append(
    restartButton,
    pauseButton,
    skipButton,
  );

  player.append(
    information,
    controls,
  );

  const refreshPlaybackState = (
    state: MusicPlaybackState,
  ): void => {
    const hasTrack =
      state.trackId !== null;

    const trackLabel =
      state.trackLabel
      ?? 'No song playing';

    trackTitle.textContent =
      trackLabel;

    trackTitle.title =
      trackLabel;

    restartButton.disabled =
      !hasTrack;

    pauseButton.disabled =
      !hasTrack;

    skipButton.disabled =
      !hasTrack;

    const pauseLabel =
      state.isPaused
        ? 'Resume current song'
        : 'Pause current song';

    pauseButton.dataset.transportIcon =
    state.isPaused
        ? 'play'
        : 'pause';

    pauseButton.title =
      pauseLabel;

    pauseButton.setAttribute(
      'aria-label',
      pauseLabel,
    );

    pauseButton.setAttribute(
      'aria-pressed',
      String(state.isPaused),
    );
  };

  const unsubscribe =
    context.audio.music.subscribe(
      refreshPlaybackState,
    );

  return {
    element: player,
    dispose: unsubscribe,
  };
}

function makeMusicControlButton(
  symbol: string,
  accessibleLabel: string,
): HTMLButtonElement {
  const button =
    document.createElement(
      'button',
    );

  button.type = 'button';

  button.className =
    'campaign-music-control';

  button.textContent =
    symbol;

  button.title =
    accessibleLabel;

  button.setAttribute(
    'aria-label',
    accessibleLabel,
  );

  return button;
}