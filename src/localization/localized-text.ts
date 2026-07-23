export const defaultLocalizedText = {
  'characterDefaults.childGivenName': 'Child',
  'characterDefaults.heirGivenName': 'Heir',

  'gameSetup.title': 'Game Setup',
  'gameSetup.description': 'Choose how long the campaign must conceal the Senator’s death before Election Day.',
  'gameSetup.difficultyHeading': 'Select Difficulty',
  'gameSetup.difficultyDescription': 'Longer campaigns mean more turns, more time, and more chances for the truth to leak.',
  'gameSetup.difficulty.easy.label': 'Easy',
  'gameSetup.difficulty.easy.duration': '3 months (13 turns)',
  'gameSetup.difficulty.easy.description': 'The election is close. Keep smiling through the final sprint.',
  'gameSetup.difficulty.moderate.label': 'Moderate',
  'gameSetup.difficulty.moderate.duration': '6 months (26 turns)',
  'gameSetup.difficulty.moderate.description': 'There is enough time for problems to pile up.',
  'gameSetup.difficulty.hardliner.label': 'Hardliner',
  'gameSetup.difficulty.hardliner.duration': '12 months (52 turns)',
  'gameSetup.difficulty.hardliner.description': 'A full year of excuses, appearances, rumors, and paperwork.',
  'gameSetup.difficulty.farGone.label': 'Far Gone',
  'gameSetup.difficulty.farGone.duration': '18 months (78 turns)',
  'gameSetup.difficulty.farGone.description': 'The campaign has been dead on arrival for a very long time.',
  'gameSetup.startGameButton': 'Start Game',
  'gameSetup.backButton': 'Back',
  'gameSetup.startYearNote': 'The campaign begins with the Senator’s condition still concealed.',

  'gameSetup.givenNameLabel': 'Given name',
  'gameSetup.givenNamePlaceholder': 'Ruler',
  'gameSetup.familyNameLabel': 'Family name',
  'gameSetup.familyNamePlaceholder': 'House',
  'gameSetup.startingAgeLabel': 'Starting age',
  'gameSetup.genderLabel': 'Gender',
  'gameSetup.genderUnspecified': 'Unspecified',
  'gameSetup.genderWoman': 'Woman',
  'gameSetup.genderMan': 'Man',
  'gameSetup.genderNonbinary': 'Nonbinary',

  'rulerStats.rulerLabel': 'Ruler',
  'rulerStats.ageLabel': 'Age',
  'rulerStats.genderLabel': 'Gender',
  'rulerStats.healthLabel': 'Health',
  'rulerStats.unknownValue': 'Unknown',
  'yearlyTurn.yearLabel': 'Year',
  'yearlyTurn.inReignOf': 'in the reign of',
} as const;

export type LocalizedTextKey = keyof typeof defaultLocalizedText;

export function text(key: LocalizedTextKey): string {
  return defaultLocalizedText[key];
}