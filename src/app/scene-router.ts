import type { AudioServices } from '../audio/audio-services';
import type { GameSession } from '../game/game-session';
import { replaceChildren } from '../ui/dom-helpers';

export type SceneName =
  | 'title'
  | 'game-setup'
  | 'yearly-turn'
  | 'load-game'
  | 'settings'
  | 'credits';

export type NavigateToScene = (sceneName: SceneName) => void;

export interface SceneContext {
  readonly navigate: NavigateToScene;
  readonly audio: AudioServices;
  readonly game: GameSession;
}

export type SceneRenderer = (context: SceneContext) => HTMLElement;

export class SceneRouter {
  private readonly scenes = new Map<SceneName, SceneRenderer>();

  public constructor(
    private readonly rootElement: HTMLElement,
    private readonly audioServices: AudioServices,
    private readonly gameSession: GameSession,
  ) {}

  public register(sceneName: SceneName, renderer: SceneRenderer): void {
    this.scenes.set(sceneName, renderer);
  }

  public navigate(sceneName: SceneName): void {
    const renderer = this.scenes.get(sceneName);

    if (!renderer) {
      throw new Error(`Scene is not registered: ${sceneName}`);
    }

    const sceneElement = renderer({
      navigate: (nextSceneName) => this.navigate(nextSceneName),
      audio: this.audioServices,
      game: this.gameSession,
    });

    replaceChildren(this.rootElement, sceneElement);
    console.log(`[scene] ${sceneName}`);
  }
}