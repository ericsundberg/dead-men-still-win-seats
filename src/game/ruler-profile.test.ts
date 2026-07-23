import { describe, expect, it } from 'vitest';
import { createRulerProfile, formatRulerName } from './ruler-profile';

describe('ruler profile', () => {
  it('normalizes ruler creation input', () => {
    const rulerProfile = createRulerProfile({
      givenName: '  Ashurbanipal  ',
      familyName: '  Sargonid  ',
      startingAge: 31.9,
      gender: 'man',
    });

    expect(rulerProfile).toEqual({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });
  });

  it('uses defaults for blank names and invalid age', () => {
    const rulerProfile = createRulerProfile({
      givenName: '',
      familyName: '   ',
      startingAge: Number.NaN,
      gender: 'unspecified',
    });

    expect(rulerProfile).toEqual({
      givenName: 'Ruler',
      familyName: 'House',
      startingAge: 25,
      gender: 'unspecified',
    });
  });

  it('formats the display name', () => {
    const rulerProfile = createRulerProfile({
      givenName: 'Ashurbanipal',
      familyName: 'Sargonid',
      startingAge: 31,
      gender: 'man',
    });

    expect(formatRulerName(rulerProfile)).toBe('Ashurbanipal Sargonid');
  });
});