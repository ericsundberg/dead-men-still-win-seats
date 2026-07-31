import {
  makeElement,
  replaceChildren,
} from './dom-helpers';

export const gameViewportLogicalWidth =
  1_600;

export const gameViewportLogicalHeight =
  900;

export interface MountedGameViewport {
  readonly sceneRoot:
    HTMLElement;

  readonly dispose:
    () => void;
}

/**
 * Calculates one uniform scale for fitting the logical game
 * surface inside the available browser viewport.
 *
 * The smaller axis determines the scale so the complete game
 * surface always remains visible. Non-16:9 viewports receive
 * letterboxing rather than a rearranged interface.
 */
export function calculateGameViewportScale(
  availableWidth:
    number,

  availableHeight:
    number,
): number {
  const normalizedWidth =
    normalizeViewportDimension(
      availableWidth,
    );

  const normalizedHeight =
    normalizeViewportDimension(
      availableHeight,
    );

  if (
    normalizedWidth
      === null
    || normalizedHeight
      === null
  ) {
    return 1;
  }

  return Math.min(
    normalizedWidth
      / gameViewportLogicalWidth,

    normalizedHeight
      / gameViewportLogicalHeight,
  );
}

/**
 * Creates the permanent logical game surface.
 *
 * Individual scenes are routed into `sceneRoot`. The surface
 * itself remains mounted for the life of the application so
 * every scene receives identical viewport scaling.
 */
export function mountGameViewport(
  rootElement:
    HTMLElement,
): MountedGameViewport {
  const frame =
    makeElement(
      'div',
      {
        className:
          'game-viewport-frame',
      },
    );

  const sceneRoot =
    makeElement(
      'div',
      {
        className:
          'game-viewport',
      },
    );

  frame.append(
    sceneRoot,
  );

  replaceChildren(
    rootElement,
    frame,
  );

  const updateViewportScale =
    (): void => {
      const availableWidth =
        rootElement.clientWidth
        || globalThis.innerWidth;

      const availableHeight =
        rootElement.clientHeight
        || globalThis.innerHeight;

      const scale =
        calculateGameViewportScale(
          availableWidth,
          availableHeight,
        );

      frame.style.width =
        [
          gameViewportLogicalWidth
          * scale,

          'px',
        ].join('');

      frame.style.height =
        [
          gameViewportLogicalHeight
          * scale,

          'px',
        ].join('');

      sceneRoot.style.transform =
        `scale(${scale})`;

      sceneRoot.style.setProperty(
        '--game-viewport-scale',
        scale.toString(),
      );
    };

  updateViewportScale();

  globalThis.addEventListener(
    'resize',
    updateViewportScale,
  );

  return {
    sceneRoot,

    dispose:
      () => {
        globalThis.removeEventListener(
          'resize',
          updateViewportScale,
        );
      },
  };
}

function normalizeViewportDimension(
  value:
    number,
): number | null {
  if (
    !Number.isFinite(
      value,
    )
    || value <= 0
  ) {
    return null;
  }

  return value;
}