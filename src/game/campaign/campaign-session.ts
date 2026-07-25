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
  createInitialCampaignState,
  defaultCampaignStartingValues,
  type CampaignState,
} from './campaign-state';
import {
  createEventRegistry,
  type EventRegistry,
} from '../../events/event-registry';
import type {
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
  ) {}

  private state:
    CampaignState | null = null;

  private readonly listeners =
    new Set<CampaignStateListener>();

  /**
   * Starts a new campaign using the selected difficulty.
   *
   * The raw initial campaign state begins in "turn-start".
   * Until the event-resolution pipeline is implemented, the
   * session advances immediately to "player-actions".
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

    const activeState:
      CampaignState = {
        ...initialState,
        phase: 'player-actions',
      };

    this.setState(
      activeState,
    );

    return activeState;
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
   *
   * Event activation will use this registry in a later
   * checkpoint.
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
   * 2. End-game conditions are evaluated.
   * 3. If the campaign continues, the turn increments.
   * 4. Action points replenish for the next turn.
   * 5. The campaign returns to "player-actions".
   *
   * Mandatory-event validation and turn-start event processing
   * will be added in later migration checkpoints.
   */
  public endTurn():
    CampaignState | null {
    const currentState =
      this.state;

    if (
      !currentState
      || currentState.phase
        === 'game-over'
    ) {
      return null;
    }

    const turnEndState:
      CampaignState = {
        ...currentState,
        phase: 'turn-end',
      };

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
          'player-actions',

        resources: {
          ...turnEndState.resources,

          actionPoints:
            defaultCampaignStartingValues
              .resources
              .actionPoints,
        },

        activeEventInstanceId:
          null,

        endGameState:
          null,
      };

    this.setState(
      nextTurnState,
    );

    return nextTurnState;
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
): CampaignSession {
  return new CampaignSession(
    eventRegistry,
  );
}