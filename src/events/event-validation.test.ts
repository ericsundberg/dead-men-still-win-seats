import { describe, expect, it } from 'vitest';
import type {
  EventPackDefinition,
  GameEventDefinition,
} from './event-types';
import {
  parseEventPackDefinition,
  validateEventPackDefinition,
} from './event-validation';

function createValidEvent(): GameEventDefinition {
  return {
    id: 'event_news_reporters_01',
    title: 'The Camera Is Already Rolling',
    description:
      'A local reporter corners the campaign outside a fundraiser.',
    trigger: {
      type: 'turn',
      turn: 1,
    },
    requirements: {
      excludedFlags: ['flag_reporter_banned'],
    },
    decisions: [
      {
        id: 'decision_deny_interview',
        label: 'Refuse the interview.',
        requirements: {
          minimumActionPoints: 1,
        },
        effects: {
          actionPoints: -1,
          publicSuspicion: 5,
        },
        addFlags: ['flag_reporter_angry'],
        queueEventIds: [
          'event_news_reporters_02',
        ],
        newsItems: [
          {
            headline:
              'Senator Abruptly Cancels Another Interview',
            category: 'campaign',
          },
        ],
      },
    ],
  };
}

function createValidPack(): EventPackDefinition {
  return {
    eventPackId: 'events_news_reporters',
    events: [
      createValidEvent(),
    ],
  };
}

describe('event validation', () => {
  it('accepts a valid clustered event pack', () => {
    const eventPack = createValidPack();

    expect(parseEventPackDefinition(eventPack)).toEqual(
      eventPack,
    );
    expect(validateEventPackDefinition(eventPack)).toEqual([]);
  });

  it('rejects an invalid event pack ID', () => {
    const eventPack = {
      ...createValidPack(),
      eventPackId: 'news-reporters',
    };

    expect(() => parseEventPackDefinition(eventPack)).toThrow(
      /eventPackId must match events_<category>/,
    );
  });

  it('rejects an invalid event ID', () => {
    const event = {
      ...createValidEvent(),
      id: 'news_reporters_01',
    };

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [event],
    })).toThrow(
      /id must match event_<category>_<01-99>/,
    );
  });

  it('requires event IDs to match their pack category', () => {
    const event = {
      ...createValidEvent(),
      id: 'event_governor_01',
    };

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [event],
    })).toThrow(
      /must use the category from events_news_reporters/,
    );
  });

  it('rejects duplicate event IDs inside a pack', () => {
    const event = createValidEvent();

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [event, event],
    })).toThrow(
      /id is duplicated: event_news_reporters_01/,
    );
  });

  it('rejects invalid turn and chance triggers', () => {
    const invalidTurnEvent = {
      ...createValidEvent(),
      trigger: {
        type: 'turn',
        turn: 0,
      },
    };

    const invalidChanceEvent = {
      ...createValidEvent(),
      trigger: {
        type: 'chance',
        chancePercent: 101,
      },
    };

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [invalidTurnEvent],
    })).toThrow(
      /turn must be a positive integer/,
    );

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [invalidChanceEvent],
    })).toThrow(
      /chancePercent must be greater than 0 and at most 100/,
    );
  });

  it('rejects an inverted turn-window trigger', () => {
    const invalidWindowEvent = {
      ...createValidEvent(),
      trigger: {
        type: 'turn-window',
        startTurn: 5,
        endTurn: 4,
      },
    };

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [
        invalidWindowEvent,
      ],
    })).toThrow(
      /endTurn must be greater than or equal to startTurn/,
    );
  });

  it('requires every event to have a decision', () => {
    const event = {
      ...createValidEvent(),
      decisions: [],
    };

    expect(() => parseEventPackDefinition({
      ...createValidPack(),
      events: [event],
    })).toThrow(
      /decisions must contain at least one decision/,
    );
  });

  it('rejects malformed requirements, effects, and queued IDs', () => {
    const event = createValidEvent();

    const malformedDecision = {
      ...event.decisions[0],
      requirements: {
        minimumCash: -1,
      },
      effects: {
        publicSuspicion: Number.NaN,
        typoEffect: 5,
      },
      queueEventIds: [
        'news_reporters_02',
      ],
    };

    const errors = validateEventPackDefinition({
      ...createValidPack(),
      events: [
        {
          ...event,
          decisions: [malformedDecision],
        },
      ],
    });

    expect(errors).toContain(
      'events[0].decisions[0].requirements.minimumCash must be a non-negative number',
    );

    expect(errors).toContain(
      'events[0].decisions[0].effects.publicSuspicion must be a finite number',
    );

    expect(errors).toContain(
      'events[0].decisions[0].effects.typoEffect is not a known campaign effect',
    );

    expect(errors).toContain(
      'events[0].decisions[0].queueEventIds[0] must be a valid event ID',
    );
  });
});