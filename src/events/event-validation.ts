import type {
  EventPackDefinition,
} from './event-types';

type UnknownRecord = Record<string, unknown>;

const eventPackIdPattern =
  /^events_[a-z0-9]+(?:_[a-z0-9]+)*$/;

const eventIdPattern =
  /^event_[a-z0-9]+(?:_[a-z0-9]+)*_(?:0[1-9]|[1-9][0-9])$/;

const decisionIdPattern =
  /^decision_[a-z0-9]+(?:_[a-z0-9]+)*$/;

const campaignEffectKeys = new Set([
  'cash',
  'favors',
  'actionPoints',
  'publicSuspicion',
  'partyConfidence',
  'voterEnergy',
]);

const requirementNumberKeys = [
  'minimumCash',
  'minimumFavors',
  'minimumActionPoints',
] as const;

export class EventValidationError extends Error {
  public constructor(
    public readonly validationErrors: readonly string[],
  ) {
    super(validationErrors.join('\n'));
    this.name = 'EventValidationError';
  }
}

export function isValidEventPackId(value: string): boolean {
  return eventPackIdPattern.test(value);
}

export function isValidEventId(value: string): boolean {
  return eventIdPattern.test(value);
}

export function validateEventPackDefinition(
  input: unknown,
): readonly string[] {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return ['event pack must be an object'];
  }

  const eventPackId = input.eventPackId;

  if (
    typeof eventPackId !== 'string'
    || !isValidEventPackId(eventPackId)
  ) {
    errors.push(
      'eventPackId must match events_<category>',
    );
  }

  if (!Array.isArray(input.events)) {
    errors.push('events must be an array');
    return errors;
  }

  if (input.events.length === 0) {
    errors.push('events must contain at least one event');
  }

  const seenEventIds = new Set<string>();

  input.events.forEach((event, index) => {
    validateEventDefinition(
      event,
      `events[${index}]`,
      typeof eventPackId === 'string'
        ? eventPackId
        : null,
      seenEventIds,
      errors,
    );
  });

  return errors;
}

export function parseEventPackDefinition(
  input: unknown,
): EventPackDefinition {
  const errors = validateEventPackDefinition(input);

  if (errors.length > 0) {
    throw new EventValidationError(errors);
  }

  return input as EventPackDefinition;
}

function validateEventDefinition(
  input: unknown,
  path: string,
  eventPackId: string | null,
  seenEventIds: Set<string>,
  errors: string[],
): void {
  if (!isRecord(input)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const eventId = input.id;

  if (
    typeof eventId !== 'string'
    || !isValidEventId(eventId)
  ) {
    errors.push(
      `${path}.id must match event_<category>_<01-99>`,
    );
  } else {
    if (seenEventIds.has(eventId)) {
      errors.push(`${path}.id is duplicated: ${eventId}`);
    }

    seenEventIds.add(eventId);

    if (
      eventPackId
      && isValidEventPackId(eventPackId)
    ) {
      const category = eventPackId.slice('events_'.length);
      const expectedPrefix = `event_${category}_`;

      if (!eventId.startsWith(expectedPrefix)) {
        errors.push(
          `${path}.id must use the category from ${eventPackId}`,
        );
      }
    }
  }

  validateRequiredText(input.title, `${path}.title`, errors);
  validateRequiredText(
    input.description,
    `${path}.description`,
    errors,
  );

  validateTrigger(input.trigger, `${path}.trigger`, errors);

  if (input.requirements !== undefined) {
    validateRequirements(
      input.requirements,
      `${path}.requirements`,
      errors,
    );
  }

  if (
    input.repeatable !== undefined
    && typeof input.repeatable !== 'boolean'
  ) {
    errors.push(`${path}.repeatable must be a boolean`);
  }

  if (input.imagePath !== undefined) {
    validateRequiredText(
      input.imagePath,
      `${path}.imagePath`,
      errors,
    );
  }

  if (!Array.isArray(input.decisions)) {
    errors.push(`${path}.decisions must be an array`);
    return;
  }

  if (input.decisions.length === 0) {
    errors.push(
      `${path}.decisions must contain at least one decision`,
    );
  }

  const seenDecisionIds = new Set<string>();

  input.decisions.forEach((decision, index) => {
    validateDecision(
      decision,
      `${path}.decisions[${index}]`,
      seenDecisionIds,
      errors,
    );
  });
}

function validateTrigger(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (!isRecord(input)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (input.type === 'manual') {
    return;
  }

  if (input.type === 'turn') {
    if (
      typeof input.turn !== 'number'
      || !Number.isInteger(input.turn)
      || input.turn < 1
    ) {
      errors.push(
        `${path}.turn must be a positive integer`,
      );
    }

    return;
  }

  if (input.type === 'chance') {
    if (
      typeof input.chancePercent !== 'number'
      || !Number.isFinite(input.chancePercent)
      || input.chancePercent <= 0
      || input.chancePercent > 100
    ) {
      errors.push(
        `${path}.chancePercent must be greater than 0 and at most 100`,
      );
    }

    return;
  }

  errors.push(
    `${path}.type must be manual, turn, or chance`,
  );
}

function validateDecision(
  input: unknown,
  path: string,
  seenDecisionIds: Set<string>,
  errors: string[],
): void {
  if (!isRecord(input)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const decisionId = input.id;

  if (
    typeof decisionId !== 'string'
    || !decisionIdPattern.test(decisionId)
  ) {
    errors.push(
      `${path}.id must match decision_<name>`,
    );
  } else {
    if (seenDecisionIds.has(decisionId)) {
      errors.push(
        `${path}.id is duplicated: ${decisionId}`,
      );
    }

    seenDecisionIds.add(decisionId);
  }

  validateRequiredText(input.label, `${path}.label`, errors);

  if (input.requirements !== undefined) {
    validateRequirements(
      input.requirements,
      `${path}.requirements`,
      errors,
    );
  }

  if (input.effects !== undefined) {
    validateEffects(input.effects, `${path}.effects`, errors);
  }

  validateOptionalStringList(
    input.addFlags,
    `${path}.addFlags`,
    errors,
  );

  validateOptionalStringList(
    input.removeFlags,
    `${path}.removeFlags`,
    errors,
  );

  validateOptionalEventIdList(
    input.queueEventIds,
    `${path}.queueEventIds`,
    errors,
  );

  if (input.newsItems !== undefined) {
    validateNewsItems(
      input.newsItems,
      `${path}.newsItems`,
      errors,
    );
  }
}

function validateRequirements(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (!isRecord(input)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const key of requirementNumberKeys) {
    const value = input[key];

    if (
      value !== undefined
      && (
        typeof value !== 'number'
        || !Number.isFinite(value)
        || value < 0
      )
    ) {
      errors.push(
        `${path}.${key} must be a non-negative number`,
      );
    }
  }

  validateOptionalStringList(
    input.requiredFlags,
    `${path}.requiredFlags`,
    errors,
  );

  validateOptionalStringList(
    input.excludedFlags,
    `${path}.excludedFlags`,
    errors,
  );
}

function validateEffects(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (!isRecord(input)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const [key, value] of Object.entries(input)) {
    if (!campaignEffectKeys.has(key)) {
      errors.push(`${path}.${key} is not a known campaign effect`);
      continue;
    }

    if (
      typeof value !== 'number'
      || !Number.isFinite(value)
    ) {
      errors.push(`${path}.${key} must be a finite number`);
    }
  }
}

function validateOptionalEventIdList(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (input === undefined) {
    return;
  }

  if (!Array.isArray(input)) {
    errors.push(`${path} must be an array`);
    return;
  }

  input.forEach((eventId, index) => {
    if (
      typeof eventId !== 'string'
      || !isValidEventId(eventId)
    ) {
      errors.push(
        `${path}[${index}] must be a valid event ID`,
      );
    }
  });
}

function validateOptionalStringList(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (input === undefined) {
    return;
  }

  if (!Array.isArray(input)) {
    errors.push(`${path} must be an array`);
    return;
  }

  const seenValues = new Set<string>();

  input.forEach((value, index) => {
    if (
      typeof value !== 'string'
      || value.trim().length === 0
    ) {
      errors.push(
        `${path}[${index}] must be a non-empty string`,
      );
      return;
    }

    if (seenValues.has(value)) {
      errors.push(
        `${path}[${index}] is duplicated: ${value}`,
      );
    }

    seenValues.add(value);
  });
}

function validateNewsItems(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (!Array.isArray(input)) {
    errors.push(`${path} must be an array`);
    return;
  }

  input.forEach((newsItem, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isRecord(newsItem)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }

    validateRequiredText(
      newsItem.headline,
      `${itemPath}.headline`,
      errors,
    );

    if (newsItem.body !== undefined) {
      validateRequiredText(
        newsItem.body,
        `${itemPath}.body`,
        errors,
      );
    }

    if (newsItem.category !== undefined) {
      validateRequiredText(
        newsItem.category,
        `${itemPath}.category`,
        errors,
      );
    }
  });
}

function validateRequiredText(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (
    typeof input !== 'string'
    || input.trim().length === 0
  ) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function isRecord(input: unknown): input is UnknownRecord {
  return typeof input === 'object'
    && input !== null
    && !Array.isArray(input);
}