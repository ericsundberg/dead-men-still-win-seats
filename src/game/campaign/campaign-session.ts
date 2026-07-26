import {
  defaultGameDifficultyId,
  type GameDifficultyId,
} from '../difficulty';
import {
  getCampaignActionDefinition,
  performCampaignAction,
  type CampaignActionId,
  type CampaignActionResult,
} from './campaign-actions';
import {
  applyCampaignEffects,
  type CampaignEffects,
} from './campaign-effects';
import {
  evaluateCampaignEndGame,
} from './campaign-end-game';
import {
  resolveCampaignEventDecision,
  type CampaignEventDecisionResult,
} from './campaign-event-decisions';
import {
  activateNextCampaignEvent,
} from './campaign-event-runner';
import {
  createInitialCampaignState,
  defaultCampaignStartingValues,
  type CampaignState,
} from './campaign-state';
import {
  createEventRegistry,
  type EventRegistry,
} from '../../events/event-registry';
import type {
  EventDecisionId,
  EventId,
  GameEventDefinition,
} from '../../events/event-types';

export type CampaignStateListener = (
  state: CampaignState | null,
) => void;

/**
 * Owns the active political campaign state.
 *
 * The campaign runtime runs alongside the temporary legacy
 * GameSession. New campaign systems should change campaign state
 * through this session rather than modifying CampaignState
 * directly inside scene components.
 */
export class CampaignSession {
  public constructor(
    private readonly eventRegistry:
      EventRegistry =
        createEventRegistry(),

    private readonly random:
      () => number =
        Math.random,
  ) {}

  private state:
    CampaignState | null = null;

  private readonly listeners =
    new Set<CampaignStateListener>();

  /**
   * Starts a new campaign and processes its first turn-start
   * event selection.
   *
   * When an eligible event activates, the campaign enters
   * "resolving-events". Otherwise it enters "player-actions".
   */
  public startCampaign(
    difficultyId:
      GameDifficultyId =
        defaultGameDifficultyId,
  ): CampaignState {
    const initialState =
      createInitialCampaignState(
        difficultyId,
      );

    const activationResult =
      activateNextCampaignEvent(
        initialState,
        this.eventRegistry,
        this.random,
      );

    this.setState(
      activationResult.nextState,
    );

    return activationResult.nextState;
  }

  public hasActiveCampaign():
    boolean {
    return this.state !== null;
  }

  public getState():
    CampaignState | null {
    return this.state;
  }

  /**
   * Returns the event IDs loaded from public event packs.
   */
  public getRegisteredEventIds():
    readonly EventId[] {
    return this.eventRegistry
      .getEventIds();
  }

  /**
   * Retrieves one loaded event definition without exposing the
   * registry itself for mutation.
   */
  public getEventDefinition(
    eventId:
      EventId,
  ): GameEventDefinition | null {
    return this.eventRegistry
      .getEvent(
        eventId,
      );
  }

  /**
   * Returns the definition for the event currently awaiting a
   * player decision.
   *
   * Optional event metadata such as imagePath remains available
   * to the eventual event panel through this definition.
   */
  public getActiveEventDefinition():
    GameEventDefinition | null {
    const activeEventInstanceId =
      this.state
        ?.activeEventInstanceId;

    if (
      !activeEventInstanceId
    ) {
      return null;
    }

    return this.eventRegistry
      .getEvent(
        activeEventInstanceId as EventId,
      );
  }

  public getDifficultyId():
    GameDifficultyId | null {
    return (
      this.state?.difficultyId
      ?? null
    );
  }

  public getCurrentTurn():
    number | null {
    return (
      this.state?.currentTurn
      ?? null
    );
  }

  public getTotalTurns():
    number | null {
    return (
      this.state?.totalTurns
      ?? null
    );
  }

  public isGameOver():
    boolean {
    return (
      this.state?.phase
      === 'game-over'
    );
  }

  /**
   * Performs one registered campaign action.
   *
   * The pure campaign-action module resolves requirements and
   * effects. This session owns committing the resulting state,
   * evaluating immediate end-game conditions, and notifying
   * subscribers.
   *
   * A rejected action returns its failure result without changing
   * session state or notifying subscribers.
   */
  public performAction(
    actionId:
      CampaignActionId,
  ): CampaignActionResult | null {
    const currentState =
      this.state;

    if (
      !currentState
      || currentState.phase
        === 'game-over'
    ) {
      return null;
    }

    const action =
      getCampaignActionDefinition(
        actionId,
      );

    const actionResult =
      performCampaignAction(
        currentState,
        action,
      );

    if (
      !actionResult.performed
    ) {
      return actionResult;
    }

    const nextState =
      this.commitAffectedState(
        actionResult.nextState,
      );

    return {
      ...actionResult,
      nextState,
    };
  }

    /**
   * Resolves a decision for the currently active campaign event.
   *
   * The pure event-decision resolver applies effects, flags,
   * queued events, news, and event completion. This session then
   * commits the resulting state and evaluates immediate game-over
   * conditions.
   */
  public chooseEventDecision(
    decisionId:
      EventDecisionId,
  ): CampaignEventDecisionResult | null {
    const currentState =
      this.state;

    const activeEvent =
      this.getActiveEventDefinition();

    if (
      !currentState
      || !activeEvent
      || currentState.phase
        === 'game-over'
    ) {
      return null;
    }

    const decisionResult =
      resolveCampaignEventDecision(
        currentState,
        activeEvent,
        decisionId,
      );

    if (
      !decisionResult.performed
    ) {
      return decisionResult;
    }

    const nextState =
      this.commitAffectedState(
        decisionResult.nextState,
      );

    return {
      ...decisionResult,
      nextState,
    };
  }

  /**
   * Applies resource and metric changes to the active campaign.
   *
   * CampaignEffects performs the numerical bounds checking:
   *
   * - Resources cannot fall below zero.
   * - Public metrics remain between zero and one hundred.
   * - Non-finite changes are ignored.
   *
   * Immediate campaign-ending conditions are evaluated after the
   * effects are applied. For example, reaching one hundred public
   * suspicion ends the campaign without waiting for turn end.
   */
  public applyEffects(
    effects:
      CampaignEffects,
  ): CampaignState | null {
    const currentState =
      this.state;

    if (
      !currentState
      || currentState.phase
        === 'game-over'
    ) {
      return null;
    }

    const affectedState =
      applyCampaignEffects(
        currentState,
        effects,
      );

    return this.commitAffectedState(
      affectedState,
    );
  }

  /**
   * Completes the current campaign turn.
   *
   * During the current migration stage:
   *
   * 1. The campaign enters "turn-end".
   * 2. Active surrogates affect public metrics.
   * 3. End-game conditions are evaluated.
   * 4. If the campaign continues, the turn increments.
   * 5. Action points replenish for the next turn.
   * 6. Turn-start event activation runs for the new turn.
   */
  public endTurn():
    CampaignState | null {
    const currentState =
      this.state;

    if (
      !currentState
      || currentState.phase
        !== 'player-actions'
    ) {
      return null;
    }

    const surrogateCount =
      currentState
        .personnel
        .surrogates;

    /*
     * Each active surrogate improves voter energy and party
     * confidence, but creates another opportunity for the public
     * to notice that Senator Buster is nowhere to be found.
     */
    const turnEndState:
      CampaignState =
        applyCampaignEffects(
          {
            ...currentState,

            phase:
              'turn-end',
          },
          {
            publicSuspicion:
              surrogateCount,

            partyConfidence:
              surrogateCount,

            voterEnergy:
              surrogateCount
              * 2,
          },
        );

    const endGameState =
      evaluateCampaignEndGame(
        turnEndState,
      );

    if (endGameState) {
      const completedState:
        CampaignState = {
          ...turnEndState,
          phase: 'game-over',
          endGameState,
        };

      this.setState(
        completedState,
      );

      return completedState;
    }

    const nextTurnState:
      CampaignState = {
        ...turnEndState,

        currentTurn:
          turnEndState.currentTurn
          + 1,

        phase:
          'turn-start',

        resources: {
          ...turnEndState.resources,

          actionPoints:
            defaultCampaignStartingValues
              .resources
              .actionPoints
            + turnEndState
              .personnel
              .staffers,
        },

        activeEventInstanceId:
          null,

        endGameState:
          null,
      };

    const activationResult =
      activateNextCampaignEvent(
        nextTurnState,
        this.eventRegistry,
        this.random,
      );

    this.setState(
      activationResult.nextState,
    );

    return activationResult.nextState;
  }

  /**
   * Subscribes to campaign-state changes.
   *
   * The listener receives the current state immediately, then
   * receives each later state produced by this session.
   */
  public subscribe(
    listener:
      CampaignStateListener,
  ): () => void {
    this.listeners.add(
      listener,
    );

    listener(
      this.state,
    );

    return () => {
      this.listeners.delete(
        listener,
      );
    };
  }

  /**
   * Commits a state produced by campaign effects.
   *
   * This shared path ensures direct effects and registered actions
   * receive identical immediate end-game handling.
   */
  private commitAffectedState(
    affectedState:
      CampaignState,
  ): CampaignState {
    const endGameState =
      evaluateCampaignEndGame(
        affectedState,
      );

    if (endGameState) {
      const completedState:
        CampaignState = {
          ...affectedState,

          phase:
            'game-over',

          endGameState,
        };

      this.setState(
        completedState,
      );

      return completedState;
    }

    this.setState(
      affectedState,
    );

    return affectedState;
  }

  private setState(
    state: CampaignState,
  ): void {
    this.state = state;

    this.notifyStateChanged();
  }

  private notifyStateChanged():
    void {
    for (
      const listener
      of this.listeners
    ) {
      listener(
        this.state,
      );
    }
  }
}

export function createCampaignSession(
  eventRegistry:
    EventRegistry =
      createEventRegistry(),

  random:
    () => number =
      Math.random,
): CampaignSession {
  return new CampaignSession(
    eventRegistry,
    random,
  );
}