import './styles/index.css';

import {
  AppController,
} from './app/app-controller';
import {
  loadPublicEventRegistry,
} from './events/event-pack-loader';
import {
  loadLocalizedText,
} from './localization/localized-text';
import {
  mountGameViewport,
} from './ui/game-viewport';
import {
  applyUiScale,
} from './ui/ui-scale';

async function startApp():
  Promise<void> {
  const app =
    document.querySelector<HTMLDivElement>(
      '#app',
    );

  if (!app) {
    throw new Error(
      'Missing #app root element.',
    );
  }

  await loadLocalizedText();

  const eventRegistry =
    await loadPublicEventRegistry({
      baseUrl:
        import.meta.env.BASE_URL,
    });

  applyUiScale();

  /*
   * Mount one persistent 1600 by 900 logical game surface.
   *
   * Scene routing occurs inside this surface. Its automatic
   * viewport scale remains independent from the user-controlled
   * accessibility UI scale.
   */
  const gameViewport =
    mountGameViewport(
      app,
    );

  globalThis.addEventListener(
    'pagehide',
    gameViewport.dispose,
    {
      once:
        true,
    },
  );

  const controller =
    new AppController(
      gameViewport.sceneRoot,
      eventRegistry,
    );

  controller.start();
}

startApp().catch(
  (
    error:
      unknown,
  ) => {
    console.error(
      '[app] failed to start',
      error,
    );
  },
);