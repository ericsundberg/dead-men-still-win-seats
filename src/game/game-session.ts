import { GameEngine } from '../core/game-engine';
import type { GameConfig } from '../core/game-config';
import type {
  AnnualReport,
  GameState,
  TurnCommand,
  TurnOutcome,
} from '../core/types';
import { defaultGameConfig } from '../content/default-game-config';
import { text } from '../localization/localized-text';
import { createChildCharacter } from './character-birth';
import { rollAnnualHealthChange, roundHealth } from './character-health';
import {
  gameStartYear,
  getCurrentAge,
  getRulerReignYear,
} from './game-calendar';
import {
  createStartingRulerCharacter,
  formatCharacterName,
  isCharacterDead,
  setCharacterRulership,
  startingHeirCharacterId,
  startingRulerCharacterId,
  toRulerProfile,
  updateCharacterHealth,
  type CharacterId,
  type GameCharacter,
} from './game-character';
import {
  getGameOverState,
  getGameStatus,
  type GameOverState,
  type GameStatus,
} from './game-status';
import {
  createRulerProfile,
  type RulerCreationInput,
  type RulerGender,
  type RulerProfile,
} from './ruler-profile';
import { selectNextRuler } from './succession';
import { createDefaultTurnCommand } from './yearly-command-defaults';

export interface AddChildInput {
  readonly givenName?: string;
  readonly familyName?: string;
  readonly gender?: RulerGender;
  readonly parentId?: CharacterId;
}

export class GameSession {
  private engine: GameEngine | null = null;
  private lastOutcome: TurnOutcome | null = null;
  private characters: GameCharacter[] = [];
  private currentRulerCharacterId: CharacterId | null = null;
  private nextGeneratedCharacterNumber = 2;
  private nextBirthOrder = 1;

  public constructor(
    private readonly config: GameConfig = defaultGameConfig,
    private readonly random: () => number = Math.random,
  ) {}

  public startNewGame(input: Partial<RulerCreationInput> | string): void {
    const rulerProfile = typeof input === 'string'
      ? createRulerProfile({ givenName: input })
      : createRulerProfile(input);

    const ruler = createStartingRulerCharacter(rulerProfile, gameStartYear);
    const startingChild = createChildCharacter({
      id: startingHeirCharacterId,
      givenName: text('characterDefaults.childGivenName'),
      familyName: ruler.familyName,
      birthYear: gameStartYear,
      birthOrder: this.nextBirthOrder,
      parent: ruler,
    });

    this.characters = [ruler, startingChild];
    this.currentRulerCharacterId = startingRulerCharacterId;
    this.nextGeneratedCharacterNumber = 2;
    this.nextBirthOrder = 2;
    this.engine = new GameEngine(this.config, formatCharacterName(ruler));
    this.lastOutcome = null;
  }

  public hasActiveGame(): boolean {
    return this.engine !== null;
  }

  public getStatus(): GameStatus {
    return getGameStatus(this.getState());
  }

  public isGameOver(): boolean {
    return this.getStatus() === 'ended';
  }

  public getGameOverState(): GameOverState | null {
    return getGameOverState(this.getState());
  }

  public getState(): GameState | null {
    return this.engine?.getState() ?? null;
  }

  public getAnnualReport(): AnnualReport | null {
    return this.engine?.getAnnualReport() ?? null;
  }

  public getLastOutcome(): TurnOutcome | null {
    return this.lastOutcome;
  }

  public getCharacters(): readonly GameCharacter[] {
    return this.characters;
  }

  public getCurrentRuler(): GameCharacter | null {
    if (!this.currentRulerCharacterId) {
      return null;
    }

    return this.characters.find(
      (character) => character.id === this.currentRulerCharacterId,
    ) ?? null;
  }

  public getHeir(): GameCharacter | null {
    const state = this.getState();
    const ruler = this.getCurrentRuler();

    if (!state || !ruler) {
      return null;
    }

    return selectNextRuler(this.characters, ruler, state);
  }

  public getCurrentRulerName(): string | null {
    const ruler = this.getCurrentRuler();

    if (!ruler) {
      return null;
    }

    return formatCharacterName(ruler);
  }

  public getRulerProfile(): RulerProfile | null {
    const ruler = this.getCurrentRuler();

    if (!ruler) {
      return null;
    }

    return toRulerProfile(ruler);
  }

  public getRulerAge(): number | null {
    const state = this.getState();
    const ruler = this.getCurrentRuler();

    if (!state || !ruler) {
      return null;
    }

    return getCurrentAge(ruler, state);
  }

  public getRulerHealth(): number | null {
    return this.getCurrentRuler()?.health ?? null;
  }

  public getRulerReignYear(): number | null {
    const state = this.getState();
    const ruler = this.getCurrentRuler();

    if (!state || !ruler) {
      return null;
    }

    return getRulerReignYear(ruler, state);
  }

  public getGameStartYear(): number {
    return gameStartYear;
  }

  public addChildToCurrentRuler(input: AddChildInput = {}): GameCharacter | null {
    const ruler = this.getCurrentRuler();

    if (!ruler) {
      return null;
    }

    return this.addChildToCharacter({
      ...input,
      parentId: ruler.id,
    });
  }

  public addChildToCharacter(input: AddChildInput): GameCharacter | null {
    const state = this.getState();

    if (!state || !input.parentId) {
      return null;
    }

    const parent = this.characters.find(
      (character) => character.id === input.parentId,
    );

    if (!parent || isCharacterDead(parent)) {
      return null;
    }

    const child = createChildCharacter({
      id: this.createNextCharacterId(),
      givenName: input.givenName ?? text('characterDefaults.childGivenName'),
      familyName: input.familyName ?? parent.familyName,
      birthYear: state.year,
      birthOrder: this.nextBirthOrder,
      parent,
      gender: input.gender,
    });

    this.nextBirthOrder += 1;
    this.characters = [...this.characters, child];

    return child;
  }

  public damageCurrentRulerHealth(amount: number): GameCharacter | null {
    const ruler = this.getCurrentRuler();

    if (!ruler) {
      return null;
    }

    const normalizedAmount = Number.isFinite(amount)
      ? Math.max(0, roundHealth(amount))
      : 0;

    this.characters = this.characters.map((character) => {
      if (character.id !== ruler.id) {
        return character;
      }

      return updateCharacterHealth(character, character.health - normalizedAmount);
    });

    this.resolveRulerSuccession();

    return this.getCurrentRuler();
  }

  public getSuggestedTurnCommand(): TurnCommand | null {
    const state = this.getState();

    if (!state || this.isGameOver()) {
      return null;
    }

    return createDefaultTurnCommand(state, this.config);
  }

  public processTurn(command: TurnCommand): TurnOutcome | null {
    if (!this.engine || this.isGameOver()) {
      return null;
    }

    const previousState = this.getState();
    const outcome = this.engine.processTurn(command);

    if (previousState) {
      this.applyNaturalAging(previousState, outcome.nextState);
    }

    this.lastOutcome = outcome;

    return outcome;
  }

  private applyNaturalAging(
    previousState: GameState,
    nextState: GameState,
  ): void {
    this.characters = this.characters.map((character) => {
      const previousAge = getCurrentAge(character, previousState);
      const nextAge = getCurrentAge(character, nextState);
      const healthDelta = rollAnnualHealthChange(
        previousAge,
        nextAge,
        this.random,
      );

      return updateCharacterHealth(character, character.health + healthDelta);
    });

    this.resolveRulerSuccession();
  }

  private resolveRulerSuccession(): void {
    const ruler = this.getCurrentRuler();
    const state = this.getState();

    if (!ruler || !state || !isCharacterDead(ruler)) {
      return;
    }

    const successor = selectNextRuler(this.characters, ruler, state);

    if (!successor) {
      return;
    }

    const reignStartYear = state.year;
    const newChild = createChildCharacter({
      id: this.createNextCharacterId(),
      givenName: text('characterDefaults.childGivenName'),
      familyName: successor.familyName,
      birthYear: reignStartYear,
      birthOrder: this.nextBirthOrder,
      parent: successor,
    });

    this.nextBirthOrder += 1;

    const updatedCharacters = this.characters.map((character) => {
      if (character.id === ruler.id) {
        return {
          ...character,
          isRuler: false,
        };
      }

      if (character.id === successor.id) {
        return setCharacterRulership(character, true, reignStartYear);
      }

      return character;
    });

    this.characters = [...updatedCharacters, newChild];
    this.currentRulerCharacterId = successor.id;
  }

  private createNextCharacterId(): CharacterId {
    const characterId = `character-child-${this.nextGeneratedCharacterNumber}`;

    this.nextGeneratedCharacterNumber += 1;

    return characterId;
  }
}

export function createGameSession(random?: () => number): GameSession {
  return new GameSession(defaultGameConfig, random);
}