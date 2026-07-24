import { describe, expect, it } from 'vitest';
import type {
  EventPackDefinition,
  GameEventDefinition,
} from './event-types';
import {
  createEventRegistry,
  EventRegistry,
} from './event-registry';

function createGovernorEvent(
  eventId: GameEventDefinition['id'] =
    'event_governor_01',
): GameEventDefinition {
  return {
    id: eventId,
    title: 'The Governor Calls',
    description:
      'The Governor would like proof that the Senator remains available.',
    trigger: {
      type: 'manual',
    },
    decisions: [
      {
        id: 'decision_take_call',
        label: 'Take the call.',
      },
    ],
  };
}

function createGovernorPack(): EventPackDefinition {
  return {
    eventPackId: 'events_governor',
    events: [
      createGovernorEvent(),
    ],
  };
}

describe('event registry', () => {
  it('registers and retrieves event definitions', () => {
    const registry = createEventRegistry([
      createGovernorPack(),
    ]);

    expect(registry.hasEvent('event_governor_01')).toBe(true);
    expect(
      registry.getEvent('event_governor_01')?.title,
    ).toBe('The Governor Calls');

    expect(registry.getEventIds()).toEqual([
      'event_governor_01',
    ]);

    expect(registry.getEventPackIds()).toEqual([
      'events_governor',
    ]);
  });

  it('returns null for an unknown event ID', () => {
    const registry = createEventRegistry();

    expect(
      registry.getEvent('event_governor_99'),
    ).toBeNull();
  });

  it('rejects duplicate event pack IDs', () => {
    const registry = new EventRegistry();
    const eventPack = createGovernorPack();

    registry.registerPack(eventPack);

    expect(() => registry.registerPack(eventPack)).toThrow(
      /Event pack is already registered: events_governor/,
    );
  });

  it('rejects duplicate event IDs without partially registering a pack', () => {
    const registry = new EventRegistry();

    registry.registerPack(createGovernorPack());

    const duplicatePack = {
      eventPackId: 'events_governor_archive',
      events: [
        createGovernorEvent('event_governor_01'),
        createGovernorEvent('event_governor_02'),
      ],
    } as EventPackDefinition;

    expect(() => registry.registerPack(duplicatePack)).toThrow(
      /Event ID is already registered: event_governor_01/,
    );

    expect(
      registry.getEventPackIds(),
    ).not.toContain('events_governor_archive');

    expect(
      registry.hasEvent('event_governor_02'),
    ).toBe(false);
  });
});