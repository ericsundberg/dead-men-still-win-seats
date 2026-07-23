import { describe, expect, it } from 'vitest';
import {
  calculateAnnualHealthChangeChance,
  calculateBaseCharacterHealth,
  calculateExpectedCharacterHealth,
  childCharacterHealth,
  elderHealthCurveStrength,
  formatCharacterHealth,
  primeCharacterHealth,
  rollAnnualHealthChange,
} from './character-health';

describe('character health', () => {
  it('sets child health before age 15', () => {
    expect(calculateBaseCharacterHealth(0)).toBe(childCharacterHealth);
    expect(calculateBaseCharacterHealth(14)).toBe(childCharacterHealth);
  });

  it('increases expected health between age 15 and 25', () => {
    expect(calculateExpectedCharacterHealth(15)).toBe(4);
    expect(calculateExpectedCharacterHealth(20)).toBe(4.5);
    expect(calculateExpectedCharacterHealth(24)).toBe(4.9);
    expect(calculateBaseCharacterHealth(24)).toBe(4.9);
  });

  it('sets prime health at age 25', () => {
    expect(calculateBaseCharacterHealth(25)).toBe(primeCharacterHealth);
  });

  it('slowly declines expected health from age 25 to 65', () => {
    expect(calculateExpectedCharacterHealth(25)).toBe(5);
    expect(calculateExpectedCharacterHealth(45)).toBe(4.5);
    expect(calculateExpectedCharacterHealth(65)).toBe(4);
  });

  it('uses an accelerating elder decline curve after age 65', () => {
    expect(elderHealthCurveStrength).toBe(2);
    expect(calculateExpectedCharacterHealth(65)).toBe(4);
    expect(calculateExpectedCharacterHealth(70)).toBeCloseTo(3.5939);
    expect(calculateExpectedCharacterHealth(75)).toBeCloseTo(2.9242);
    expect(calculateExpectedCharacterHealth(80)).toBeCloseTo(1.8202);
    expect(calculateExpectedCharacterHealth(85)).toBeCloseTo(0);
  });

  it('continues below zero after age 85', () => {
    expect(calculateExpectedCharacterHealth(86)).toBeCloseTo(-0.4865);
    expect(calculateBaseCharacterHealth(86)).toBe(-0.5);
  });

  it('converts expected annual deltas into probabilistic 0.1 health steps', () => {
    expect(calculateAnnualHealthChangeChance(25, 26)).toEqual({
      direction: 'decrease',
      guaranteedSteps: 0,
      additionalStepChance: 0.25,
      stepSize: 0.1,
      expectedDelta: -0.025,
    });

    expect(calculateAnnualHealthChangeChance(65, 66)).toEqual({
      direction: 'decrease',
      guaranteedSteps: 0,
      additionalStepChance: 0.6584,
      stepSize: 0.1,
      expectedDelta: -0.0658,
    });

    expect(calculateAnnualHealthChangeChance(75, 76)).toEqual({
      direction: 'decrease',
      guaranteedSteps: 1,
      additionalStepChance: 0.7898,
      stepSize: 0.1,
      expectedDelta: -0.179,
    });
  });

  it('rolls annual health changes from the chance model', () => {
    expect(rollAnnualHealthChange(25, 26, () => 0.24)).toBe(-0.1);
    expect(rollAnnualHealthChange(25, 26, () => 0.25)).toBe(0);

    expect(rollAnnualHealthChange(75, 76, () => 0.8)).toBe(-0.1);
    expect(rollAnnualHealthChange(75, 76, () => 0.7)).toBe(-0.2);
  });

  it('can increase health during adolescent growth', () => {
    expect(calculateAnnualHealthChangeChance(15, 16)).toEqual({
      direction: 'increase',
      guaranteedSteps: 1,
      additionalStepChance: 0,
      stepSize: 0.1,
      expectedDelta: 0.1,
    });

    expect(rollAnnualHealthChange(15, 16, () => 0.99)).toBe(0.1);
  });

  it('formats health to one decimal place while hiding trailing zero', () => {
    expect(formatCharacterHealth(5)).toBe('5');
    expect(formatCharacterHealth(4.9)).toBe('4.9');
    expect(formatCharacterHealth(4.94)).toBe('4.9');
    expect(formatCharacterHealth(4.96)).toBe('5');
    expect(formatCharacterHealth(-0.1)).toBe('-0.1');
  });
});