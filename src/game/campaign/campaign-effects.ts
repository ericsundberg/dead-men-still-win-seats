import type { CampaignState } from './campaign-state';

export interface CampaignEffects {
  readonly cash?: number;
  readonly favors?: number;
  readonly actionPoints?: number;

  readonly publicSuspicion?: number;
  readonly partyConfidence?: number;
  readonly voterEnergy?: number;
}

export function applyCampaignEffects(
  campaignState: CampaignState,
  effects: CampaignEffects,
): CampaignState {
  return {
    ...campaignState,

    resources: {
      cash: applyBoundedChange(
        campaignState.resources.cash,
        effects.cash,
        0,
      ),

      favors: applyBoundedChange(
        campaignState.resources.favors,
        effects.favors,
        0,
      ),

      actionPoints: applyBoundedChange(
        campaignState.resources.actionPoints,
        effects.actionPoints,
        0,
      ),
    },

    metrics: {
      publicSuspicion: applyBoundedChange(
        campaignState.metrics.publicSuspicion,
        effects.publicSuspicion,
        0,
        100,
      ),

      partyConfidence: applyBoundedChange(
        campaignState.metrics.partyConfidence,
        effects.partyConfidence,
        0,
        100,
      ),

      voterEnergy: applyBoundedChange(
        campaignState.metrics.voterEnergy,
        effects.voterEnergy,
        0,
        100,
      ),
    },
  };
}

function applyBoundedChange(
  currentValue: number,
  change: number | undefined,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
): number {
  if (change === undefined || !Number.isFinite(change)) {
    return currentValue;
  }

  return Math.min(
    maximum,
    Math.max(minimum, currentValue + change),
  );
}