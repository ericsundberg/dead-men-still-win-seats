import {
  createAudioServices,
  type AudioServices,
} from '../audio/audio-services';
import {
  createGameSession,
  type GameSession,
} from '../game/game-session';
import { startBrowserConsoleRunner } from '../headless/browser-console-runner';
import { renderCreditsScene } from '../scenes/credits-scene';
import { renderGameSetupScene } from '../scenes/game-setup-scene';
import { renderLoadGameScene } from '../scenes/load-game-scene';
import { renderSettingsScene } from '../scenes/settings-scene';
import { renderTitleScene } from '../scenes/title-scene';
import { renderYearlyTurnScene } from '../scenes/yearly-turn-scene';
import { SceneRouter } from './scene-router';

export class AppController {
  private readonly audioServices: AudioServices;
  private readonly gameSession: GameSession;
  private readonly router: SceneRouter;

  public constructor(private readonly rootElement: HTMLElement) {
    this.audioServices = createAudioServices();
    this.gameSession = createGameSession();
    this.router = new SceneRouter(
      rootElement,
      this.audioServices,
      this.gameSession,
    );
    this.registerScenes();
  }

  public start(): void {
    this.audioServices.unlocker.bindToFirstGesture(this.rootElement);
    startBrowserConsoleRunner();
    this.router.navigate('title');
  }

  private registerScenes(): void {
    this.router.register('title', renderTitleScene);
    this.router.register('game-setup', renderGameSetupScene);
    this.router.register('yearly-turn', renderYearlyTurnScene);
    this.router.register('load-game', renderLoadGameScene);
    this.router.register('settings', renderSettingsScene);
    this.router.register('credits', renderCreditsScene);
  }
}