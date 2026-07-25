import {
  createAudioServices,
  type AudioServices,
} from '../audio/audio-services';
import type {
  EventRegistry,
} from '../events/event-registry';
import {
  createCampaignSession,
  type CampaignSession,
} from '../game/campaign/campaign-session';
import {
  createGameSession,
  type GameSession,
} from '../game/game-session';
import {
  startBrowserConsoleRunner,
} from '../headless/browser-console-runner';
import {
  renderBrandingScene,
} from '../scenes/branding-scene';
import {
  renderCampaignScene,
} from '../scenes/campaign-scene';
import {
  renderCreditsScene,
} from '../scenes/credits-scene';
import {
  renderDisclaimerScene,
} from '../scenes/disclaimer-scene';
import {
  renderGameSetupScene,
} from '../scenes/game-setup-scene';
import {
  renderIntroScene,
} from '../scenes/intro-scene';
import {
  renderLoadGameScene,
} from '../scenes/load-game-scene';
import {
  renderSettingsScene,
} from '../scenes/settings-scene';
import {
  renderTitleScene,
} from '../scenes/title-scene';
import {
  bindButtonBrushSfx,
} from '../ui/button-sfx';
import {
  SceneRouter,
} from './scene-router';

export class AppController {
  private readonly audioServices:
    AudioServices;

  /*
   * Temporary legacy runtime used by the existing Hamurabi
   * placeholder interface.
   */
  private readonly gameSession:
    GameSession;

  /*
   * Political campaign runtime.
   *
   * Public event packs are loaded before this controller is
   * constructed and passed into CampaignSession here.
   */
  private readonly campaignSession:
    CampaignSession;

  private readonly router:
    SceneRouter;

  public constructor(
    private readonly rootElement:
      HTMLElement,

    eventRegistry:
      EventRegistry,
  ) {
    this.audioServices =
      createAudioServices();

    this.gameSession =
      createGameSession();

    this.campaignSession =
      createCampaignSession(
        eventRegistry,
      );

    this.router =
      new SceneRouter(
        rootElement,
        this.audioServices,
        this.gameSession,
        this.campaignSession,
      );

    this.registerScenes();
  }

  public start(): void {
    this.audioServices
      .unlocker
      .bindToFirstGesture(
        this.rootElement,
      );

    bindButtonBrushSfx(
      this.rootElement,
      this.audioServices,
    );

    startBrowserConsoleRunner();

    this.router.navigate(
      'branding',
    );
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

    this.router.register(
      'title',
      renderTitleScene,
    );

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
     *
     * This remains until every yearly-turn reference has been
     * migrated to the campaign scene.
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