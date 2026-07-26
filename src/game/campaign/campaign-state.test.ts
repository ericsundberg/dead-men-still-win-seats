import { describe, expect, it } from 'vitest';
import {
  createInitialCampaignState,
  defaultCampaignPersonnel,
  defaultCampaignStartingValues,
} from './campaign-state';

describe('campaign state', () => {
  it('creates the default easy campaign state', () => {
    expect(createInitialCampaignState()).toEqual({
      difficultyId: 'easy',
      currentTurn: 1,
      totalTurns: 13,
      phase: 'turn-start',

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

      personnel: {
        staffers: 0,
        surrogates: 0,
      },

      flags: [],

      activeEventInstanceId: null,
      queuedEventIds: [],
      completedEventIds: [],

      newsFeed: [],
      endGameState: null,
    });
  });

  it('uses the selected difficulty campaign length', () => {
    const campaignState = createInitialCampaignState('far-gone');

    expect(campaignState.difficultyId).toBe('far-gone');
    expect(campaignState.totalTurns).toBe(78);
  });

  it('copies custom starting resources, metrics, and personnel', () => {
    const campaignState = createInitialCampaignState('moderate', {
      resources: {
        cash: 50_000,
        favors: 5,
        actionPoints: 4,
      },

      metrics: {
        publicSuspicion: 10,
        partyConfidence: 80,
        voterEnergy: 70,
      },

      personnel: {
        staffers: 2,
        surrogates: 1,
      },
    });

    expect(campaignState.totalTurns).toBe(26);
    expect(campaignState.resources).toEqual({
      cash: 50_000,
      favors: 5,
      actionPoints: 4,
    });
    expect(campaignState.metrics).toEqual({
      publicSuspicion: 10,
      partyConfidence: 80,
      voterEnergy: 70,
    });
    expect(campaignState.personnel).toEqual({
      staffers: 2,
      surrogates: 1,
    });

    expect(campaignState.resources).not.toBe(
      defaultCampaignStartingValues.resources,
    );
    expect(campaignState.metrics).not.toBe(
      defaultCampaignStartingValues.metrics,
    );
    expect(campaignState.personnel).not.toBe(
      defaultCampaignStartingValues.personnel,
    );
  });

  it('defaults omitted custom personnel values to zero', () => {
    const campaignState = createInitialCampaignState('easy', {
      resources: {
        cash: 80_000,
        favors: 4,
        actionPoints: 3,
      },

      metrics: {
        publicSuspicion: 5,
        partyConfidence: 90,
        voterEnergy: 85,
      },
    });

    expect(campaignState.personnel).toEqual(defaultCampaignPersonnel);
    expect(campaignState.personnel).not.toBe(defaultCampaignPersonnel);
  });
});
