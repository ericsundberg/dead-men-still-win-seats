import {
  defaultGameDifficultyId,
  getGameDifficultySettings,
  type GameDifficultyId,
} from '../difficulty';
import type { CampaignEndGameState } from './campaign-end-game';

export interface CampaignResources {
  readonly cash: number;
  readonly favors: number;
  readonly actionPoints: number;
}

export interface CampaignMetrics {
  readonly publicSuspicion: number;
  readonly partyConfidence: number;
  readonly voterEnergy: number;
}

export interface CampaignPersonnel {
  readonly staffers: number;
  readonly surrogates: number;
}

export type CampaignTurnPhase =
  | 'turn-start'
  | 'resolving-events'
  | 'player-actions'
  | 'turn-end'
  | 'game-over';

export interface CampaignStartingValues {
  readonly resources: CampaignResources;
  readonly metrics: CampaignMetrics;
  readonly personnel?: Partial<CampaignPersonnel>;
}

export interface CampaignState {
  readonly difficultyId: GameDifficultyId;
  readonly currentTurn: number;
  readonly totalTurns: number;
  readonly phase: CampaignTurnPhase;

  readonly resources: CampaignResources;
  readonly metrics: CampaignMetrics;
  readonly personnel: CampaignPersonnel;

  readonly flags: readonly string[];

  readonly activeEventInstanceId: string | null;
  readonly queuedEventIds: readonly string[];
  readonly completedEventIds: readonly string[];

  readonly newsFeed: readonly string[];
  readonly endGameState: CampaignEndGameState | null;
}

export const defaultCampaignPersonnel: CampaignPersonnel = {
  staffers: 0,
  surrogates: 0,
};

export const defaultCampaignStartingValues: CampaignStartingValues = {
  resources: {
    cash: 100_000,
    favors: 3,
    actionPoints: 3,
  },

  metrics: {
    publicSuspicion: 0,
    partyConfidence: 100,
    voterEnergy: 100,
  },

  personnel: defaultCampaignPersonnel,
};

export function createInitialCampaignState(
  difficultyId: GameDifficultyId = defaultGameDifficultyId,
  startingValues: CampaignStartingValues = defaultCampaignStartingValues,
): CampaignState {
  const difficultySettings = getGameDifficultySettings(difficultyId);

  return {
    difficultyId,
    currentTurn: 1,
    totalTurns: difficultySettings.turnCount,
    phase: 'turn-start',

    resources: {
      ...startingValues.resources,
    },

    metrics: {
      ...startingValues.metrics,
    },

    personnel: {
      ...defaultCampaignPersonnel,
      ...startingValues.personnel,
    },

    flags: [],

    activeEventInstanceId: null,
    queuedEventIds: [],
    completedEventIds: [],

    newsFeed: [],
    endGameState: null,
  };
}