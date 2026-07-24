import {
  createAudioServices,
  type AudioServices,
} from '../audio/audio-services';
import {
  createGameSession,
  type GameSession,
} from '../game/game-session';
import { startBrowserConsoleRunner } from '../headless/browser-console-runner';
import { renderBrandingScene } from '../scenes/branding-scene';
import { renderDisclaimerScene } from '../scenes/disclaimer-scene';
import { renderIntroScene } from '../scenes/intro-scene';
import { renderCreditsScene } from '../scenes/credits-scene';
import { renderGameSetupScene } from '../scenes/game-setup-scene';
import { renderLoadGameScene } from '../scenes/load-game-scene';
import { renderSettingsScene } from '../scenes/settings-scene';
import { renderTitleScene } from '../scenes/title-scene';
import {
  renderCampaignScene,
} from '../scenes/campaign-scene';
import { bindButtonBrushSfx } from '../ui/button-sfx';
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
    this.audioServices.unlocker.bindToFirstGesture(
      this.rootElement,
    );

    bindButtonBrushSfx(
      this.rootElement,
      this.audioServices,
    );

    startBrowserConsoleRunner();
    this.router.navigate('branding');
  }

  private registerScenes(): void {
    this.router.register(
      'branding',
      renderBrandingScene,
    );

    this.router.register(
      'disclaimer',
      renderDisclaimerScene,
    );

    this.router.register(
      'intro',
      renderIntroScene,
    );

    this.router.register('title', renderTitleScene);
    this.router.register(
      'game-setup',
      renderGameSetupScene,
    );
    this.router.register(
      'campaign',
      renderCampaignScene,
    );

    /*
    * Transitional alias for older navigation calls.
    */
    this.router.register(
      'yearly-turn',
      renderCampaignScene,
    );
    this.router.register(
      'load-game',
      renderLoadGameScene,
    );
    this.router.register(
      'settings',
      renderSettingsScene,
    );
    this.router.register(
      'credits',
      renderCreditsScene,
    );
  }
}