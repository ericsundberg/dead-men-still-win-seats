import type { CampaignState } from './campaign-state';

export type CampaignEndGameType =
  | 'public-discovers-death'
  | 'party-dumps-senator'
  | 'lose-reelection'
  | 'win-reelection';

export interface CampaignEndGameState {
  readonly type: CampaignEndGameType;
  readonly triggeredOnTurn: number;
}

export function evaluateCampaignEndGame(
  campaignState: CampaignState,
): CampaignEndGameState | null {
  if (campaignState.metrics.publicSuspicion >= 100) {
    return {
      type: 'public-discovers-death',
      triggeredOnTurn: campaignState.currentTurn,
    };
  }

  if (campaignState.metrics.partyConfidence <= 0) {
    return {
      type: 'party-dumps-senator',
      triggeredOnTurn: campaignState.currentTurn,
    };
  }

  if (!hasCompletedFinalTurn(campaignState)) {
    return null;
  }

  if (campaignState.metrics.voterEnergy <= 0) {
    return {
      type: 'lose-reelection',
      triggeredOnTurn: campaignState.currentTurn,
    };
  }

  return {
    type: 'win-reelection',
    triggeredOnTurn: campaignState.currentTurn,
  };
}

function hasCompletedFinalTurn(
  campaignState: CampaignState,
): boolean {
  return campaignState.phase === 'turn-end'
    && campaignState.currentTurn >= campaignState.totalTurns;
}