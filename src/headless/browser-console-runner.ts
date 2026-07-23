import { runScriptedHeadlessGame } from './scripted-game-runner';

let hasStarted = false;

export function startBrowserConsoleRunner(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;

  console.groupCollapsed('[headless] scripted browser run');

  for (const line of runScriptedHeadlessGame()) {
    if (line.length === 0) {
      console.log('');
      continue;
    }

    console.log(line);
  }

  console.groupEnd();
}