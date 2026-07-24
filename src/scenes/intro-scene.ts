import type {
  SceneContext,
} from '../app/scene-router';
import { makeElement } from '../ui/dom-helpers';
import {
  bindStartupSceneAdvance,
} from './startup-scene-navigation';

const introVideoPath =
  `${import.meta.env.BASE_URL}assets/video/intro.mp4`;

export function renderIntroScene(
  context: SceneContext,
): HTMLElement {
  const scene = makeElement('section', {
    className:
      'scene startup-scene intro-scene',
  });

  scene.setAttribute(
    'aria-label',
    'Game introduction',
  );

  const video = document.createElement('video');

  video.className =
    'startup-scene-content intro-video';
  video.src = introVideoPath;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';

  video.setAttribute(
    'aria-label',
    'Game introduction video',
  );

  scene.append(video);

  let hasFinished = false;

  const advance = bindStartupSceneAdvance({
    scene,
    context,
    nextScene: 'title',
    beforeAdvance: () => {
      hasFinished = true;
      video.pause();
    },
  });

  video.addEventListener(
    'ended',
    advance,
    { once: true },
  );

  video.addEventListener(
    'error',
    () => {
      console.warn(
        `[video] failed to load intro video: ${introVideoPath}`,
      );

      advance();
    },
    { once: true },
  );

  /**
   * Try audible playback first. Browsers may reject that when
   * the user has not interacted with the page, so retry muted.
   */
  const startVideo = async (): Promise<void> => {
    try {
      await video.play();
    } catch (error) {
      if (hasFinished) {
        return;
      }

      console.warn(
        '[video] audible intro autoplay was blocked; retrying muted',
        error,
      );

      video.muted = true;

      try {
        await video.play();
      } catch (mutedError) {
        if (hasFinished) {
          return;
        }

        console.warn(
          '[video] muted intro autoplay also failed',
          mutedError,
        );

        advance();
      }
    }
  };

  /*
   * Wait until SceneRouter has inserted the returned scene
   * into the document before explicitly starting playback.
   */
  window.setTimeout(() => {
    if (!hasFinished) {
      void startVideo();
    }
  }, 0);

  return scene;
}