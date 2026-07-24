import { describe, expect, it } from 'vitest';
import { applyCampaignEffects } from './campaign-effects';
import { createInitialCampaignState } from './campaign-state';

describe('campaign effects', () => {
  it('applies resource and metric changes', () => {
    const campaignState = createInitialCampaignState();

    const nextState = applyCampaignEffects(campaignState, {
      cash: -5_000,
      favors: 2,
      actionPoints: -1,
      publicSuspicion: 15,
      partyConfidence: -20,
      voterEnergy: -30,
    });

    expect(nextState.resources).toEqual({
      cash: 95_000,
      favors: 5,
      actionPoints: 2,
    });

    expect(nextState.metrics).toEqual({
      publicSuspicion: 15,
      partyConfidence: 80,
      voterEnergy: 70,
    });
  });

  it('prevents resources from falling below zero', () => {
    const campaignState = createInitialCampaignState();

    const nextState = applyCampaignEffects(campaignState, {
      cash: -1_000_000,
      favors: -100,
      actionPoints: -100,
    });

    expect(nextState.resources).toEqual({
      cash: 0,
      favors: 0,
      actionPoints: 0,
    });
  });

  it('keeps metrics between zero and one hundred', () => {
    const campaignState = createInitialCampaignState();

    const nextState = applyCampaignEffects(campaignState, {
      publicSuspicion: 150,
      partyConfidence: -200,
      voterEnergy: -200,
    });

    expect(nextState.metrics).toEqual({
      publicSuspicion: 100,
      partyConfidence: 0,
      voterEnergy: 0,
    });
  });

  it('ignores non-finite changes', () => {
    const campaignState = createInitialCampaignState();

    const nextState = applyCampaignEffects(campaignState, {
      cash: Number.NaN,
      publicSuspicion: Number.POSITIVE_INFINITY,
    });

    expect(nextState.resources.cash).toBe(
      campaignState.resources.cash,
    );
    expect(nextState.metrics.publicSuspicion).toBe(
      campaignState.metrics.publicSuspicion,
    );
  });

  it('does not mutate the previous campaign state', () => {
    const campaignState = createInitialCampaignState();

    const nextState = applyCampaignEffects(campaignState, {
      cash: -1_000,
    });

    expect(nextState).not.toBe(campaignState);
    expect(nextState.resources).not.toBe(campaignState.resources);
    expect(campaignState.resources.cash).toBe(100_000);
    expect(nextState.resources.cash).toBe(99_000);
  });
});