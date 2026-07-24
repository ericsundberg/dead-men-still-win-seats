import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setLocalizedText } from '../localization/localized-text';

export function loadTestLocalization(): void {
  const localizationPath = join(
    process.cwd(),
    'public',
    'assets',
    'localization',
    'en-us.json',
  );

  const localization = JSON.parse(
    readFileSync(localizationPath, 'utf8'),
  ) as Record<string, string>;

  setLocalizedText(localization);
}