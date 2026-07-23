import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  defaultLocalizedText,
  text,
  type LocalizedTextKey,
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
  it('returns text for known keys', () => {
    expect(text('gameSetup.title')).toBe('Create Ruler');
  });

  it('keeps the public English localization asset aligned with typed defaults', () => {
    const publicLocalization = readPublicEnglishLocalization();
    const defaultKeys = Object.keys(defaultLocalizedText).sort();
    const publicKeys = Object.keys(publicLocalization).sort();

    expect(publicKeys).toEqual(defaultKeys);

    for (const key of defaultKeys) {
      expect(publicLocalization[key]).toBe(
        defaultLocalizedText[key as LocalizedTextKey],
      );
    }
  });
});