export const titleIdleIntroTrackId =
  'main-menu-theme';

export const titleIdleIntroLoopTarget =
  3;

export interface TitleIdleIntroState {
  readonly completedLoops:
    number;

  readonly shouldStartIntro:
    boolean;
}

export function createInitialTitleIdleIntroState():
  TitleIdleIntroState {
  return {
    completedLoops:
      0,

    shouldStartIntro:
      false,
  };
}

export function recordTitleIdleMusicLoop(
  state:
    TitleIdleIntroState,

  trackId:
    string,
): TitleIdleIntroState {
  if (
    state.shouldStartIntro
    || trackId
      !== titleIdleIntroTrackId
  ) {
    return state;
  }

  const completedLoops =
    state.completedLoops
    + 1;

  return {
    completedLoops,

    shouldStartIntro:
      completedLoops
      >= titleIdleIntroLoopTarget,
  };
}
