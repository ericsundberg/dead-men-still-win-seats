export const childCharacterHealth = 4;
export const primeCharacterHealth = 5;
export const childHealthAgeLimit = 15;
export const primeHealthAge = 25;
export const elderHealthAge = 65;
export const naturalHealthEndAge = 85;
export const elderHealthCurveStrength = 2;
export const healthChangeStep = 0.1;

const stepCountIntegerTolerance = 0.0000001;

export type HealthChangeDirection = 'increase' | 'decrease' | 'none';

export interface AnnualHealthChangeChance {
  readonly direction: HealthChangeDirection;
  readonly guaranteedSteps: number;
  readonly additionalStepChance: number;
  readonly stepSize: number;
  readonly expectedDelta: number;
}

export function calculateExpectedCharacterHealth(age: number): number {
  const normalizedAge = normalizeAge(age);

  if (normalizedAge < childHealthAgeLimit) {
    return childCharacterHealth;
  }

  if (normalizedAge < primeHealthAge) {
    return childCharacterHealth +
      ((normalizedAge - childHealthAgeLimit) /
        (primeHealthAge - childHealthAgeLimit));
  }

  if (normalizedAge < elderHealthAge) {
    return primeCharacterHealth -
      ((normalizedAge - primeHealthAge) /
        (elderHealthAge - primeHealthAge));
  }

  return calculateElderExpectedCharacterHealth(normalizedAge);
}

export function calculateBaseCharacterHealth(age: number): number {
  return roundHealth(calculateExpectedCharacterHealth(age));
}

export function calculateAnnualHealthChangeChance(
  previousAge: number,
  nextAge: number,
): AnnualHealthChangeChance {
  const expectedDelta =
    calculateExpectedCharacterHealth(nextAge) -
    calculateExpectedCharacterHealth(previousAge);

  const direction = getHealthChangeDirection(expectedDelta);

  if (direction === 'none') {
    return {
      direction,
      guaranteedSteps: 0,
      additionalStepChance: 0,
      stepSize: healthChangeStep,
      expectedDelta: 0,
    };
  }

  const exactStepCount = normalizeNearIntegerStepCount(
    Math.abs(expectedDelta) / healthChangeStep,
  );
  const guaranteedSteps = Math.floor(exactStepCount);
  const additionalStepChance = roundChance(exactStepCount - guaranteedSteps);

  return {
    direction,
    guaranteedSteps,
    additionalStepChance,
    stepSize: healthChangeStep,
    expectedDelta: normalizeSignedZero(roundChance(expectedDelta)),
  };
}

export function rollAnnualHealthChange(
  previousAge: number,
  nextAge: number,
  random: () => number = Math.random,
): number {
  const chance = calculateAnnualHealthChangeChance(previousAge, nextAge);

  if (chance.direction === 'none') {
    return 0;
  }

  const signedStep = chance.direction === 'increase'
    ? chance.stepSize
    : -chance.stepSize;
  const additionalStep = random() < chance.additionalStepChance
    ? 1
    : 0;
  const totalSteps = chance.guaranteedSteps + additionalStep;

  return roundHealth(signedStep * totalSteps);
}

export function formatCharacterHealth(health: number): string {
  return roundHealth(health).toFixed(1).replace(/\.0$/, '');
}

export function roundHealth(value: number): number {
  return normalizeSignedZero(Number.parseFloat(value.toFixed(1)));
}

function calculateElderExpectedCharacterHealth(age: number): number {
  const elderAgeSpan = naturalHealthEndAge - elderHealthAge;
  const ageProgress = (age - elderHealthAge) / elderAgeSpan;
  const declineProgress =
    (Math.exp(elderHealthCurveStrength * ageProgress) - 1) /
    (Math.exp(elderHealthCurveStrength) - 1);

  return childCharacterHealth * (1 - declineProgress);
}

function getHealthChangeDirection(expectedDelta: number): HealthChangeDirection {
  if (expectedDelta > 0) {
    return 'increase';
  }

  if (expectedDelta < 0) {
    return 'decrease';
  }

  return 'none';
}

function normalizeNearIntegerStepCount(value: number): number {
  const nearestInteger = Math.round(value);

  if (Math.abs(value - nearestInteger) < stepCountIntegerTolerance) {
    return nearestInteger;
  }

  return value;
}

function roundChance(value: number): number {
  return normalizeSignedZero(Number.parseFloat(value.toFixed(4)));
}

function normalizeAge(age: number): number {
  if (!Number.isFinite(age)) {
    return primeHealthAge;
  }

  return Math.max(0, Math.floor(age));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}