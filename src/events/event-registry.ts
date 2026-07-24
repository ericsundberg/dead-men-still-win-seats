import type {
  EventId,
  EventPackDefinition,
  EventPackId,
  GameEventDefinition,
} from './event-types';

export class EventRegistry {
  private readonly eventDefinitions =
    new Map<EventId, GameEventDefinition>();

  private readonly eventPackIds =
    new Set<EventPackId>();

  public registerPack(
    eventPack: EventPackDefinition,
  ): void {
    if (this.eventPackIds.has(eventPack.eventPackId)) {
      throw new Error(
        `Event pack is already registered: ${eventPack.eventPackId}`,
      );
    }

    const incomingEventIds = new Set<EventId>();

    for (const eventDefinition of eventPack.events) {
      if (
        incomingEventIds.has(eventDefinition.id)
        || this.eventDefinitions.has(eventDefinition.id)
      ) {
        throw new Error(
          `Event ID is already registered: ${eventDefinition.id}`,
        );
      }

      incomingEventIds.add(eventDefinition.id);
    }

    this.eventPackIds.add(eventPack.eventPackId);

    for (const eventDefinition of eventPack.events) {
      this.eventDefinitions.set(
        eventDefinition.id,
        eventDefinition,
      );
    }
  }

  public getEvent(
    eventId: EventId,
  ): GameEventDefinition | null {
    return this.eventDefinitions.get(eventId) ?? null;
  }

  public hasEvent(eventId: EventId): boolean {
    return this.eventDefinitions.has(eventId);
  }

  public getEvents(): readonly GameEventDefinition[] {
    return [...this.eventDefinitions.values()];
  }

  public getEventIds(): readonly EventId[] {
    return [...this.eventDefinitions.keys()];
  }

  public getEventPackIds(): readonly EventPackId[] {
    return [...this.eventPackIds];
  }
}

export function createEventRegistry(
  eventPacks: readonly EventPackDefinition[] = [],
): EventRegistry {
  const registry = new EventRegistry();

  for (const eventPack of eventPacks) {
    registry.registerPack(eventPack);
  }

  return registry;
}