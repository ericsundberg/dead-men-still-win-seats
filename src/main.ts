import './styles/base.css';
import './styles/layout.css';
import './styles/scenes.css';

import { AppController } from './app/app-controller';
import { loadLocalizedText } from './localization/localized-text';
import { applyUiScale } from './ui/ui-scale';

async function startApp(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (!app) {
    throw new Error('Missing #app root element.');
  }

  await loadLocalizedText();

  applyUiScale();

  const controller = new AppController(app);
  controller.start();
}

startApp().catch((error: unknown) => {
  console.error('[app] failed to start', error);
});