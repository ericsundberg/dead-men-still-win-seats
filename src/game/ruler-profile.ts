export type RulerGender = 'unspecified' | 'woman' | 'man' | 'nonbinary';

export interface RulerCreationInput {
  readonly givenName: string;
  readonly familyName: string;
  readonly startingAge: number;
  readonly gender: RulerGender;
}

export interface RulerProfile {
  readonly givenName: string;
  readonly familyName: string;
  readonly startingAge: number;
  readonly gender: RulerGender;
}

export const defaultRulerProfile: RulerProfile = {
  givenName: 'Ruler',
  familyName: 'House',
  startingAge: 25,
  gender: 'unspecified',
};

export function createRulerProfile(
  input: Partial<RulerCreationInput>,
): RulerProfile {
  return {
    givenName: normalizeNamePart(input.givenName, defaultRulerProfile.givenName),
    familyName: normalizeNamePart(input.familyName, defaultRulerProfile.familyName),
    startingAge: normalizeStartingAge(input.startingAge),
    gender: input.gender ?? defaultRulerProfile.gender,
  };
}

export function formatRulerName(rulerProfile: RulerProfile): string {
  return `${rulerProfile.givenName} ${rulerProfile.familyName}`;
}

function normalizeNamePart(value: string | undefined, fallback: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue;
}

function normalizeStartingAge(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultRulerProfile.startingAge;
  }

  const wholeAge = Math.floor(value);

  return Math.min(99, Math.max(1, wholeAge));
}