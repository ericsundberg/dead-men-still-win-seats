import './styles/base.css';
import './styles/layout.css';
import './styles/scenes.css';

import { AppController } from './app/app-controller';
import { applyUiScale } from './ui/ui-scale';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app root element.');
}

applyUiScale();

const controller = new AppController(app);
controller.start();