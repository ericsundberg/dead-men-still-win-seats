import { describe, expect, it } from 'vitest';
import {
  createInitialCampaignState,
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

  it('copies custom starting resources and metrics', () => {
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

    expect(campaignState.resources).not.toBe(
      defaultCampaignStartingValues.resources,
    );
    expect(campaignState.metrics).not.toBe(
      defaultCampaignStartingValues.metrics,
    );
  });
});