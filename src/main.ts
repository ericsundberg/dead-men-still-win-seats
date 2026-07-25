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

  const controller =
    new AppController(
      app,
      eventRegistry,
    );

  controller.start();
}

startApp().catch(
  (error: unknown) => {
    console.error(
      '[app] failed to start',
      error,
    );
  },
);