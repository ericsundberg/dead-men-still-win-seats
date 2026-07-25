import type {
  SceneContext,
  SceneName,
} from '../app/scene-router';

export const startupSceneFadeDurationMs = 600;

export interface BindStartupSceneAdvanceOptions {
  readonly scene: HTMLElement;
  readonly context: SceneContext;
  readonly nextScene: SceneName;
  readonly durationMs?: number;
  readonly beforeAdvance?: () => void;
  readonly fadeOnAdvance?: boolean;
}

/**
 * Advances a startup scene after its duration, a click anywhere
 * in the scene, or an Enter key press.
 *
 * The requested duration includes the final fade-out.
 */
export function bindStartupSceneAdvance(
  options: BindStartupSceneAdvanceOptions,
): () => void {
  let hasAdvanced = false;
  let advanceTimer: number | null = null;

  const transitionDurationMs = (
    options.fadeOnAdvance === false
    || prefersReducedMotion()
    )
    ? 0
    : startupSceneFadeDurationMs;

  function cleanup(): void {
    if (advanceTimer !== null) {
      window.clearTimeout(advanceTimer);
      advanceTimer = null;
    }

    options.scene.removeEventListener(
      'click',
      handleClick,
    );

    window.removeEventListener(
      'keydown',
      handleKeyDown,
    );
  }

  function navigateToNextScene(): void {
    options.context.navigate(options.nextScene);
  }

  function advance(): void {
    if (hasAdvanced) {
      return;
    }

    hasAdvanced = true;
    cleanup();
    options.beforeAdvance?.();

    if (transitionDurationMs === 0) {
      navigateToNextScene();
      return;
    }

    options.scene.classList.add('is-leaving');

    window.setTimeout(
      navigateToNextScene,
      transitionDurationMs,
    );
  }

  function handleClick(): void {
    advance();
  }

    function handleKeyDown(
    event: KeyboardEvent,
    ): void {
    if (event.repeat) {
        return;
    }

    event.preventDefault();
    advance();
    }

  options.scene.addEventListener(
    'click',
    handleClick,
  );

  window.addEventListener(
    'keydown',
    handleKeyDown,
  );

  if (options.durationMs !== undefined) {
    const delayBeforeFade = Math.max(
      0,
      options.durationMs - transitionDurationMs,
    );

    advanceTimer = window.setTimeout(
      advance,
      delayBeforeFade,
    );
  }

  return advance;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
}