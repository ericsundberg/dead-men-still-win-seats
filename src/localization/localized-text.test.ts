import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getExtraLocalizationKeys,
  getMissingLocalizationKeys,
  localizedTextKeys,
  setLocalizedText,
  text,
} from './localized-text';

function readPublicEnglishLocalization(): Record<string, string> {
  const filePath = join(
    process.cwd(),
    'public',
    'assets',
    'localization',
    'en-us.json',
  );

  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, string>;
}

describe('localized text', () => {
  it('loads text from the public English localization asset', () => {
    const publicLocalization = readPublicEnglishLocalization();

    setLocalizedText(publicLocalization);

    expect(text('gameSetup.title')).toBe('Game Setup');
    expect(text('gameSetup.difficulty.easy.duration')).toBe('3 months (13 turns)');
    expect(text('characterDefaults.childGivenName')).toBe('Child');
  });

  it('keeps the public English localization asset aligned with typed keys', () => {
    const publicLocalization = readPublicEnglishLocalization();
    const expectedKeys = [...localizedTextKeys].sort();
    const publicKeys = Object.keys(publicLocalization).sort();

    expect(publicKeys).toEqual(expectedKeys);
    expect(getMissingLocalizationKeys(publicLocalization)).toEqual([]);
    expect(getExtraLocalizationKeys(publicLocalization)).toEqual([]);
  });
});