import type {
  CampaignEndGameState,
  CampaignEndGameType,
} from '../../game/campaign/campaign-end-game';
import {
  makeElement,
} from '../../ui/dom-helpers';

export type CampaignEndingFmvId =
  | 'win'
  | 'draw'
  | 'lose';

export type CampaignEndingFmvFileName =
  | 'win.mp4'
  | 'draw.mp4'
  | 'lose.mp4';

export type CampaignEndingFmvPlaybackPhase =
  | 'idle'
  | 'starting'
  | 'playing'
  | 'finished';

export type CampaignEndingFmvPlaybackAction =
  | 'request-start'
  | 'confirm-playing'
  | 'finish';

export type CampaignEndingFmvFinishReason =
  | 'ended'
  | 'error'
  | 'playback-blocked'
  | 'skipped'
  | 'manual';

export interface CampaignEndingFmvDefinition {
  readonly id:
    CampaignEndingFmvId;

  readonly fileName:
    CampaignEndingFmvFileName;

  readonly source:
    string;

  readonly ariaLabel:
    string;
}

export interface CampaignEndingFmvPlaybackState {
  readonly phase:
    CampaignEndingFmvPlaybackPhase;
}

export interface CampaignEndingFmvPlayerOptions {
  readonly definition:
    CampaignEndingFmvDefinition;

  readonly onFinished:
    (
      reason:
        CampaignEndingFmvFinishReason,
    ) => void;
}

export interface CampaignEndingFmvPlayer {
  readonly element:
    HTMLElement;

  readonly video:
    HTMLVideoElement;

  readonly start:
    () => Promise<void>;

  readonly finish:
    (
      reason?:
        CampaignEndingFmvFinishReason,
    ) => void;

  readonly getState:
    () => CampaignEndingFmvPlaybackState;

  readonly dispose:
    () => void;
}

interface CampaignEndingFmvPresentation {
  readonly id:
    CampaignEndingFmvId;

  readonly fileName:
    CampaignEndingFmvFileName;

  readonly ariaLabel:
    string;
}

const endingFmvPresentations = {
  'public-discovers-death': {
    id:
      'lose',

    fileName:
      'lose.mp4',

    ariaLabel:
      'The public learns that Senator Buster is dead.',
  },

  'party-dumps-senator': {
    id:
      'lose',

    fileName:
      'lose.mp4',

    ariaLabel:
      'The party abandons Senator Buster and announces his death.',
  },

  'lose-reelection': {
    id:
      'draw',

    fileName:
      'draw.mp4',

    ariaLabel:
      'The campaign loses reelection without revealing the Senator’s death.',
  },

  'win-reelection': {
    id:
      'win',

    fileName:
      'win.mp4',

    ariaLabel:
      'Senator Buster wins reelection.',
  },
} as const satisfies Record<
  CampaignEndGameType,
  CampaignEndingFmvPresentation
>;

const endingFmvPreviewPresentations = {
  win: {
    id:
      'win',

    fileName:
      'win.mp4',

    ariaLabel:
      'Win campaign ending video.',
  },

  draw: {
    id:
      'draw',

    fileName:
      'draw.mp4',

    ariaLabel:
      'Draw campaign ending video.',
  },

  lose: {
    id:
      'lose',

    fileName:
      'lose.mp4',

    ariaLabel:
      'Lose campaign ending video.',
  },
} as const satisfies Record<
  CampaignEndingFmvId,
  CampaignEndingFmvPresentation
>;

export function resolveCampaignEndingFmvById(
  id:
    CampaignEndingFmvId,
): CampaignEndingFmvDefinition {
  return makeCampaignEndingFmvDefinition(
    endingFmvPreviewPresentations[
      id
    ],
  );
}

export function resolveCampaignEndingFmv(
  endGameState:
    CampaignEndGameState | null,
): CampaignEndingFmvDefinition | null {
  if (
    !endGameState
  ) {
    return null;
  }

  const presentation =
    endingFmvPresentations[
      endGameState.type
    ];

  return makeCampaignEndingFmvDefinition(
    presentation,
  );
}

function makeCampaignEndingFmvDefinition(
  presentation:
    CampaignEndingFmvPresentation,
): CampaignEndingFmvDefinition {
  return {
    ...presentation,

    source:
      [
        import.meta.env.BASE_URL,
        'assets/video/',
        presentation.fileName,
      ].join(''),
  };
}

export function createInitialCampaignEndingFmvPlaybackState():
  CampaignEndingFmvPlaybackState {
  return {
    phase:
      'idle',
  };
}

export function reduceCampaignEndingFmvPlaybackState(
  state:
    CampaignEndingFmvPlaybackState,

  action:
    CampaignEndingFmvPlaybackAction,
): CampaignEndingFmvPlaybackState {
  if (
    state.phase
    === 'finished'
  ) {
    return state;
  }

  switch (action) {
    case 'request-start':
      return {
        phase:
          'starting',
      };

    case 'confirm-playing':
      return {
        phase:
          'playing',
      };

    case 'finish':
      return {
        phase:
          'finished',
      };
  }
}

export function isCampaignEndingFmvSkipKey(
  key:
    string,
): boolean {
  return (
    key === 'Escape'
    || key === 'Enter'
    || key === ' '
    || key === 'Spacebar'
  );
}

export function makeCampaignEndingFmvPlayer(
  options:
    CampaignEndingFmvPlayerOptions,
): CampaignEndingFmvPlayer {
  let state =
    createInitialCampaignEndingFmvPlaybackState();

  let disposed =
    false;

  let hasReportedFinish =
    false;

  const element =
    makeElement(
      'section',
      {
        className: [
          'campaign-ending-fmv-layer',
          `campaign-ending-fmv-layer--${options.definition.id}`,
        ].join(' '),
      },
    );

  element.setAttribute(
    'aria-label',
    'Campaign ending video',
  );

  element.tabIndex =
    -1;

  const video =
    document.createElement(
      'video',
    );

  video.className =
    'campaign-ending-fmv-video';

  video.src =
    options.definition.source;

  video.autoplay =
    true;

  video.playsInline =
    true;

  video.preload =
    'auto';

  video.setAttribute(
    'aria-label',
    options.definition.ariaLabel,
  );

  const skipButton =
    document.createElement(
      'button',
    );

  skipButton.type =
    'button';

  skipButton.className =
    'campaign-ending-fmv-skip-button';

  skipButton.textContent =
    'Skip Video';

  skipButton.setAttribute(
    'aria-label',
    'Skip campaign ending video',
  );

  const skipHint =
    makeElement(
      'span',
      {
        className:
          'campaign-ending-fmv-skip-hint',

        textContent:
          'Click or press Esc, Enter, or Space',
      },
    );

  skipHint.setAttribute(
    'aria-hidden',
    'true',
  );

  const skipControls =
    makeElement(
      'div',
      {
        className:
          'campaign-ending-fmv-skip-controls',
      },
    );

  skipControls.append(
    skipButton,
    skipHint,
  );

  element.append(
    video,
    skipControls,
  );

  const updateState =
    (
      action:
        CampaignEndingFmvPlaybackAction,
    ): void => {
      state =
        reduceCampaignEndingFmvPlaybackState(
          state,
          action,
        );

      element.dataset.playbackPhase =
        state.phase;
    };

  const finish =
    (
      reason:
        CampaignEndingFmvFinishReason =
          'manual',
    ): void => {
      if (
        disposed
        || hasReportedFinish
      ) {
        return;
      }

      hasReportedFinish =
        true;

      updateState(
        'finish',
      );

      video.pause();

      options.onFinished(
        reason,
      );
    };

  const skip =
    (): void => {
      finish(
        'skipped',
      );
    };

  const onSkipButtonClick =
    (
      event:
        MouseEvent,
    ): void => {
      event.stopPropagation();

      skip();
    };

  const onLayerClick =
    (): void => {
      skip();
    };

  const onKeyDown =
    (
      event:
        KeyboardEvent,
    ): void => {
      if (
        !isCampaignEndingFmvSkipKey(
          event.key,
        )
      ) {
        return;
      }

      event.preventDefault();

      skip();
    };

  skipButton.addEventListener(
    'click',
    onSkipButtonClick,
  );

  element.addEventListener(
    'click',
    onLayerClick,
  );

  window.addEventListener(
    'keydown',
    onKeyDown,
  );

  const onEnded =
    (): void => {
      finish(
        'ended',
      );
    };

  const onError =
    (): void => {
      console.warn(
        [
          '[video] failed to load campaign ending video',
          options.definition.source,
        ].join(': '),
      );

      finish(
        'error',
      );
    };

  video.addEventListener(
    'ended',
    onEnded,
    {
      once:
        true,
    },
  );

  video.addEventListener(
    'error',
    onError,
    {
      once:
        true,
    },
  );

  const start =
    async (): Promise<void> => {
      if (
        disposed
        || state.phase
          !== 'idle'
      ) {
        return;
      }

      updateState(
        'request-start',
      );

      element.focus({
        preventScroll:
          true,
      });

      try {
        await video.play();

        if (
          disposed
          || hasReportedFinish
        ) {
          return;
        }

        updateState(
          'confirm-playing',
        );

        return;
      } catch (error) {
        if (
          disposed
          || hasReportedFinish
        ) {
          return;
        }

        console.warn(
          [
            '[video] audible campaign ending autoplay',
            'was blocked; retrying muted',
          ].join(' '),
          error,
        );
      }

      video.muted =
        true;

      try {
        await video.play();

        if (
          disposed
          || hasReportedFinish
        ) {
          return;
        }

        updateState(
          'confirm-playing',
        );
      } catch (mutedError) {
        if (
          disposed
          || hasReportedFinish
        ) {
          return;
        }

        console.warn(
          '[video] muted campaign ending autoplay also failed',
          mutedError,
        );

        finish(
          'playback-blocked',
        );
      }
    };

  updateState(
    'finish',
  );

  state =
    createInitialCampaignEndingFmvPlaybackState();

  element.dataset.playbackPhase =
    state.phase;

  return {
    element,
    video,
    start,
    finish,

    getState:
      () =>
        state,

    dispose:
      () => {
        if (
          disposed
        ) {
          return;
        }

        disposed =
          true;

        video.removeEventListener(
          'ended',
          onEnded,
        );

        video.removeEventListener(
          'error',
          onError,
        );

        skipButton.removeEventListener(
          'click',
          onSkipButtonClick,
        );

        element.removeEventListener(
          'click',
          onLayerClick,
        );

        window.removeEventListener(
          'keydown',
          onKeyDown,
        );

        video.pause();

        element.remove();
      },
  };
}