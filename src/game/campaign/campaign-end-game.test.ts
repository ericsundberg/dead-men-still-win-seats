import { describe, expect, it } from 'vitest';
import {
  evaluateCampaignEndGame,
} from './campaign-end-game';
import {
  createInitialCampaignState,
  type CampaignMetrics,
  type CampaignState,
  type CampaignTurnPhase,
} from './campaign-state';

interface TestCampaignStateOptions {
  readonly currentTurn?: number;
  readonly totalTurns?: number;
  readonly phase?: CampaignTurnPhase;
  readonly metrics?: Partial<CampaignMetrics>;
}

function createTestCampaignState(
  options: TestCampaignStateOptions = {},
): CampaignState {
  const campaignState = createInitialCampaignState();

  return {
    ...campaignState,
    currentTurn: options.currentTurn ?? campaignState.currentTurn,
    totalTurns: options.totalTurns ?? campaignState.totalTurns,
    phase: options.phase ?? 'player-actions',

    metrics: {
      ...campaignState.metrics,
      ...options.metrics,
    },
  };
}

describe('campaign end-game evaluation', () => {
  it('ends immediately when public suspicion reaches one hundred', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 4,
      metrics: {
        publicSuspicion: 100,
      },
    });

    expect(evaluateCampaignEndGame(campaignState)).toEqual({
      type: 'public-discovers-death',
      triggeredOnTurn: 4,
    });
  });

  it('ends immediately when party confidence reaches zero', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 6,
      metrics: {
        partyConfidence: 0,
      },
    });

    expect(evaluateCampaignEndGame(campaignState)).toEqual({
      type: 'party-dumps-senator',
      triggeredOnTurn: 6,
    });
  });

  it('does not end early when voter energy reaches zero', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 5,
      totalTurns: 13,
      phase: 'turn-end',
      metrics: {
        voterEnergy: 0,
      },
    });

    expect(evaluateCampaignEndGame(campaignState)).toBeNull();
  });

  it('does not resolve the election before the final turn ends', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 13,
      totalTurns: 13,
      phase: 'player-actions',
    });

    expect(evaluateCampaignEndGame(campaignState)).toBeNull();
  });

  it('loses reelection when the final turn ends with no voter energy', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 13,
      totalTurns: 13,
      phase: 'turn-end',
      metrics: {
        voterEnergy: 0,
      },
    });

    expect(evaluateCampaignEndGame(campaignState)).toEqual({
      type: 'lose-reelection',
      triggeredOnTurn: 13,
    });
  });

  it('wins reelection when the final turn ends without a loss condition', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 13,
      totalTurns: 13,
      phase: 'turn-end',
      metrics: {
        voterEnergy: 1,
      },
    });

    expect(evaluateCampaignEndGame(campaignState)).toEqual({
      type: 'win-reelection',
      triggeredOnTurn: 13,
    });
  });

  it('prioritizes public discovery over other endings', () => {
    const campaignState = createTestCampaignState({
      currentTurn: 13,
      totalTurns: 13,
      phase: 'turn-end',
      metrics: {
        publicSuspicion: 100,
        partyConfidence: 0,
        voterEnergy: 0,
      },
    });

    expect(evaluateCampaignEndGame(campaignState)?.type).toBe(
      'public-discovers-death',
    );
  });
});