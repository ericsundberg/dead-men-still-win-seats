import { runScriptedHeadlessGame } from './scripted-game-runner';

for (const line of runScriptedHeadlessGame()) {
  console.log(line);
}