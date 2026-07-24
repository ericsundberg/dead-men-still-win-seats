export const localizedTextKeys = [
  'startup.disclaimer',

  'characterDefaults.childGivenName',
  'characterDefaults.heirGivenName',

  'gameSetup.title',
  'gameSetup.description',
  'gameSetup.difficultyHeading',
  'gameSetup.difficultyDescription',
  'gameSetup.difficulty.easy.label',
  'gameSetup.difficulty.easy.duration',
  'gameSetup.difficulty.easy.description',
  'gameSetup.difficulty.moderate.label',
  'gameSetup.difficulty.moderate.duration',
  'gameSetup.difficulty.moderate.description',
  'gameSetup.difficulty.hardliner.label',
  'gameSetup.difficulty.hardliner.duration',
  'gameSetup.difficulty.hardliner.description',
  'gameSetup.difficulty.farGone.label',
  'gameSetup.difficulty.farGone.duration',
  'gameSetup.difficulty.farGone.description',
  'gameSetup.startGameButton',
  'gameSetup.backButton',
  'gameSetup.startYearNote',

  'gameSetup.givenNameLabel',
  'gameSetup.givenNamePlaceholder',
  'gameSetup.familyNameLabel',
  'gameSetup.familyNamePlaceholder',
  'gameSetup.startingAgeLabel',
  'gameSetup.genderLabel',
  'gameSetup.genderUnspecified',
  'gameSetup.genderWoman',
  'gameSetup.genderMan',
  'gameSetup.genderNonbinary',

  'rulerStats.rulerLabel',
  'rulerStats.ageLabel',
  'rulerStats.genderLabel',
  'rulerStats.healthLabel',
  'rulerStats.unknownValue',
  'yearlyTurn.yearLabel',
  'yearlyTurn.inReignOf',
] as const;

export type LocalizedTextKey = typeof localizedTextKeys[number];

export type LocalizationDictionary = Record<LocalizedTextKey, string>;

let activeLocalization = createKeyFallbackLocalization();

export function text(key: LocalizedTextKey): string {
  return activeLocalization[key];
}

export function setLocalizedText(
  localization: Record<string, string>,
): void {
  activeLocalization = createLocalizationDictionary(localization);
}

export async function loadLocalizedText(languageCode = 'en-us'): Promise<void> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}assets/localization/${languageCode}.json`,
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load localization file for ${languageCode}: ${response.status}`,
    );
  }

  const localization = await response.json() as Record<string, string>;

  setLocalizedText(localization);
}

export function getMissingLocalizationKeys(
  localization: Record<string, string>,
): LocalizedTextKey[] {
  return localizedTextKeys.filter((key) => !(key in localization));
}

export function getExtraLocalizationKeys(
  localization: Record<string, string>,
): string[] {
  const expectedKeys = new Set<string>(localizedTextKeys);

  return Object.keys(localization).filter((key) => !expectedKeys.has(key));
}

function createLocalizationDictionary(
  localization: Record<string, string>,
): LocalizationDictionary {
  const missingKeys = getMissingLocalizationKeys(localization);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing localization keys: ${missingKeys.join(', ')}`,
    );
  }

  const dictionary = {} as LocalizationDictionary;

  for (const key of localizedTextKeys) {
    dictionary[key] = localization[key];
  }

  return dictionary;
}

function createKeyFallbackLocalization(): LocalizationDictionary {
  const dictionary = {} as LocalizationDictionary;

  for (const key of localizedTextKeys) {
    dictionary[key] = key;
  }

  return dictionary;
}