import type { SceneContext } from '../app/scene-router';
import { makeButton, makeElement } from '../ui/dom-helpers';

export function renderLoadGameScene(context: SceneContext): HTMLElement {
  const scene = makeElement('section', {
    className: 'scene',
  });

  const panel = makeElement('div', {
    className: 'scene-panel',
  });

  const title = makeElement('h1', {
    textContent: 'Load Game',
  });

  const description = makeElement('p', {
    className: 'scene-description',
    textContent: 'Upload a JSON save file. Save validation will be added with the save system.',
  });

  const input = document.createElement('input');

  input.type = 'file';
  input.accept = 'application/json,.json';

  input.addEventListener('change', () => {
    const selectedFile = input.files?.item(0);

    if (!selectedFile) {
      return;
    }

    console.log(`[ui] selected save file: ${selectedFile.name}`);
    console.log('[headless] command: load-game');
    console.log('[headless] save codec is not wired yet');
  });

  panel.append(
    title,
    description,
    input,
    makeButton('Back', () => context.navigate('title'), 'secondary-button', {
      onBeforeClick: () => context.audio.sfx.play('button-cancel'),
    }),
  );

  scene.append(panel);

  return scene;
}
